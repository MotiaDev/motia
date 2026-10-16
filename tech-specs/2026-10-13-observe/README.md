---
title: observe — every function is observable
tagline: "register_trigger_type folds into register_function and register_trigger becomes iii.observe(source, target): any function can be observed with args for its owner and declarative filters owned by the engine, a function's owner can react when it is observed, and a worker calls its own functions in-process, touching the wire only when someone is listening."
date: 2026-10-13
tags: [engine, sdk, protocol, triggers]
status: draft
---

# observe — every function is observable

> Execution plan. Status: **draft for review**. Companion documents:
> [`filters.md`](filters.md) (filter language), [`protocol.md`](protocol.md)
> (wire + engine internals), [`sdk.md`](sdk.md) (SDK API and internals), and
> three worked examples: [`database.md`](database.md)
> (`database::on-row-changed`), [`http.md`](http.md) (`http::on-request`),
> [`cron.md`](cron.md) (`cron::on-tick`).

A trigger type is a function whose owner wants to know who observes it. A
trigger is an observer.

Terms used throughout: an **observer** is what `iii.observe(source, target)`
creates and `dispose()` removes: a source function with its args and filters,
a target, and policy. The **owner** is the worker that hosts the observed
function. The **observing worker** is the one that called `observe`; it can
create many observers, and each one is added, routed and removed on its own.

## 1. Decision

1. **Every function is observable.** Any worker can observe any function it is
   allowed to invoke. It can capture the **input**, the **output** (or error),
   and the **caller**: the worker that started the invocation, and the function
   and invocation it was made from.
2. **`register_trigger_type` folds into `register_function`.** A function can
   carry an `observe` descriptor with two callbacks, `onObserverAdded` and
   `onObserverRemoved`, that run when an observer is attached to it or removed.
   They are today's `TriggerHandler.registerTrigger` / `unregisterTrigger`,
   moved onto the function. `register_trigger_type` is removed completely.
3. **`register_trigger` becomes `observe(source, target)`.** The left side is
   the source: the observed `function_id`, its `args` (what the function's
   owner should produce: a cron expression, an HTTP method and path, a
   database table) and declarative `filters` (which of its invocations reach
   the target). The right side is the target: the id of a registered function,
   the old trigger's `function_id`. There is no inline handler. This mirrors
   iii lang's `source(args) | predicate ~> target`.
4. **The function declares how observers are delivered.**
   - `auto` (default): the function's invocations are the events. After a call
     completes, every observer whose filters match is activated,
     fire-and-forget. Takes no args. Used by every ordinary function and by
     sources that need no setup (pubsub, state, logs, engine events).
   - `owner`: the owner reads each observer's args, sets up what they ask
     for, and hands each event to the observers it belongs to:
     `obs.emit(event)`, fire-and-forget (cron, the database), or
     `obs.call(payload)` when the result matters (the HTTP response, a queue
     ack). The SDK applies the observer's filters in both.
5. **Filters are declarative JSON objects, and they live in the engine.** The
   engine is the source of truth for who receives what
   ([`filters.md`](filters.md)).
6. **The filters of a function are pushed to the SDK that hosts it.** That SDK
   runs its own functions **in-process** and reports an invocation to the
   engine **only when at least one filter matches**. An unobserved local call
   puts zero bytes on the wire.
7. **Invocation-scoped observers on `trigger()` are out of scope.** A caller
   that wants the result already has it.

## 2. The problem this solves

Today three concepts do one job: a **function**, a **trigger type** and a
**trigger**. Every provider re-implements the same pieces behind its
`TriggerHandler`: binding storage, matching, fan-out, ownership and cleanup.

- The database keeps its own subscriber list and filter and sends one
  `TriggerAction::Void` call per subscriber
  (`workers/database/src/triggers/bus.rs`).
- HTTP keeps a route table keyed by trigger id (`workers/http/src/trigger.rs`).
- Cron spawns one task and takes one lock per trigger, even when ten triggers
  share an expression (`workers/cron/src/scheduler.rs`).
- The harness grew a whole binding store (`workers/harness/src/bindings/`) for
  owner, `once` / `max_fires` / expiry, and loop depth, because the engine knows
  nothing about bindings.

Meanwhile the event itself has no home. `database::row-changed` is a trigger
type, not a function, so it has no schema you can call, test or observe, and
nobody can ask "who wrote this row".

