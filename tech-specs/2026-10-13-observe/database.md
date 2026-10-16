# Worked example: `database::on-row-changed`

Source: `workers/database` at `079611a1f` (workers `origin/main`; the
`database/` tree is unchanged since `a1b51cac9`). Delivery: **owner**
(`obs.emit`): the database routes each event to the observers whose args
name its db, table and op.

## 1. Today

- The worker registers the trigger type `database::row-changed`
  (`src/main.rs:690-707`). Its config is `{ db, table?, ops? }` with
  `deny_unknown_fields`.
- `RowChangedHandler::register_trigger` (`src/triggers/handler.rs`) validates the
  config:
  - unknown `db` → error;
  - a `capture: native` database requires `table`.

  It installs native capture (Postgres triggers + NOTIFY behind an advisory
  lock, a SQLite changelog plus triggers, MySQL binlog prerequisite checks), then
  files the binding in `RowChangeBus`.
- `RowChangeBus` (`src/triggers/bus.rs`) keeps its own subscriber list.
  `fan_out` matches each event against every subscriber:
  - `db` exact;
  - `table` case-insensitive and schema-insensitive through `sql::same_table`;
  - `ops`.

  It then sends one `TriggerAction::Void` call per matching subscriber, carrying
  the stored metadata. The metadata is load-bearing: it is the harness's
  `__binding` pointer.
- Events are emitted after commit.
  - On the statements path, from inside the mutating handlers
    (`src/handlers/mod.rs:116-158`: `emit` / `stage` / `commit` / `rollback`).
  - On the native path, from the listener tasks (`native.rs`, `sqlite_watch.rs`,
    `mysql_binlog.rs` → `emit_event`).
- **Granularity.** One event per committed write statement: `affected_rows`,
  plus `returning` with up to 100 keys and a `truncated` flag.
- **Delivery.** At-most-once ("a doorbell, not a ledger").

Today's design already sends **zero frames** for an event nobody subscribed to,
because the provider filters locally. The new design keeps that property. What
changes is that binding storage, filters, policy, ownership and lifecycle move
into the engine and the SDK. The database keeps only what is genuinely its own,
behind `onObserverAdded`: native capture, and routing by its own args (db, table,
ops), which only it understands.

## 2. Target

### 2.1 The function

```rust
pub const ROW_CHANGED_FN: &str = "database::on-row-changed";

#[derive(Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct RowChangedArgs {
    pub db: String,
    pub table: Option<String>,           // canonical: bare name, unquoted, lowercased (§2.2)
    pub ops: Option<Vec<Op>>,            // insert | update | delete | other
}

let capture = NativeCapture::new(config.clone());              // native capture + the routing index (§2.4)

let row_changed = iii.register_function(
    ROW_CHANGED_FN,
    RegisterFunction::new({ let capture = capture.clone();
                            move |event: RowChangedEvent| capture.route(event) })   // §2.3
        .description("Invoked once per committed write statement. Observe it with args \
                      { db, table?, ops? } and filter on input.returning / caller.")
        .request_format::<RowChangedEvent>()
        .observe(Observe::owner()                                         // the database picks who gets each event
            .args_format::<RowChangedArgs>()                               // was the trigger config
            .legacy_trigger_type("database::row-changed")
            .handler(capture.clone())),
);
```

The handler is the router: it hands the event to the observers whose args
match it, with `obs.emit(event)`. The target receives the `Observed` envelope
(`capture: ['input']`, or the event itself with `deliver: 'input'`). Locally
dispatched, it costs one function call and one index lookup.

The trigger config becomes the observer's `args`. `args_format`
(`deny_unknown_fields`) rejects argument typos and a missing `db` at creation
(`tabel` → `INVALID_ARGS`), which is what `deny_unknown_fields` does for the
trigger config today, and `request_format` does the same for filter paths
(`input.tabel` → `INVALID_FILTER_PATH`).

### 2.2 Event shape: canonical values

The routing index (§2.4) matches `args.table` exactly, and so do filters
([`filters.md`](filters.md) §3). Today's tolerant table matching
(`sql::same_table`: last dotted segment, unquoted, lowercased) therefore moves
into the **event**:

```jsonc
{
  "db": "primary",
  "schema": "public",          // new; null when unknown
  "table": "orders",           // canonical: bare name, unquoted, lowercased (same rule as same_table)
  "op": "insert",              // insert | update | delete | other
  "affected_rows": 3,
  "returning": [ { "id": 41 }, { "id": 42 }, { "id": 43 } ],
  "truncated": false,
  "at": 1760350000123
}
```

- When the table cannot be classified (a CTE-wrapped write), `table` stays
  `null`, so it is routed only to observers whose args name no table:
  "silence beats a wrong match", as today.
- `onObserverAdded` rejects a non-canonical `args.table` (`"Orders"`,
  `"public.orders"`) with a hint naming the canonical value, so the mismatch
  fails at creation instead of matching nothing.

