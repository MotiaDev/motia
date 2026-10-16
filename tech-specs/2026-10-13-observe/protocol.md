# Protocol and engine internals

Everything here is **additive** until phase 6:

- new message variants, sent only to peers that declared the matching feature;
- new optional fields on existing variants.

Current engines warn and ignore unknown message types
(`engine/src/engine/mod.rs`, the `json decode error` arm of the read loop).
Node, Python, Go and the browser SDK ignore them silently. The Rust SDK cannot
decode them: its enum has no `#[serde(other)]`, so it logs one warning per
frame. That is why the engine **must not** push new variants to a peer that did
not opt in.

## 1. Feature negotiation

- **Engine → worker.** `WorkerRegistered` gains `features: ["observe.v1", "local-dispatch.v1"]`.
- **Worker → engine.** The `engine::workers::register` payload gains `features: [...]`.
  - Node and the browser SDK send it before the registration replay. Rust sends it after.
  - Either order works, because the engine already buffers a connection's registrations until `workers::register` resolves its namespace (`is_namespaced_registration`, `engine/src/engine/mod.rs:150`).
  - If the namespace grace timer drains first, the connection is treated as legacy until its `workers::register` arrives. At that point the engine sends `functionregistered` for the functions the connection already registered.
- **The SDK enables `observe()`** only when the engine advertised `observe.v1`. Otherwise `observe()` fails with `UNSUPPORTED`.
- **The SDK enables local dispatch** for a function only after `functionregistered` arrived for it.
- **A function with `observe.delivery: owner` or with callbacks** needs `observe.v1` on both sides. Against an old engine the SDK registers it as a plain function and logs that its observe hooks are inactive.

| | old SDK | new SDK |
|---|---|---|
| **old engine** | n/a | `observe()` → `UNSUPPORTED`. No `functionregistered` ever arrives, so no local dispatch and no hooks; `trigger()` behaves as today. |
| **new engine** | No pushes. Every call is routed and evaluated by the engine. The SDK's functions **are** observable; it just cannot observe, and its trigger types keep working through the old path. | full |

## 2. Messages

All of them follow the existing `#[serde(tag = "type", rename_all = "lowercase")]` scheme.

### 2.1 Old → new