The naive fix, "make the event a function and let the engine fan out every
call", is correct but too expensive when the host calls itself:

```
1. a row changes in the database
2. database → engine        InvokeFunction(database::on-row-changed)
3. engine   → database      InvokeFunction (the function lives in the same process)
4. database → engine        InvocationResult
5. engine   → database      InvocationResult
```

Four frames and two JSON round trips per row change, at several hundred
thousand changes per minute, most of them observed by nobody.

## 3. Before and after

### 3.1 Concepts

| | Today | Proposed |
|---|---|---|
| Concepts | function, trigger type, trigger | function, observer |
| Engine registries | `functions`, `trigger_types`, `triggers` + `pending_triggers` | `functions`, `observers` |
| Provider API | `registerFunction` + `registerTriggerType(id, TriggerHandler)` | `registerFunction(id, handler, { observe: hooks })` |
| Consumer API | `registerTrigger({ type, function_id, config, metadata })` | `observe({ function_id, args, filters }, target, { metadata, … })` |
| Provider config | `config`, validated by `trigger_request_format` | `args`, validated by `observe.args_format`, handed to `onObserverAdded` |
| Where bindings live | in each provider | in the engine; the owner sees them through callbacks |
| Matching | provider code, per provider | `filters`: `iii-filter`, the same evaluator in the engine and every SDK |
| Event schema | `call_request_format` on a trigger type | `request_format` of a real, callable function |
| Who caused the event | unknown | `caller` and `caller.parent` |
| Wire messages for bindings | `registertriggertype`, `registertrigger`, `triggerregistrationresult`, `unregistertrigger` (+ `unregistertriggertype`, which no engine decodes) | `observe`, `unobserve`, `observeresult`, `observeradded`, `observerremoved`, `observerack`, `functionregistered` |

### 3.2 API

Provider, today:

```ts
iii.registerTriggerType({ id: 'cron', description: 'Cron-based scheduled triggers' }, {
  async registerTrigger({ id, function_id, config }) { scheduler.add(id, config.expression, function_id) },
  async unregisterTrigger({ id }) { scheduler.remove(id) },
})
// the scheduler calls iii.trigger({ function_id, payload }) once per binding
```

Provider, proposed:

```ts
// cron worker: hosts cron::on-tick and decides which observers get each tick
const schedules = new Map<string, Set<Observer>>()         // expression → observers

const onTick = iii.registerFunction('cron::on-tick', (tick: CronTick) => {
  // one call per fire: hand the tick to the observers of that expression
  for (const obs of schedules.get(tick.expression) ?? []) obs.emit(tick)
}, {
  request_format: CronTickSchema,              // { expression, scheduled_time }: what filters read as input.*
  observe: {
    delivery: 'owner',                         // this worker picks who receives each tick
    args_format: CronArgsSchema,               // { expression } required → INVALID_ARGS
    onObserverAdded(obs) {                     // someone observed cron::on-tick
      const { expression } = obs.args
      if (!schedules.has(expression)) {        // first observer of this expression: start one job
        scheduler.start(expression, (scheduled_time) =>   // throws on a bad expression → ready() rejects
          iii.trigger({ function_id: 'cron::on-tick', payload: { expression, scheduled_time } }))
        schedules.set(expression, new Set())
      }
      schedules.get(expression)!.add(obs)
    },
    onObserverRemoved(obs) {                   // dispose(), or its worker left for good
      const observers = schedules.get(obs.args.expression)!
      observers.delete(obs)
      if (observers.size === 0) {              // last observer of this expression: stop its job
        scheduler.stop(obs.args.expression)
        schedules.delete(obs.args.expression)
      }
    },
  },
})
```

The owner never writes a filter. It reads `obs.args`, keeps its own index
(expression → observers) and calls `obs.emit` for the observers an event
belongs to; the SDK applies each observer's filters. The full walkthrough,
both sides in order, is in [`cron.md`](cron.md) §2.6.

Consumer, today and proposed:

```ts
iii.registerTrigger({ type: 'cron', function_id: 'local::cron-handler', config: { expression: '0 0 9 * * Mon-Fri' } })

iii.registerFunction('local::cron-handler', ({ input }) => sendDigest(input))

iii.observe({
  function_id: 'cron::on-tick',
  args: { expression: '0 0 9 * * Mon-Fri' },
  filters: { 'input.scheduled_time': { $gte: '2026-11-01T00:00:00Z' } },   // start in November
}, 'local::cron-handler')
```