### 2.3 Emitting

`RowChangeBus` keeps the transaction buffer (`stage` / `commit` / `rollback`)
and loses `Subscriber`, `SubscriberFilter` and `targets_for`. The per-event
routing moves into the function's handler, over an index the hooks maintain.

```rust
pub struct RowChangeBus {
    iii: Arc<IIIClient>,
    row_changed: FunctionRef,                 // from register_function
    pending: Mutex<HashMap<String, Vec<Pending>>>,
}

async fn fan_out(&self, event: RowChangedEvent) {
    if !self.row_changed.is_observed() {       // nobody observing: no serialization, no call, no frames
        return;
    }
    let payload = match serde_json::to_value(&event) { Ok(v) => v, Err(_) => return };
    // Local dispatch: the handler (NativeCapture::route) runs in-process and emits to the routed
    // observers; the SDK checks their filters and reports only matches. Awaited (not Void), so a
    // transaction's statements are reported in commit order.
    if let Err(e) = self.iii.trigger(TriggerRequest::new(ROW_CHANGED_FN, payload)).await {
        tracing::warn!(error = %e, "on-row-changed emit failed");
    }
}

impl NativeCapture {
    /// The function's handler: the args-based match RowChangeBus used to do per subscriber.
    fn route(&self, event: RowChangedEvent) -> Result<(), Error> {
        for obs in self.index.matching(&event.db, event.table.as_deref(), event.op) {
            obs.emit(&event)?;     // the observer's filters run here; a miss sends nothing
        }
        Ok(())
    }
}
```

- **Staging stays unconditional.** Skipping `stage()` while nothing is observed
  would miss an observer that becomes active between a statement and its
  commit. The commit *is* the invocation, so that observer is owed the
  event.
- **Caller context comes for free.** On the statements path the local call
  runs inside the `database::execute` (or `database::commit_transaction`)
  handler, and `emit` runs inside that call, so the event carries:

  ```jsonc
  "caller": { "worker_name": "database", "function_id": "database::execute", "invocation_id": "…",
              "parent": { "worker_name": "billing", "function_id": "billing::close-invoice", "invocation_id": "…" } }
  ```

  `caller.parent` answers "who changed this row".
- **The native path has no invocation context.** It has only
  `caller: { worker_name: "database" }`. `caller.parent.*` is absent there, so
  `{"caller.parent.worker_name": {"$ne": "x"}}` still matches: we don't know,
  so we don't exclude.
- **Loop protection is automatic on the statements path.** A target that
  writes back runs at `observe_depth` 1, its `database::execute` call
  carries it, and the emitted invocation reports it. The engine stops the chain
  at the configured depth. A write from the native path, or by another client,
  has no depth: the same blind spot as today. A `caller.parent` filter is the
  explicit tool there.

### 2.4 Native capture and the routing index, driven by `onObserverAdded`

`RowChangedHandler` (the `TriggerHandler`) becomes `NativeCapture`, an
`ObserveHandler` on the function:

```rust
#[async_trait]
impl ObserveHandler for NativeCapture {
    async fn on_observer_added(&self, obs: &Observer) -> Result<(), ObserveRejection> {
        let args = match &obs.legacy {
            Some(legacy) => self.legacy_args(&legacy.config)?,        // phase 5 shim, §2.5: canonicalizes
            None => {
                let args = obs.args::<RowChangedArgs>()?;               // db required: checked by the engine
                if let Some(t) = &args.table { self.check_canonical(t)?; }   // "Orders" → hint "orders"
                args
            }
        };
        let cfg = self.config.read().await;
        let db_cfg = cfg.databases.get(&args.db)
            .ok_or_else(|| ObserveRejection::new("UNKNOWN_DB", format!("unknown db `{}`", args.db)))?;
        if db_cfg.capture == CaptureMode::Native {
            let Some(t) = &args.table else {
                return Err(ObserveRejection::new("NATIVE_CAPTURE_REQUIRES_TABLE",
                    format!("db `{}` uses capture: native; pass args.table", args.db)));
            };
            // resolve against the catalog (quoted PG identifiers are case-sensitive), then the
            // existing install path: advisory lock + DDL / changelog / binlog checks
            self.retain(&args.db, t, &obs.id).await.map_err(ObserveRejection::from)?;
        }
        self.index.insert(&args, obs.clone());                    // (db, table) → observers, with their ops
        Ok(())
    }

    async fn on_observer_removed(&self, obs: &Observer) {
        self.index.remove(&obs.id);
        self.release(&obs.id).await;                              // refcount per (db, table)
    }
}
```

`index.matching(db, table, op)` returns the observers on `(db, table)` and
those on `db` with no table, keeping those whose `ops` are absent or include
`op`. It is the args half of what `RowChangeBus` matched per subscriber; the
filters half now belongs to the observers.

- **Rejections.** A rejection moves that observer to `error`, and its
  observer's `ready()` rejects with the same message the trigger registration
  gives today.