| Today | New | Direction |
|---|---|---|
| `registertriggertype {id, description, trigger_request_format, call_request_format}` | `registerfunction {…, request_format (was call_request_format), response_format, observe: {delivery, args_format (was trigger_request_format; owner only), legacy_trigger_type?, allow?}}` | worker → engine |
| *(none: `registerfunction` has no success ack, only `registrationrejected` on conflict)* | `functionregistered {id, namespace, revision, observers}` | engine → owner |
| `registertrigger {id, trigger_type, function_id, config, metadata}` | `observe {id, source: {function_id, namespace, args, filters, capture, on, deliver}, target: {function_id, namespace}, metadata, max_fires, expires_in_ms, max_in_flight}` | observing worker → engine |
| `registertrigger` (forwarded to the provider) | `observeradded {function_id, revision, observer}` | engine → owner |
| `triggerregistrationresult` (provider's answer) | `observerack {function_id, id, revision, error?}` | owner → engine |
| `triggerregistrationresult` (to the registrant) | `observeresult {id, state, error?, warnings?}` + `observerstatechanged` | engine → observing worker |
| `unregistertrigger` | `unobserve {id}` | observing worker → engine |
| `unregistertrigger` (forwarded to the provider) | `observerremoved {function_id, revision, id}` | engine → owner |
| provider fires: one `invokefunction(target, void)` per binding | auto (matched local calls) and owner `obs.emit`: `invocationsobserved {items}` (batched), then engine activations; owner `obs.call`: `invokefunction {function_id: target, activation}` | owner → engine |
| `unregistertriggertype` (every SDK sends it; the engine has no variant) | removed | — |
| — | `localinvocationstats` | owner → engine |
| — | `InvokeFunction.caller`, `.observe_depth`, `.activation` | both |

The four trigger messages and `registertriggertype` are removed in phase 6.

### 2.2 Worker → engine

```jsonc
// RegisterFunction gains an optional `observe` descriptor. Callbacks are SDK-local and never sent.
{ "type": "registerfunction", "id": "http::on-request",
  "description": "One invocation per HTTP request. Observe it to register a route.",
  "request_format": { … HttpRequest … }, "response_format": { … HttpResponse … },
  "observe": {
    "delivery": "owner",                          // auto (default) | owner
    // owner only. args_format on an auto function → registrationrejected { code: "INVALID_OBSERVE_DESCRIPTOR" }
    "args_format": { "type": "object", "additionalProperties": false, "required": ["method", "path"],
                     "properties": { "method": { "type": "string" }, "path": { "type": "string" },
                                     "public_webhook": { "type": "boolean" },
                                     "middleware_function_ids": { "type": "array", "items": { "type": "string" } },
                                     "condition_function_id": { "type": "string" } } },
    "legacy_trigger_type": "http",                // phase 5 shim, optional
    "allow": true } }                             // false → NOT_OBSERVABLE

// create, or idempotently replay, an observer. Owner = this connection.
// `source` is the left side of iii.observe, `target` the right side.
{ "type": "observe",
  "id": "5b0c…",                                  // client-generated UUID, stable across replays
  "source": {
    "function_id": "cron::on-tick",
    "namespace": "default",                       // optional; same resolution as InvokeFunction
    "args": { "expression": "0 0 9 * * Mon-Fri" },   // optional; validated against the function's args_format
    "filters": { "input.scheduled_time": { "$gte": "2026-11-01T00:00:00Z" } },   // optional; {} = every invocation
    "capture": ["input"],                         // auto and obs.emit; default ["input","output","caller"]
    "on": "success",                              // auto only: success | error | complete
    "deliver": "envelope" },                      // auto and obs.emit: envelope | input | output
  "target": { "function_id": "local::cron-handler", "namespace": "default" },   // a registered function
  "max_fires": 1, "expires_in_ms": 600000, "max_in_flight": 64,   // optional policy
  "metadata": { … } }                             // optional; the activation's metadata sidecar

{ "type": "unobserve", "id": "5b0c…" }

// owner acknowledges one added observer, after its onObserverAdded callback resolved.
// `error` rejects it (observer → error). The owner never changes the observer's filters.
// An owner may re-send an ack for an active observer at any time with an error
// (late rejection, e.g. a config reload removed a database).
{ "type": "observerack", "function_id": "cron::on-tick", "namespace": "default",
  "id": "9e1…", "revision": 7,
  "error": { "code": "INVALID_CRON_EXPRESSION", "message": "invalid day-of-week field" } }   // when rejected

// matched local invocations of auto functions, and obs.emit events of owner functions,
// batched (≤ 256 items, ≤ 5 ms linger, 16 MiB frame cap)
{ "type": "invocationsobserved",
  "items": [ {
    "function_id": "database::on-row-changed", "namespace": "default",
    "invocation_id": "c3f…",
    "matched": ["5b0c…"],                         // auto: observer ids whose filters matched; owner: the emitted-to
                                                  // observers whose filters matched (same event coalesced)
    "status": "success",                          // success | error (always success for an emitted event)
    "input": { … }, "output": { … }, "error": { … },   // union of what the matched observers capture
    "caller": { "function_id": "database::execute", "invocation_id": "a1…",
                "parent": { "worker_id": "…", "worker_name": "billing", "function_id": "billing::close-invoice", "invocation_id": "77…" } },
    "metadata": { … },
    "started_at_ms": 1760350000123, "duration_ms": 0.004,
    "observe_depth": 0,
    "traceparent": "00-…", "baggage": "…" } ] }

// owner delivery: an ordinary InvokeFunction to the observer's target, marked with the activation
{ "type": "invokefunction", "invocation_id": "e7…", "function_id": "users::get",
  "data": { "method": "GET", "route": "/users/:id", "path": "/users/42", … },
  "activation": { "observer_id": "4f2…" } }

// periodic (every 10 s), only when non-zero
{ "type": "localinvocationstats", "window_ms": 10000,
  "functions": [ { "function_id": "database::on-row-changed", "count": 48211, "errors": 0, "duration_ms_sum": 190.2 } ],
  "dropped_reports": [ { "function_id": "database::on-row-changed", "reason": "buffer_full", "count": 12 } ] }
```

### 2.3 Engine → worker

```jsonc
// the RegisterFunction success ack, sent once per registration (and after a reconnect re-registration).
// Carries the full current set. Enables local dispatch for this function.
{ "type": "functionregistered", "id": "cron::on-tick", "namespace": "default",
  "revision": 12, "local_dispatch": true,
  "observers": [ { "id": "9e1…", "args": { "expression": "0 0 9 * * Mon-Fri" },
                      "filters": { "$and": [ { "input.scheduled_time": { "$gte": "2026-11-01T00:00:00Z" } } ] },   // the observer's, normalized
                      "target": "local::cron-handler", "capture": ["input"], "on": "success" } ] }

// one observer attached to a function this connection hosts. Awaits observerack.
{ "type": "observeradded", "function_id": "cron::on-tick", "namespace": "default",
  "revision": 13,
  "observer": { "id": "a07…", "args": { "expression": "0 0 9 * * Mon-Fri" },
                   "filters": { … the observer's filters, normalized … },
                   "target": "billing::send-reminders", "capture": ["input"], "on": "success",
                   "legacy": null } }             // legacy trigger config, phase 5 shim only

// one observer detached (unobserve, disposal, observer grace elapsed)
{ "type": "observerremoved", "function_id": "cron::on-tick", "namespace": "default",
  "revision": 14, "id": "a07…" }

// reply to observe (also sent on replay)
{ "type": "observeresult", "id": "5b0c…", "state": "pending",
  "error": { "code": "INVALID_FILTER_PATH", "message": "input.tabel is not in request_format" },  // when rejected
  "warnings": ["output.total: response_format is open; path not verified"] }

// lifecycle, sent to the observing worker
{ "type": "observerstatechanged", "id": "5b0c…", "state": "error",
  "reason": { "code": "HTTP_ROUTE_CONFLICT", "message": "Route 'GET /users/:uid' conflicts with …" }, "fires": 0 }
```

- The owner never receives an observer's owner connection, policy or
  metadata. It receives the args, the observer's filters (normalized), the
  target id, capture and `on`.
- `revision` is per `(namespace, function_id)` and increases by one on every
  add or remove. An SDK ignores an added/removed message whose revision is not
  greater than the one it holds on the same connection; `functionregistered` is
  always accepted and replaces the set (revisions restart after an engine
  restart).

### 2.4 Additions to `InvokeFunction`

| Field | Direction | Meaning |
|---|---|---|
| `caller: { function_id?, invocation_id?, parent? }` | worker → engine | Sent by the SDK when the call is made inside a handler. `parent` is the caller of that handler, one level only. |
| `caller: { worker_id, worker_name, function_id?, invocation_id?, parent? }` | engine → worker | `worker_*` is stamped by the engine from the calling connection. It replaces the `_caller_worker_id` injection into `data` (`engine/src/engine/mod.rs:841-851`), which stays for one deprecation window. |
| `observe_depth: u8` | both | Depth of the causal chain in observe hops. The SDK copies it from the current handler context into outgoing calls and reports. The engine sets `depth + 1` on activations. |
| `activation: { observer_id, activation_id? }` | both | Engine → worker: present on every activation. Worker → engine: marks an owner delivery (`obs.call`), validated in §3.5. |

## 3. Engine internals

### 3.1 New module `engine/src/observer/`

```rust
pub type FnKey = (String /*namespace*/, String /*function_id*/);

pub struct ObserverRegistry {
    by_id:       DashMap<ObsId, Arc<Observer>>,
    by_connection: DashMap<Uuid /*connection*/, HashSet<ObsId>>,
    by_function: DashMap<FnKey, Arc<FunctionEntry>>,
    /// Hot-path membership test for routed invocations: one lock-free load.
    observed: ArcSwap<HashSet<FnKey>>,
}

pub struct FunctionEntry {
    revision: AtomicU64,
    descriptor: ArcSwap<ObserveDescriptor>,       // delivery, args_format, legacy_trigger_type, allow
    active:  ArcSwap<Vec<Arc<Observer>>>,         // what the engine evaluates (auto) or accepts activations for (owner)
    all:     Mutex<Vec<Arc<Observer>>>,           // pending + active, for replay to a returning owner
    owner:   Mutex<Option<OwnerState>>,           // connection id, features, acked ids
}

pub struct Observer {
    id: ObsId, connection: Mutex<ConnectionRef>, function: FnKey, target: FnKey,
    args: Value,                                   // validated against args_format; sent to the owner
    filters: iii_filter::Compiled,                 // the observer's; the owner never changes them
    filters_src: Value,
    capture: CaptureSet, on: On, deliver: Deliver, metadata: Option<Value>,
    policy: Policy,                                // max_fires, expires_at, max_in_flight, max_queue
    legacy: Option<LegacyTrigger>,                 // phase 5 shim
    state: AtomicU8, reason: Mutex<Option<ErrorBody>>,
    fires: AtomicU64, dropped: DropCounters,
    in_flight: Semaphore, queue: Mutex<VecDeque<Activation>>,
    added_in_revision: AtomicU64, created_at: Instant,
}
```

Files:

- `registry.rs`: the maps above, validation on `observe` (args against `args_format`, filters, RBAC, limits, self-target).
- `owner.rs`: `functionregistered`, `observeradded` / `observerremoved`, `observerack` (including late rejections), replay to a re-registered owner, park on owner disconnect. The pending / re-home / fallback-namespace logic in `engine/src/trigger.rs` (`pending_triggers`, `resolve_provider_key`, `rehome_fallback_bindings`) moves here, keyed by function instead of by trigger type.
- `dispatch.rs`: activations from reports (auto calls and owner emits), `obs.call` validation, policy, loop guard, metadata sidecar.
- `lifecycle.rs`: states, transitions, `observerstatechanged`.

### 3.2 Hooks into existing code

| Where | What |
|---|---|
| `invocation/mod.rs` `handle_invocation_inner` (the single choke point for every routed invocation) | For **auto** functions: before the handler runs, `registry.watch(&ns, &function_id)`. If observed, keep `body` only when a filter or capture needs `input`, and record the start time. After `result` is known (including `Deferred` → `receiver.await`), `registry.on_completion(watch, completion)` evaluates and dispatches without blocking the reply. **Requires threading `namespace` and the caller info (connection, `caller`, `observe_depth`) into the function**; today it receives only `worker_id` / `caller: Option<&WorkerConnection>`. Owner functions are skipped here. |
| `engine/mod.rs` `router_msg` | New arms for `Observe`, `Unobserve`, `ObserverAck`, `InvocationsObserved`, `LocalInvocationStats`. `InvokeFunction` reads `caller`, `observe_depth`, `activation`. |
| `RegisterFunction` accepted (after the `function_owners` claim) | Validate the descriptor: `args_format` with `delivery: auto` → `registrationrejected { INVALID_OBSERVE_DESCRIPTOR }`. Store it. `registry.on_function_registered(key, conn)`: send `functionregistered` (if the connection has `observe.v1`) with every pending and active observer, mark them `pending` awaiting acks; for a legacy connection, move them straight to `active`. Functions are unique per `(namespace, id)` (`FUNCTION_NAMESPACE_CONFLICT`), so there is exactly one owner. |
| `UnregisterFunction`, `cleanup_worker` | Observers **on** the owner's functions go back to `pending` (replayed when the function registers again). Observers **created by** the connection go `suspended(OBSERVER_DISCONNECTED)` and start the grace timer. Observers **targeting** its functions go `suspended(TARGET_UNAVAILABLE)`. |
| `Reattach` | Re-parent `by_connection[previous]` to the new connection and resume. A replayed `observe` with the same id and spec is a no-op returning the current state; a different spec → `OBSERVER_ID_CONFLICT`. The owner side needs nothing special: the replayed `RegisterFunction` gets a fresh `functionregistered`. |
| worker connections / RBAC session | `local_dispatch` per function: global config ∧ the session has no `middleware_function_id` ∧ the connection may invoke the function itself. |
| `engine/src/trigger.rs` | Phase 5: shrinks to the legacy shim (§6). Phase 6: deleted. |
| engine-defined trigger types (`engine::functions-available`, `engine::workers-available`) | Become engine-hosted auto functions (`engine::on-functions-changed`, `engine::on-workers-changed`), evaluated by the engine itself. |
| `KNOWN_TRIGGER_TYPE_PROVIDERS` | Becomes a namespace → worker install hint shown on `pending` observers ("no worker hosts `http::on-request`; install `http`"). |

### 3.3 Lifecycle

```
 observe ─► pending ──── owner registered and acked (or owner is legacy), target available ────► active
              ▲  │                                                                                 │
              │  └─ owner rejected (observerack.error), invalid args/filters ───► error         │
              │                                                                                    │
              └────────────── owner disconnected or function unregistered ─────────────────────────┤
                                                                                                   ▼
             observing worker gone, target unavailable ────────────────────────────────────► suspended
             (resumes on Reattach within grace / when the target returns)
 unobserve │ max_fires reached │ expired │ observer grace elapsed │ error + observer disposes ──► disposed
```

- Only `active` observers are in `FunctionEntry.active`.
- Every transition sends `observerstatechanged` to the observing worker.
- Adding or removing an observer on a function bumps its revision and sends
  `observeradded` / `observerremoved` to the owner.
- `active` on an owner with local dispatch means the owner acked that
  observer. This is the completeness guarantee in README §6.
- A late rejection (`observerack` with `error` for an active observer)
  moves it to `error` and sends `observerremoved` back to the owner.

### 3.4 Reports: auto calls and owner emits

```
on_completion / on_report(item):
  for obs in matched (engine-evaluated, or item.matched ∩ active set for the reporter's function):
    if obs.state != active                     → drop(INACTIVE)
    if depth + 1 > max_observe_depth       → drop(LOOP_GUARD); warn once per obs per minute
    if expired                                 → dispose(EXPIRED); drop
    if max_fires and fires.fetch_add(1) >= max → drop(MAX_FIRES)
    envelope ← project(item, obs.capture, obs.deliver)
    if in_flight.try_acquire()                 → spawn invoke
    elif queue.len() < max_queue               → enqueue
    else                                       → drop(OVERFLOW)
    if fires == max_fires                      → dispose(MAX_FIRES) after dispatch
invoke:
  call(target_ns, target_fn, envelope,
       action = void,
       caller = { worker_name: "iii-engine", function_id: observed fn, invocation_id: observed invocation },
       activation = { observer_id, activation_id },
       observe_depth = depth + 1,
       traceparent = observed invocation's traceparent,
       metadata = obs.metadata)
```

- **Reports are validated first.** The reporting connection must be the current
  owner of `(namespace, function_id)` in `function_owners`. Otherwise the item
  is dropped and counted (`REPORTER_NOT_OWNER`). `matched` ids that are not
  active observers of that function are dropped (`INACTIVE`).
- **Both delivery modes report the same way.** For an `auto` function an item
  is a local invocation whose filters the SDK evaluated. For an `owner`
  function it is an `obs.emit`: the owner picked the observers from their
  args, and the SDK applied their filters. `on` is not checked for owner
  functions.
- **The engine does not re-evaluate filters on reports.** The owner is
  authoritative for its own function's data.
- **Activation authority (v1).** Activations run like today's trigger fires,
  with no session. Creation-time RBAC on the observed function and the target
  is the gate.

### 3.5 Owner delivery: validating `activation`

`obs.call` checks the observer's filters in the SDK first; a miss rejects with
`FILTERS_NOT_MATCHED` and sends nothing. An `InvokeFunction` from a worker that
carries `activation.observer_id`:

1. The observer exists → else `OBSERVER_NOT_FOUND`.
2. The sender is the current owner of the observed function → else `NOT_FUNCTION_OWNER`.
3. The observed function is `delivery: owner` → else `NOT_OWNER_DELIVERED`.
4. The observer is `active` → else `OBSERVER_NOT_ACTIVE`.
5. `function_id` equals the observer's target. The SDK fills it from the
   `target` it received; a mismatch → `TARGET_MISMATCH`.
6. Policy, in order: depth (`LOOP_GUARD`), expiry, `max_fires`, `max_in_flight`
   (an owner delivery over the limit fails with `OVERFLOW` rather than queueing,
   because the owner is waiting for a result).
7. The engine adds `metadata = obs.metadata`, `activation_id`, and
   `observe_depth + 1`, and routes the call as a normal invocation. The
   result returns to the owner as an ordinary `InvocationResult`.

Errors in 1–6 come back as the `InvocationResult.error` of that invocation, so
the owner's `obs.call()` rejects with the code.

### 3.6 Builtins, config, metrics, RBAC

**Builtins**
- `engine::observers::list({ function_id?, namespace?, worker? })`: RBAC-filtered to observers whose function the caller may see. Returns id, function, args, filters, target, observing worker name, delivery, state, reason, fires and drops by reason.
- `engine::observers::get({ id })`.
- `engine::observers::dispose({ id })`: the observing worker or an admin only.
- There is **no ownerless create function**. `engine::register_trigger`'s ownerless path, which skips the hook and is lost on restart, is not repeated.

**Config**

```yaml
observers:
  local_dispatch: true            # global kill switch for SDK in-process calls
  max_per_connection: 1024
  max_per_function: 4096
  max_observe_depth: 8
  observer_grace_ms: 30000
  owner_ack_timeout_ms: 30000     # an add not acked in time → error(OWNER_TIMEOUT)
  default_max_in_flight: 64
  max_queue_per_observer: 1024
```

**Metrics** (per function, not per observer, to bound cardinality)
- `iii_observer_activations_total{function_id, delivery}`
- `iii_observer_dropped_total{function_id, reason}`
- `iii_observer_reports_total{function_id}`
- `iii_observers{state}` (gauge)
- `iii_invocations_total{function_id, status, dispatch="local"}`, fed by `localinvocationstats`. Without it, the Console's invocation counts for locally dispatched functions would fall to zero.

**RBAC**
- `RbacConfig.on_observer_registration_function_id`: same contract as `on_trigger_registration_function_id`, which it replaces.
- Creating an observer requires `is_function_allowed` for both the observed function and the target under the session.
- `observe.allow: false` makes a function unobservable (`NOT_OBSERVABLE`).

## 4. Error codes

| Code | When |
|---|---|
| `UNSUPPORTED` | The engine lacks `observe.v1` (raised by the SDK). |
| `INVALID_ARGS` | `args` fail the function's `args_format` (a missing required argument included), or a function without `args_format` (every `auto` function) receives non-empty `args`. |
| `INVALID_OBSERVE_DESCRIPTOR` | `registerfunction` declares `args_format` with `delivery: auto` (`registrationrejected`; the SDK also throws at `registerFunction`). |
| `INVALID_FILTER` / `INVALID_FILTER_PATH` | Filter validation fails, including a literal where an operator object is expected ([`filters.md`](filters.md) §4). |
| `NOT_OBSERVABLE` | The function registered `observe.allow: false`. |
| `FORBIDDEN` | RBAC on the observed function or the target, or the registration hook. |
| `SELF_TARGET` | The target equals the observed function. |
| `LIMIT_EXCEEDED` | Per-connection or per-function caps. |
| `OBSERVER_ID_CONFLICT` | A replay with the same id but a different spec. |
| `OWNER_TIMEOUT` | The owner did not ack an added observer within `owner_ack_timeout_ms`. |
| *(owner rejections)* | Carried verbatim from `observerack.error`; `OBSERVE_REJECTED` when the callback threw a plain error. Defined by the worked examples: `HTTP_ROUTE_CONFLICT` ([`http.md`](http.md)); `INVALID_CRON_EXPRESSION`, `CRON_CONDITION_UNSUPPORTED` ([`cron.md`](cron.md)); `UNKNOWN_DB`, `NATIVE_CAPTURE_REQUIRES_TABLE` ([`database.md`](database.md)). Missing required arguments are `INVALID_ARGS`, raised by the engine before the owner is asked. |
| *(owner delivery, §3.5)* | `OBSERVER_NOT_FOUND`, `NOT_FUNCTION_OWNER`, `NOT_OWNER_DELIVERED`, `OBSERVER_NOT_ACTIVE`, `TARGET_MISMATCH`, `OVERFLOW`, `LOOP_GUARD` |
| *(owner delivery, SDK-side)* | `FILTERS_NOT_MATCHED` (`obs.call` on a payload the observer's filters reject; nothing sent), `NOT_OWNER_DELIVERED` (`obs.emit` / `obs.call` on an auto function) |
| *(state reasons)* | `OWNER_UNAVAILABLE`, `TARGET_UNAVAILABLE`, `OBSERVER_DISCONNECTED`, `EXPIRED`, `MAX_FIRES`, `UNOBSERVED` |
| *(drop reasons)* | `INACTIVE`, `LOOP_GUARD`, `MAX_FIRES`, `OVERFLOW`, `REPORTER_NOT_OWNER`, `BUFFER_FULL` / `TOO_LARGE` (SDK-side, via stats) |

## 5. Security notes

- **Caller identity.** `caller.worker_*` is engine-stamped and cannot be forged.
  `caller.function_id`, `invocation_id` and `parent` are asserted by the calling
  SDK. They are useful for routing and filtering, not as an authorization input.
- **Owners see args, filters and target ids.** Args and filters can contain
  sensitive literals, such as a customer id. Owners never see who observes, the
  observer's metadata or its policy. Whether a `private` observer
  (engine-only evaluation, with the owner reporting every invocation) is needed
  is open.
- **Owners can only report and deliver for their own functions.** Both are
  checked against `function_owners`. An owner can fabricate invocations of its
  own function, but it already controls everything that function returns.
- **Owner-delivered functions are entry points.** Observing `http::on-request`
  registers a route; calling it runs the router. RBAC must not expose it to
  untrusted sessions, and observing it may need a permission of its own
  (README §11.9).
- **Owners pick observers; observers own filters.** An owner chooses which
  of its function's observers receive an event, from their args, and never
  edits filters; its SDK applies the observer's filters before anything is
  sent. As with reports, the engine does not re-evaluate them: the owner is
  authoritative for its own function's data.
- **The rbac-proxy worker** (`tech-specs/2026-06-22-rbac-proxy-worker/`) must
  learn the new variants:
  - forward `functionregistered`, `observeradded`, `observerremoved`, `observerack`, `invocationsobserved` and `localinvocationstats`;
  - gate `observe` like `RegisterTrigger` today;
  - rewrite `engine::observers::list` like the other discovery functions.

## 6. Legacy shim (phase 5)

A function declares the trigger type it replaces:

```json
"observe": { "delivery": "owner", "legacy_trigger_type": "cron" }
```

When `RegisterTrigger { trigger_type: T, function_id: F, config: C, metadata: M }`
finds no live trigger-type provider for `T`, but a registered function declares
`legacy_trigger_type == T`, the engine:

1. Creates an observer on that function with
   - observing worker = the registering connection;
   - `source: { function_id: <that function>, args: {}, filters: {}, deliver: "input" }`
     (so the target receives what it received from the trigger);
   - `target: F`, `metadata: M`;
   - `legacy: { trigger_type: T, config: C }`, forwarded in `observeradded`.
     The engine skips `args_format` validation for it: `C` is the old config,
     and the owner translates it.
2. The owner's `onObserverAdded` sees `obs.legacy`, validates `C` exactly as its
   `TriggerHandler` did, reads it as its args and routes the observer like
   any other: cron joins the expression's job, the database joins its index
   with the canonical table, HTTP inserts a route.
3. The engine keeps the filters `{}`, answers `TriggerRegistrationResult` to
   the registrant (with the owner's error, if it rejected), and activates.
4. `UnregisterTrigger` disposes the observer.

Workers that still call `registerTrigger` keep working, and the provider
deletes its `TriggerHandler`, binding table and fan-out in the same release that
adds the function. If `T` still has a live old-style provider, it wins: the shim
is only a fallback.