The first argument is the left side (what is observed), the second the right
side (what to invoke). In iii lang terms, with an illustrative filter stage
that is planned, not part of v12:

```text
onTick({ expression: '0 0 9 * * Mon-Fri' })
  | 'input.scheduled_time' >= '2026-11-01T00:00:00Z'
  ~> cronHandler
```

### 3.3 Architecture

Today:

```
 observing worker          engine                                 provider worker (cron)
 registerTrigger ──────►  trigger registry ── registertrigger ──► TriggerHandler
                          (bindings, pending,                      binding table, matching,
                           re-homing)                              one job per binding
                                    ◄──── invokefunction(target) ── per binding, per fire
 target ◄───────────────  routes it
```

Proposed:

```
                    ┌──────────────────────────── engine ─────────────────────────────┐
 observing worker   │ ObserverRegistry (by id, by function)          Dispatcher     │
 iii.observe(s, fn) ┼─► validate, store ──── observeradded ────┐                    │
                    │                    ◄─── observerack ────┐ │                    │
                    │ routed invocations of fn ─► evaluate ──────┼─┼─► activate target  │
                    │ invocationsobserved ──────► validate ──────┘ │   (void)           │
                    └────────────▲────────────────────────────────┼─────────────────────┘
                                 │ reports: matches only,         │ observer set
                                 │ batched                        │ (args, filters, target)
                    ┌────────────┴────────────────────────────────▼─────────────────────┐
 owner worker       │ SDK: onObserverAdded / onObserverRemoved callbacks                            │
 (cron, database)   │ trigger(fn) where fn is local: run in-process                     │
                    │   no observers? done (0 bytes) · else evaluate · enqueue report │
                    │ obs.emit(event) (owner): check its filters · enqueue report       │
                    └───────────────────────────────────────────────────────────────────┘
```

The full old → new message map is in [`protocol.md`](protocol.md) §2.

## 4. The model

### 4.1 Observable function

Any registered function. An optional `observe` descriptor at registration:

```ts
observe?: {
  delivery?: 'auto' | 'owner'                 // default 'auto'
  args_format?: JSONSchema                    // owner only; validates the observers' args in the engine (INVALID_ARGS)
  legacy_trigger_type?: string                // phase 5: accept old RegisterTrigger{type}
  allow?: boolean                             // default true; false → NOT_OBSERVABLE
  onObserverAdded?(obs: Observer): void | Promise<void>  // throw → rejected
  onObserverRemoved?(obs: Observer): void | Promise<void>
}
```

- Only `delivery`, `args_format`, `legacy_trigger_type` and `allow` travel on
  the wire (`RegisterFunction.observe`). The callbacks stay in the SDK.
- A function without a descriptor is still observable, with `delivery: auto`
  and no callbacks. It accepts no args.
- `args_format` requires `delivery: owner` (`INVALID_OBSERVE_DESCRIPTOR`): only
  an owner that routes by args can use them.
- `registerFunction` returns a `FunctionRef` that gains `isObserved()` (one
  atomic load, for the emit fast path) and `observers()`.

### 4.2 Delivery modes

| | `auto` (default) | `owner` |
|---|---|---|
| What is an event | every invocation of the function | what the owner hands to an observer |
| Who picks the observers | nobody: every observer is offered every invocation | the owner, from their args (its own index: expressions, tables, routes) |
| Args | none | validated against `args_format` |
| Filters evaluated by | the engine (routed calls) or the host SDK (local calls) | the owner's SDK, inside `obs.emit` / `obs.call` |
| When | after the observed invocation completes (`on`: success, error, complete) | whenever the owner decides, usually inside the function's handler |
| Result | discarded | `obs.emit`: discarded · `obs.call`: returned to the owner |
| Target receives | the `Observed` envelope (per `capture` / `deliver`) | `obs.emit`: the `Observed` envelope · `obs.call`: the owner's payload; it returns the result |
| Examples | `billing::close-invoice`, `pubsub::publish`, `state::on-changed`, `observability::on-log` | emit: `cron::on-tick`, `database::on-row-changed` · call: `http::on-request`, `queue::on-message`, `console::on-asset` |