- **One installer per table.** Capture is refcounted per `(db, table)` across
  all observers ("first activates, last releases"), not once per binding.
- **Indexed before the ack.** The observer is in the index before
  `on_observer_added` returns, so the first commit after the engine marks it `active`
  reaches it.
- **Teardown.** Installed capture stays installed when the refcount reaches
  zero. That is today's "ponytail" choice in `unregister_trigger`, unchanged.
- **Hot config reload** (`apply_config`) re-checks `row_changed.observers()`
  against the new config and sends a late rejection (`obs.reject(code, msg)`)
  for each observer that is no longer valid, e.g. one on a database that
  was removed.

### 2.5 Legacy callers

The function declares `legacy_trigger_type: "database::row-changed"`. An old
worker's `registerTrigger({ type: 'database::row-changed', config: { db, table, ops } })`
becomes an observer with `obs.legacy.config` set
([`protocol.md`](protocol.md) §6). `legacy_args`:

1. validates the config exactly as `RowChangedHandler` does today (unknown
   `db`, native without `table`; `on_observer_added` installs capture as for any
   observer);
2. returns `RowChangedArgs` with the **canonical** table, so the legacy
   observer joins the index exactly as a new observer with those args
   would.

Because both the index and the event use the canonical name, a binding
written as `"Orders"` or `"public.orders"` keeps matching exactly what it
matches today. No dual emit and no second code path. The target receives the
event as before (`deliver: "input"`), with the trigger metadata as the sidecar,
so harness bindings keep working until they move to `observe`.

## 3. Observer examples

"Which worker changed `orders`?"

```ts
iii.registerFunction('audit::orders-changed', ({ input, caller }: Observed<RowChangedEvent>) =>
  audit.record({ op: input.op, keys: input.returning, by: caller?.parent?.worker_name ?? 'external' }))

iii.observe({
  function_id: 'database::on-row-changed',
  args: { db: 'primary', table: 'orders' },
  capture: ['input', 'caller'],
}, 'audit::orders-changed')
```

"Paid invoices only, statements capture with `RETURNING id, status`, a single
activation":

```ts
iii.observe({
  function_id: 'database::on-row-changed',
  args: { db: 'primary', table: 'invoices', ops: ['update'] },
  filters: { 'input.returning': { $any: { '@.status': { $eq: 'paid' } } } },
  capture: ['input'],
  deliver: 'input',
}, 'billing::on-invoice-paid', { max_fires: 1 })
```

"Everything except my own writes" (a projector that writes back):

```rust
iii.observe(
    Source::function("database::on-row-changed")
        .args(json!({ "db": "primary" }))
        .filters(json!({ "caller.parent.worker_name": { "$ne": "order-projector" } }))
        .capture([Capture::Input]),
    "orders::project",
);
```

## 4. Cost per event at 5k statements/s

| | Today (trigger) | New |
|---|---|---|
| No subscriber or observer | 0 frames. The provider's subscriber scan runs per event. | 0 frames. One atomic load; the event isn't even serialized. |
| 1 matching subscriber or observer | 1 frame database → engine (`void`), plus 1 frame engine → target | 1 emit → 1 report item (batched, ≤ 1 frame per 5 ms), plus 1 activation frame engine → target |
| 10 matching | 10 frames database → engine, plus 10 frames engine → targets | 10 emits coalesced into 1 report item, plus 10 activation frames |
| 10 observers, none matching | 0 frames | 0 frames. The index skips observers on other tables; the routed ones' compiled filters are evaluated in the SDK. |
| Predicate the trigger config cannot express (`returning` status, `caller`) | every event of the table is delivered and the target discards most | filtered in the SDK; only matches cross the wire |
| Binding storage, filter, lifecycle, ownership | in the database worker | in the engine and SDK; the worker keeps native capture and the args index |

## 5. Acceptance

- The existing database test suites pass on both the legacy (`registerTrigger`
  through the shim) and the new (`observe`) path.
- New tests:
  - canonical `table` / `schema` in events, and a non-canonical `args.table` rejected with a hint;
  - `INVALID_ARGS` for a missing `db` and for unknown args (`tabel`);
  - routing: an observer on `orders` never receives `payments` events, `ops` restricts the operations, and an observer with no table receives every table of its db;
  - legacy routing: `"Orders"` and `"public.orders"` bindings receive `orders` events;
  - a filter miss on `emit` sends nothing;
  - a native-capture rejection reaches the observer's `ready()`;
  - `onObserverAdded` installs once per table and indexes the observer; `onObserverRemoved` removes it and decrements;
  - config reload late-rejects observers on a removed database;
  - `caller.parent` on the statements path and its absence on the native path;
  - commit-order reporting inside a transaction;
  - rollback emits nothing.
- Benchmark: 5k statements/s, with 0, 1 and 10 observers at a 1% match rate, on
  Postgres in statements mode. Report the database worker's CPU, engine CPU,
  bytes on the wire, and p99 time from commit to activation.