`obs.emit()` uses the same batched report as a matched local call, so the
engine activates the target exactly as for auto delivery. `obs.call()` goes
through the engine as an `InvokeFunction` to the observer's target with
`activation: { observer_id }`. In both, the engine checks that the sender
hosts the observed function and that the observer is active, then applies
policy, the metadata sidecar and the loop guard ([`protocol.md`](protocol.md)
§3.4, §3.5).

### 4.3 Observer

`{ id, source: { function_id, namespace, args, filters, on, capture, deliver }, target, metadata, max_fires, expires_in_ms, max_in_flight }`

The SDK call has the same three parts: `iii.observe(source, target, options?)`,
where `options` carries `id`, `metadata` and the policy.

- `id`: client-generated, stable across replays.
- `args`: the source's arguments, for the function's owner, on owner-delivered
  functions only. Validated against `args_format` (`INVALID_ARGS`) and handed
  to `onObserverAdded`; constant for the observer's life. Examples: cron
  `expression`; HTTP `method`, `path`, `middleware_function_ids`; database
  `db`, `table`, `ops`.
- `filters`: a declarative JSON object over `input`, `output`, `error`,
  `caller` and `metadata` ([`filters.md`](filters.md)), with explicit
  operators only (`{ 'input.amount': { $gte: 500 } }`).
- `target`: the id of a registered function. There is no inline handler: the
  target is registered first, as iii lang does for a lambda on the right of
  `~>`.
- `capture`, `deliver`: auto delivery and `obs.emit`. `on`: auto only.
  `capture` decides what travels to the target; a filter may reference fields
  it does not capture.
- `metadata`: delivered as the sidecar of every activation. This replaces
  trigger metadata, which the harness relies on (`__binding`).
- States, aligned with the language spec: `pending` (no owner yet, or waiting
  for the owner's ack) → `active` or `error`; `active → pending` when the owner
  disconnects; observing worker disconnect → `suspended` (30 s grace) → `disposed`;
  `dispose()` or policy exhaustion → `disposed`.

**Envelope (`Observed`)**, auto delivery: `{ observer_id, activation_id,
function_id, invocation_id, status, input?, output?, error?, caller?,
metadata?, started_at_ms, duration_ms }`.

**Caller**: `{ worker_id, worker_name, function_id?, invocation_id?, parent? }`.
`worker_*` is stamped by the engine from the connection and cannot be forged.
`parent` is the caller of the handler the call was made from, one level only.
That answers "which worker caused this row change" when the database emits from
inside `database::execute` ([`database.md`](database.md) §2.3).

**Routing by args.** Args are for the owner, filters for the observer. An
owner-delivered function's owner indexes each observer by its args in
`onObserverAdded` (cron: expression → observers) and hands each event only to
the observers it belongs to, with `obs.emit` or `obs.call`. It never writes
or changes a filter; the SDK applies the observer's filters as given. The
legacy shim works the same way: the owner reads the old trigger config as
args.

## 5. Who evaluates

**Rule:** the first party that sees an invocation's input and outcome
evaluates the filters. No invocation is evaluated twice. For owner delivery
that is the owner's SDK, on each `obs.emit` / `obs.call`.

| Invocation path | Who evaluates | Wire cost when not observed | Wire cost when observed |
|---|---|---|---|
| Routed: caller → engine → host (other workers, engine providers, HTTP-invoked functions, `void`) | **engine**, in `handle_invocation_inner` | unchanged | 0 extra frames to the host; 1 activation per match |
| Local: the host calls its own function | **host SDK** | **0 frames** | 1 report item (batched) + 1 activation per match |
| Owner delivery: `obs.emit` / `obs.call` | **owner's SDK**, for the observers the owner picked | **0 frames** (no observer, no emit) | emit: 1 report item (batched) + 1 activation per match · call: 1 routed invocation |

The host SDK never evaluates an invocation it received as `InvokeFunction`.

Local call, nobody observing (the hot path):

```
database SDK                                   engine
  fan_out(event)
   └─ rowChanged.isObserved() == false → return          (nothing serialized, nothing sent)
```

Observer created, then a local call:

```
billing SDK             engine                                    database SDK
 observe(src, fn)    ─► observe ─► validate, store (pending)
                                   observeradded{rev 7} ─────────► onObserverAdded(obs) → native capture, index
                                   ◄──────────────────────────────── observerack{rev 7}
 ◄─ observeresult(active)
                                                          trigger(fn, ev): handler runs in-process
                                                          index(db, table, op) → obs.emit(ev)
                                                          compiled filters → obs matches
                        ◄──────── invocationsobserved{items:[{fn, matched:[obs], input, caller…}]}
                        check reporter hosts fn, policy (max_fires, expiry, in-flight, depth)
 ◄─ invokefunction(target, envelope)   (the right side of the observer)
```

Owner delivery (HTTP):

```
client        http SDK                                 engine                 users worker
 GET /users/42 ─► trigger(http::on-request) in-process
                  router: route match, obs.matches(), middleware
                  obs.call(req) ── invokefunction(users::get, activation) ─► route ─► handler
                  ◄──────────────────── invocationresult ◄──────────────── result ◄──┘
 ◄── response
```

## 6. Guarantees (v1)

| Property | v1 behaviour |
|---|---|
| Delivery | Auto: at-most-once; drops are counted per function and reason, never silent. Owner: whatever the owner implements (HTTP: one call per request; queue: its own retry and DLQ). |
| Completeness | Once an observer is `active`, every later invocation of the function is evaluated: routed ones by the engine, local ones by the host, because `active` waits for the host's `observerack`. For owner delivery, every later event the owner routes to it, because the owner indexes the observer in `onObserverAdded`, before the ack. |
| Ordering | None across observers. With `max_in_flight: 1`, activations of one observer run in engine arrival order. |
| Isolation | An observer failure never affects the observed invocation. The host never blocks on reporting: its buffer is bounded and drops newest, counting what it drops. |
| Loops | Every invocation carries `observe_depth`. Activations deeper than `max_observe_depth` (default 8) are dropped and counted. A self-target is rejected at creation. |
| Ownership | An observer belongs to the connection that created it. When that connection drops, its observers go `suspended`; `Reattach` within 30 s re-parents them with counters intact; after that they are `disposed`. When the **function's owner** disconnects, its observers go back to `pending` and are replayed when the function registers again (today's `pending_triggers` behaviour). |
| Persistence | In-memory, like triggers today. SDKs replay observers by id. Durable observers are phase 6. |
| Authorization | To observe you must be allowed to invoke the observed function and the target (RBAC `expose_functions`). Hook: `on_observer_registration_function_id`. A function can opt out (`observe.allow: false`). |

## 7. Execution plan

Each phase is shippable on its own. Old SDKs and old engines interoperate at
every step through feature negotiation ([`protocol.md`](protocol.md) §1).

### Phase 0: foundations
- `crates/iii-filter` (Rust): parse, validate, normalize, evaluate. Used by the engine and the Rust SDK.
- Evaluators in the Node SDK (shared with `iii-browser`), Python and Go.
- `sdk/fixtures/filters/*.json`: shared conformance vectors, the first shared protocol contract (today every SDK hand-copies the `Message` enum).
- Protocol types for every new message and field, all additive.
- `functionregistered`: the success ack `RegisterFunction` never had.
- Fix or delete `UnregisterTriggerType`, which every SDK sends and no engine decodes.
- **Done when:** the engine and all SDKs pass the same vectors, and a differential fuzz test (Rust vs TS) agrees.

### Phase 1: every function is observable (routed path)
- `engine/src/observer/`: registry, lifecycle, dispatcher, policy, loop guard, observer re-parenting on `Reattach`.
- Hook in `invocation/mod.rs` `handle_invocation_inner` for routed invocations.
- Messages `observe`, `unobserve`, `observeresult`, `observerstatechanged`; `InvokeFunction` gains `caller`, `observe_depth`, `activation`.
- Builtins `engine::observers::list|get|dispose`, RBAC checks and hook, metrics.
- `observe(source, target, options?)` in **node** and **rust**: handle with `ready()` / `state` / `dispose()`, replay.
- **Done when** integration tests cover filters on input, output and caller; `on: error`; `max_fires`, expiry and in-flight overflow; observing worker disconnect → suspended → reattach / grace expiry; loop guard; RBAC denial; the lang-spec observe scenarios.

### Phase 2: observable functions (hooks, local dispatch, owner delivery)
- Engine: `RegisterFunction.observe` with `args_format` (`INVALID_ARGS`, `INVALID_OBSERVE_DESCRIPTOR`); `functionregistered` with the current set; `observeradded` / `observerremoved` with a per-function revision; `observerack` gating `active` (and late rejections); replay to a re-registered owner; `invocationsobserved` validation for auto calls and owner emits; owner delivery through `activation`; `localinvocationstats`.
- SDK (node, rust): `observe` hooks on `registerFunction`, `FunctionRef.isObserved()` / `observers()`, the `Observer` object (`args`, `filters`, `matches`, `emit`, `call`), local dispatch in `trigger()`, current-invocation context, caller propagation, reporter, reconnect diffing.
- **Done when:**
  - the **equivalence suite** passes: the phase-1 suite runs with local dispatch on and off, with identical observer-visible results;
  - the **zero-wire test** passes: 1M unobserved local calls send zero frames;
  - the **activation race test** passes: after `ready()` resolves, every local invocation is reported;
  - an owner-delivered test function returns its observer's result through `obs.call`, and reaches only the observers it emits to through `obs.emit`;
  - benchmarks meet §8.

### Phase 3: migrate cron, database, http
- [`cron.md`](cron.md): `cron::on-tick`, one job per distinct expression, ticks emitted to that expression's observers.
- [`database.md`](database.md): `database::on-row-changed`, native capture and the args index driven by `onObserverAdded`.
- [`http.md`](http.md): `http::on-request`, owner delivery, route table driven by `onObserverAdded`.
- Each declares `legacy_trigger_type` so un-migrated callers keep working.
- **Done when** each worker's suite passes on the legacy and the new path, and the benchmarks in the worked examples meet budget.

### Phase 4: SDK parity (python, go, browser)
- Python: carry context into threaded sync handlers (`contextvars.copy_context().run`).
- Go: context-based caller propagation.
- Browser: `trigger` must start sending `metadata` / `traceparent`.

### Phase 5: deprecation
- `registerTrigger` / `registerTriggerType` log a deprecation warning once per process.
- Engine legacy shim ([`protocol.md`](protocol.md) §6).
- Remaining providers move to functions (§9): queue, pubsub, state, stream, observability, configuration, engine sources, console.
- Harness bindings move to observers (metadata sidecar keeps `__binding` working).
- Console observers view (owner, function, args, filters, target, state, fires, drops); docs.

### Phase 6: removal and durability
- Remove `registerTriggerType`, `registerTrigger`, the four trigger messages and `engine/src/trigger.rs`.
- Durable observers (owned by a worker name or session, persisted across engine restarts), needed to retire the harness binding store.
- Optional: `on: start`, wildcard `function_id`, an equality index for functions with hundreds of observers.

### Work breakdown

| Component | Files | Phase |
|---|---|---|
| Filter crate + vectors | `crates/iii-filter/` (new), `sdk/fixtures/filters/` (new) | 0 |
| Wire types | `engine/src/protocol.rs` | 0 |
| Registry, lifecycle, dispatch, owner sync | `engine/src/observer/` (new) | 1–2 |
| Routed-invocation hook | `engine/src/invocation/mod.rs` (`handle_invocation_inner`) | 1 |
| Message arms; register / unregister / cleanup / reattach hooks; `caller` / `observe_depth` / `activation` | `engine/src/engine/mod.rs` | 1–2 |
| Builtins; `features` in `workers::register` | `engine/src/workers/engine_fn/mod.rs` | 1–2 |
| RBAC hook and checks | `engine/src/workers/worker/rbac_config.rs` and the session checks | 1 |
| Metrics | `engine/src/workers/observability/metrics.rs` | 1–2 |
| Legacy shim, then deletion | `engine/src/trigger.rs` | 5–6 |
| Node SDK | `sdk/packages/node/iii/src/iii.ts`, `iii-types.ts` (+ `observe.ts`, `observable.ts`, `filter/`) | 1–2 |
| Rust SDK | `sdk/packages/rust/iii/src/iii.rs`, `protocol.rs` (+ `observe.rs`, `observable.rs`; filter from `iii-filter`) | 1–2 |
| Python, Go, browser SDKs | `python/iii/src/iii/iii.py`, `go/iii/client.go`, `node/iii-browser/src/iii.ts` | 4 |
| rbac-proxy worker | forward and gate the new variants | 2 |
| cron, database, http workers | `workers/cron/src/*`, `workers/database/src/triggers/*`, `workers/http/src/*` | 3 |
| harness bindings | `workers/harness/src/bindings/*` → observers | 5–6 |
| Console + docs | observers view; `docs/next/creating-workers/triggers.mdx`, `reference/engine-protocol.mdx` | 5 |

## 8. Performance budget (validated in phases 2–3)

| Scenario (Rust host, 5k calls/s) | Budget |
|---|---|
| Local call, no observers (`isObserved()` false at the call site) | no allocation, one atomic load |
| Local call through `trigger()`, no observers | < 2 µs SDK overhead on top of the handler, 0 frames |
| Local call, 10 observers, none matching | < 5 µs (compiled filters, short-circuit) |
| Local call, 1 matching observer | 1 report item; batched to ≤ 1 frame per 5 ms or 256 items |
| Engine, 5k reports/s with 1 activation each | < 1 core |
| Engine, routed invocation of a function with no observers | one lock-free lookup, no extra clone |
| Owner delivery (`obs.emit`), 1 matching observer | same as a matching local call: 1 report item + 1 activation |
| Owner delivery (`obs.call`) | same frames as a trigger fire today (2 out, 2 back) |

Node targets are set after the phase-2 baseline (`structuredClone` dominates).

## 9. Trigger type → function

| Trigger type (provider) | Function | Delivery |
|---|---|---|
| `http` (http) | `http::on-request` | owner (`obs.call`): args `{ method, path, … }`; the response is the observer's result |
| `cron` (cron) | `cron::on-tick` | owner (`obs.emit`): args `{ expression }`, one job per expression |
| `database::row-changed` (database) | `database::on-row-changed` | owner (`obs.emit`): args `{ db, table?, ops? }`, native capture per table |
| `durable:subscriber` (queue) | `queue::on-message` | owner (`obs.call`): args `{ topic, … }`; ack, retry and DLQ on the result |
| `subscribe` (pubsub) | `pubsub::publish`, observed directly with a filter on `input.topic` | auto, no args |
| `state` (state) | `state::on-changed` | auto, no args: filter on `input.scope` / `input.key` |
| `stream`, `stream:join`, `stream:leave` (iii-stream) | `stream::on-changed`, `stream::on-join`, `stream::on-leave` | auto, no args: filter on `input.stream_name` / `input.group_id` |
| `log`, `trace` (iii-observability) | `observability::on-log`, `observability::on-span` | auto, no args: filter on `input.level`, `input.service` |
| `configuration` (configuration) | `configuration::on-updated` | auto, no args: filter on `input.worker` |
| `engine::functions-available`, `engine::workers-available` | `engine::on-functions-changed`, `engine::on-workers-changed` | auto, engine-hosted |
| `console:script`, `console:style` (console) | `console::on-asset` | owner (`obs.call`): args `{ kind }` |

The rule: a source takes args, and is owner-delivered, only when the owner must
set something up per observer (a schedule, a capture, a route, a consumer).
Events that happen anyway are observed with filters.

Names other than the three worked examples are illustrative; each provider owner
picks them in phase 5.

## 10. Compatibility

| | old provider (`registerTriggerType`) | new provider (function + hooks) |
|---|---|---|
| **old consumer** (`registerTrigger`) | unchanged | the engine turns `RegisterTrigger{type}` into an observer on the function that declares `legacy_trigger_type`; the owner reads the old config as args and routes it like any observer ([`protocol.md`](protocol.md) §6) |
| **new consumer** (`observe`) | keep using the deprecated `registerTrigger` until the provider migrates | full |

Functions hosted by an old SDK are still observable: an old SDK never calls
itself in-process, so every invocation is routed and the engine evaluates it.

## 11. Decisions to confirm in review

1. **Default `on`.** Proposed `success`, matching lang spec 05 §7.1. `complete`
   is the alternative.
2. **Owner delivery goes through the engine.** `obs.call` is an
   `InvokeFunction` with `activation`, so policy, the metadata sidecar and the
   loop guard are enforced in one place. The alternative, the owner calling the
   target directly, would leak observer metadata to the owner and skip policy.
3. **Owners route, observers filter.** The owner reads args and hands each
   event to the observers it belongs to (`obs.emit`, `obs.call`). Filters
   are the observer's alone, applied by the SDK; the owner never writes one.
4. **What owners see:** the args, the observer's filters, the target id,
   capture and `on`. Never the observer's metadata, policy or connection.
5. **`condition_function_id`.** Kept as an HTTP arg (deprecated in favour of
   filters, which run in-process); dropped for cron (use a filter, or check in
   the target).
6. **Cron tick payload** drops `job_id`; the observer id is in the handler
   context (`activation.observer_id`).
7. **Database granularity:** one invocation per committed write statement, not
   per row. Row-level matching uses `$any` on `input.returning`.
8. **Local dispatch value semantics:** the handler gets a clone (Rust
   move/clone, Node `structuredClone`, Python deep copy).
9. **Who may observe.** "May invoke ⇒ may observe". Observing an
   owner-delivered function registers a route or a consumer, so it may need its
   own permission.
10. **Local dispatch under RBAC middleware** is disabled for sessions with a
    `middleware_function_id`, because a local call would bypass the middleware.
11. **Naming:** `<worker>::on-<event>` for source functions. The unit is the
    **observer**: what `iii.observe()` creates and `dispose()` removes. The
    owner's hooks are `onObserverAdded` / `onObserverRemoved` (Rust and
    Python `on_observer_added` / `on_observer_removed`, Go `OnObserverAdded` /
    `OnObserverRemoved`), called once per observer, like the wire messages
    `observeradded` / `observerremoved`. Nothing is called "observation".
12. **Opt-out:** functions may refuse observers with `observe.allow: false`.
13. **Two sides.** The left side is the source (`function_id`, `args`,
    `filters`, and the facet: `on` / `capture` / `deliver`), the right side is
    the target function id, and an optional third argument carries the policy
    and metadata. It mirrors `source(args) | predicate ~> target`.
14. **Args are setup, filters are selection.** Args go to the owner and exist
    only on owner-delivered functions: what to set up (which schedule, which
    capture, which route). Filters say which events reach the target and stay
    with the engine and the SDK. An event source that needs no setup takes no
    args and is observed with filters (pubsub, state, logs).
15. **No inline handlers.** The target is always a registered function id, so
    the SDK no longer registers internal `observer` functions. The iii lang
    compiler does the same for a lambda on the right of `~>`.
16. **Explicit operators only in filters.** No literal shorthand
    (`{ 'input.op': 'insert' }`), so a filter maps 1:1 to an iii lang
    predicate ([`filters.md`](filters.md) §2.2).

## 12. Relation to the iii language spec (v12)

This plan is the runtime half of the language's Observer (`~>`). The left
side of `~>` becomes the first argument of `iii.observe`, the right side the
second.

| iii lang | `iii.observe` |
|---|---|
| `onTick({ expression })` (source call, left side) | `{ function_id: 'cron::on-tick', args: { expression } }` |
| filter stage `\| 'input.x' == 1 && 'output.y' < 5` (planned; syntax illustrative, not v12) | `filters: { 'input.x': { $eq: 1 }, 'output.y': { $lt: 5 } }` |
| `~> cronHandler` (right side) | second argument `'local::cron-handler'` |
| facets `.error` / `.invocation` / `.completion` | `on: 'error'` / `on: 'complete'` with full `capture` / `on: 'complete'` with timing, on the source |
| `deliveryPolicy({ maxFires, maxInFlight })`, `lease({ expiresIn })` | third argument `{ max_fires, max_in_flight, expires_in_ms }` |
| `orders::create ~> reserveInventory` (static) | `observe({ function_id: 'orders::create', deliver: 'output' }, 'reserveInventory')`, owned by the worker |
| dynamic `~>` inside a body + `ObservationRef.close()` | the same, owned by the execution scope; `dispose()` |
| `request({ method: "POST", path: "/orders" }) ~> createOrder` | `observe({ function_id: 'http::on-request', args: { method: 'POST', path: '/orders' } }, 'createOrder')` |
| `schedule({ expression }) ~> reconcile` | `observe({ function_id: 'cron::on-tick', args: { expression } }, 'reconcile')`; the provider reacts in `onObserverAdded` |
| guards / Predicate IR | `filters`, with the SDK pushdown as the host tier |
| provider lifecycle ("first observer activates, last releases") | `onObserverAdded` / `onObserverRemoved` |
| a lambda on the right of `~>` | a function the compiler registers; `observe` only takes function ids |
| invocation-scoped `f(x) ~> {...}` | out of scope |
| states `pending/active/suspended/error/disposed` | identical |
