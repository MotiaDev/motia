# Stacktrace PR Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address all 19 confirmed code review findings from the feat/stacktrace PR across console frontend, engine, and SDKs.

**Architecture:** Fixes are grouped into 4 waves by component area. Each wave is independent and can be parallelized. Within each wave, tasks are ordered by dependency.

**Tech Stack:** TypeScript (React), Rust, Python, Node.js

---

## Wave 1: Console Frontend (TypeScript/React)

### Task 1: Fix hasError in SpanErrorsTab to consider exception events

**Files:**
- Modify: `console/packages/console-frontend/src/components/traces/SpanErrorsTab.tsx:11`

**Step 1: Write the fix**

Change line 11 from:
```tsx
const hasError = span.status === 'error'
```
to:
```tsx
const exceptionEvent = span.events?.find(
  (e) => e.name === 'exception' || e.name?.startsWith('exception'),
)

const hasError = span.status === 'error' || !!exceptionEvent
```

And remove the duplicate `exceptionEvent` declaration currently on lines 13-15 since we moved it above `hasError`.

The full rewrite of lines 11-15 becomes:
```tsx
const exceptionEvent = span.events?.find(
  (e) => e.name === 'exception' || e.name?.startsWith('exception'),
)
const hasError = span.status === 'error' || !!exceptionEvent
```

**Step 2: Verify no type errors**

Run: `cd console && npx tsc --noEmit --project packages/console-frontend/tsconfig.json 2>&1 | head -20`
Expected: No errors related to SpanErrorsTab

**Step 3: Commit**

```bash
git add console/packages/console-frontend/src/components/traces/SpanErrorsTab.tsx
git commit -m "fix(console): include exception events in SpanErrorsTab hasError check"
```

---

### Task 2: Sort events by timestamp in SpanLogsTab

**Files:**
- Modify: `console/packages/console-frontend/src/components/traces/SpanLogsTab.tsx:28,44,48`

**Step 1: Write the fix**

Replace lines 28 and 44:
```tsx
const events = span.events || []
```
and
```tsx
const firstEventMs = events.length > 0 ? toMs(events[0].timestamp_unix_nano) : 0
```

With:
```tsx
const sortedEvents = [...(span.events || [])].sort(
  (a, b) => a.timestamp_unix_nano - b.timestamp_unix_nano,
)
```
and
```tsx
const firstEventMs = sortedEvents.length > 0 ? toMs(sortedEvents[0].timestamp_unix_nano) : 0
```

Then update ALL remaining references from `events` to `sortedEvents`:
- Line 30: `if (sortedEvents.length === 0)`
- Line 48: `{sortedEvents.map((event, index) => {`
- Line 106: `{sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}`

**Step 2: Verify no type errors**

Run: `cd console && npx tsc --noEmit --project packages/console-frontend/tsconfig.json 2>&1 | head -20`
Expected: No errors related to SpanLogsTab

**Step 3: Commit**

```bash
git add console/packages/console-frontend/src/components/traces/SpanLogsTab.tsx
git commit -m "fix(console): sort events by timestamp in SpanLogsTab to prevent negative offsets"
```

---

### Task 3: Use null-prototype objects in attributesToRecord

**Files:**
- Modify: `console/packages/console-frontend/src/lib/traceTransform.ts:112-124`

**Step 1: Write the fix**

Replace the entire `attributesToRecord` function body (lines 112-124):
```ts
function attributesToRecord(
  attributes: Array<[string, unknown]> | Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!attributes) return Object.create(null) as Record<string, unknown>

  const record: Record<string, unknown> = Object.create(null)

  if (!Array.isArray(attributes)) {
    for (const [key, value] of Object.entries(attributes)) {
      record[key] = value
    }
    return record
  }

  for (const item of attributes) {
    if (Array.isArray(item) && item.length >= 2) {
      record[String(item[0])] = item[1]
    }
  }
  return record
}
```

**Step 2: Verify no type errors**

Run: `cd console && npx tsc --noEmit --project packages/console-frontend/tsconfig.json 2>&1 | head -20`
Expected: No errors related to traceTransform

**Step 3: Commit**

```bash
git add console/packages/console-frontend/src/lib/traceTransform.ts
git commit -m "fix(console): use null-prototype objects in attributesToRecord to prevent prototype pollution"
```

---

## Wave 2: Engine (Rust)

### Task 4: Preserve nested OTLP attributes in otlp_kv_to_key_value

**Files:**
- Modify: `engine/src/modules/observability/otel.rs:1261-1275`

**Step 1: Write the fix**

Replace the `otlp_kv_to_key_value` function:
```rust
fn otlp_kv_to_key_value(kv: &OtlpKeyValue) -> Option<KeyValue> {
    let val = kv.value.as_ref()?;

    // Handle primitive types directly as OTel values
    if let Some(s) = &val.string_value {
        return Some(KeyValue::new(kv.key.clone(), opentelemetry::Value::String(s.clone().into())));
    }
    if let Some(i) = val.int_value {
        return Some(KeyValue::new(kv.key.clone(), opentelemetry::Value::I64(i)));
    }
    if let Some(d) = val.double_value {
        return Some(KeyValue::new(kv.key.clone(), opentelemetry::Value::F64(d)));
    }
    if let Some(b) = val.bool_value {
        return Some(KeyValue::new(kv.key.clone(), opentelemetry::Value::Bool(b)));
    }

    // Nested structures: serialize to JSON string representation
    if val.kvlist_value.is_some() || val.array_value.is_some() {
        let json_str = val.to_string_value();
        return Some(KeyValue::new(kv.key.clone(), opentelemetry::Value::String(json_str.into())));
    }

    None
}
```

**Step 2: Verify it compiles**

Run: `cd engine && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add engine/src/modules/observability/otel.rs
git commit -m "fix(engine): preserve nested OTLP attributes in span conversion"
```

---

### Task 5: Remove expensive backtrace from 404 handler

**Files:**
- Modify: `engine/src/modules/rest_api/views.rs:587-593`

**Step 1: Write the fix**

Replace lines 587-593:
```rust
let backtrace = std::backtrace::Backtrace::capture();
tracing::error!(
    exception.type = "NotFoundError",
    exception.message = %format!("Route not found: {} {}", method, actual_path),
    exception.stacktrace = %backtrace,
    "Route not found"
);
```
with:
```rust
tracing::error!(
    exception.type = "NotFoundError",
    exception.message = %format!("Route not found: {} {}", method, actual_path),
    "Route not found: {} {}", method, actual_path
);
```

**Step 2: Verify it compiles**

Run: `cd engine && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add engine/src/modules/rest_api/views.rs
git commit -m "fix(engine): remove expensive backtrace capture from 404 handler"
```

---

### Task 6: Fix STREAM_SET_ERROR -> STREAM_UPDATE_ERROR

**Files:**
- Modify: `engine/src/modules/stream/stream.rs:831`

**Step 1: Write the fix**

Change line 831 from:
```rust
code: "STREAM_SET_ERROR".to_string(),
```
to:
```rust
code: "STREAM_UPDATE_ERROR".to_string(),
```

**Step 2: Verify it compiles**

Run: `cd engine && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Run existing stream tests**

Run: `cd engine && cargo test stream 2>&1 | tail -10`
Expected: All tests pass

**Step 4: Commit**

```bash
git add engine/src/modules/stream/stream.rs
git commit -m "fix(engine): use correct STREAM_UPDATE_ERROR code in update() failure path"
```

---

### Task 7: Fix stuck invocations when channel send fails in traits.rs

**Files:**
- Modify: `engine/src/workers/traits.rs:88-116`

**Step 1: Write the fix**

Replace lines 88-116 (the `Box::pin(async move { ... })` block):
```rust
Box::pin(async move {
    // Inject trace context and baggage from the captured OTel context
    let traceparent = inject_traceparent_from_context(&otel_context);
    let baggage = inject_baggage_from_context(&otel_context);

    let send_result = self
        .channel
        .send(Outbound::Protocol(Message::InvokeFunction {
            invocation_id,
            function_id,
            data: input,
            traceparent,
            baggage,
        }))
        .await;

    match send_result {
        Ok(_) => {
            self.invocations
                .write()
                .await
                .insert(invocation_id.unwrap());
            FunctionResult::Deferred
        }
        Err(err) => FunctionResult::Failure(ErrorBody {
            code: "channel_send_failed".into(),
            message: err.to_string(),
            stacktrace: None,
        }),
    }
})
```

Key change: send first, only register invocation on success, return Failure on send error.

**Step 2: Verify it compiles**

Run: `cd engine && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add engine/src/workers/traits.rs
git commit -m "fix(engine): return failure instead of deferred when channel send fails"
```

---

### Task 8: Replace dbg! with structured tracing in bridge_client

**Files:**
- Modify: `engine/src/modules/bridge_client/mod.rs` (lines 130, 167, 208)

**Step 1: Write the fix**

Replace each `dbg!(&err);` occurrence:

Line 130: Replace `dbg!(&err);` with:
```rust
tracing::error!(error = ?err, "Bridge call_with_timeout failed");
```

Line 167: Replace `dbg!(&err);` with:
```rust
tracing::error!(error = ?err, "Bridge call_void failed");
```

Line 208: Replace `dbg!(&err);` with:
```rust
tracing::error!(error = ?err, "Bridge call_with_timeout failed");
```

**Step 2: Verify it compiles**

Run: `cd engine && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add engine/src/modules/bridge_client/mod.rs
git commit -m "fix(engine): replace dbg! with structured tracing in bridge_client"
```

---

## Wave 3: Rust SDK

### Task 9: Add #[non_exhaustive] to ErrorBody

**Files:**
- Modify: `sdk/packages/rust/iii/src/protocol.rs:248`

**Step 1: Write the fix**

Add `#[non_exhaustive]` above the struct definition. Change:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorBody {
```
to:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[non_exhaustive]
pub struct ErrorBody {
```

**Step 2: Verify it compiles**

Run: `cd sdk/packages/rust/iii && cargo check 2>&1 | tail -5`
Expected: No errors (or possibly errors from struct literal construction sites that need updating)

**Step 3: Fix any struct literal sites**

If `cargo check` reports errors about non-exhaustive struct construction from outside the crate, those won't apply here since all construction is internal. If there are errors, add `..Default::default()` or constructor functions. Since `ErrorBody` is only constructed inside the crate, this should compile cleanly.

**Step 4: Commit**

```bash
git add sdk/packages/rust/iii/src/protocol.rs
git commit -m "fix(rust-sdk): add non_exhaustive to ErrorBody for semver safety"
```

---

### Task 10: Fix exception.type in http_instrumentation.rs

**Files:**
- Modify: `sdk/packages/rust/iii/src/telemetry/http_instrumentation.rs:163-166`

**Step 1: Write the fix**

Replace lines 163-166:
```rust
cx.span().add_event("exception", vec![
    KeyValue::new("exception.type", err.to_string()),
    KeyValue::new("exception.message", err.to_string()),
]);
```
with:
```rust
let backtrace = std::backtrace::Backtrace::force_capture();
cx.span().add_event("exception", vec![
    KeyValue::new("exception.type", "reqwest::Error"),
    KeyValue::new("exception.message", err.to_string()),
    KeyValue::new("exception.stacktrace", backtrace.to_string()),
]);
```

**Step 2: Verify it compiles**

Run: `cd sdk/packages/rust/iii && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add sdk/packages/rust/iii/src/telemetry/http_instrumentation.rs
git commit -m "fix(rust-sdk): use correct exception.type and add stacktrace in http instrumentation"
```

---

### Task 11: Use Backtrace::force_capture in telemetry/mod.rs with_span

**Files:**
- Modify: `sdk/packages/rust/iii/src/telemetry/mod.rs:350`

**Step 1: Write the fix**

Change line 350 from:
```rust
let backtrace = std::backtrace::Backtrace::capture();
```
to:
```rust
let backtrace = std::backtrace::Backtrace::force_capture();
```

**Step 2: Verify it compiles**

Run: `cd sdk/packages/rust/iii && cargo check 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add sdk/packages/rust/iii/src/telemetry/mod.rs
git commit -m "fix(rust-sdk): use force_capture for reliable backtraces in with_span"
```

---

### Task 12: Share stacktrace between span event and ErrorBody in iii.rs

**Files:**
- Modify: `sdk/packages/rust/iii/src/iii.rs:1146-1186`

**Step 1: Write the fix**

Replace lines 1146-1154 (the `Err(err)` arm in the otel block):
```rust
Err(err) => {
    span.set_status(Status::error(err.to_string()));
    let stacktrace = std::backtrace::Backtrace::force_capture().to_string();
    span.add_event("exception", vec![
        KeyValue::new("exception.type", "InvocationError"),
        KeyValue::new("exception.message", err.to_string()),
        KeyValue::new("exception.stacktrace", stacktrace.clone()),
    ]);
}
```

Then replace line 1185 in the `Err(err)` arm of `Message::InvocationResult`:
```rust
stacktrace: Some(std::backtrace::Backtrace::force_capture().to_string()),
```

This requires the stacktrace variable to be accessible in both scopes. Restructure: capture `stacktrace` in the otel block and store it in an `Option<String>` that the message construction can use.

Full approach — declare `let mut error_stacktrace: Option<String> = None;` before the otel block. In the `Err` arm, set `error_stacktrace = Some(stacktrace.clone());`. Then in the message construction, use `stacktrace: error_stacktrace,`.

**Step 2: Verify it compiles**

Run: `cd sdk/packages/rust/iii && cargo check --features otel 2>&1 | tail -10`
Expected: No errors

**Step 3: Commit**

```bash
git add sdk/packages/rust/iii/src/iii.rs
git commit -m "fix(rust-sdk): share single stacktrace between span event and ErrorBody"
```

---

### Task 13: Fix test serialization in telemetry/mod.rs tests

**Files:**
- Modify: `sdk/packages/rust/iii/Cargo.toml` (add serial_test dev-dependency)
- Modify: `sdk/packages/rust/iii/src/telemetry/mod.rs:419-509`

**Step 1: Add serial_test dependency**

Add to `[dev-dependencies]` in Cargo.toml:
```toml
serial_test = "3"
```

**Step 2: Update the tests**

Add at top of the `#[cfg(test)] mod tests` block:
```rust
use serial_test::serial;
```

Add `#[serial]` attribute to both test functions:
```rust
#[tokio::test]
#[serial]
async fn test_with_span_error_records_exception_event() {
```

```rust
#[tokio::test]
#[serial]
async fn test_with_span_success_no_exception_event() {
```

Replace `let span = &spans[0];` in the error test (line 442) with:
```rust
let span = spans
    .iter()
    .find(|s| s.name == "test-error-span")
    .expect("should find test-error-span");
```

Replace `let span = &spans[0];` in the success test (line 503) with:
```rust
let span = spans
    .iter()
    .find(|s| s.name == "test-ok-span")
    .expect("should find test-ok-span");
```

**Step 3: Verify tests pass**

Run: `cd sdk/packages/rust/iii && cargo test --features otel telemetry 2>&1 | tail -15`
Expected: Both tests pass

**Step 4: Commit**

```bash
git add sdk/packages/rust/iii/Cargo.toml sdk/packages/rust/iii/src/telemetry/mod.rs
git commit -m "fix(rust-sdk): serialize telemetry tests and find spans by name"
```

---

## Wave 4: Python & Node SDKs

### Task 14: Record exceptions on span in Python _invoke_with_context

**Files:**
- Modify: `sdk/packages/python/iii/src/iii/iii.py:373-383`

**Step 1: Write the fix**

Replace lines 373-381 (inside the `with tracer.start_as_current_span(...) as span:` block):
```python
            with tracer.start_as_current_span(
                f"call {handler.__name__}",
                context=parent_ctx,
                kind=trace.SpanKind.SERVER,
            ) as span:
                try:
                    result = await handler(data)
                    span.set_status(trace.StatusCode.OK)
                    response_traceparent = self._inject_traceparent()
                    return result, response_traceparent
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(trace.StatusCode.ERROR)
                    raise
```

This preserves the outer `except ImportError` fallback on line 382-383 unchanged.

**Step 2: Run the exception test**

Run: `cd sdk/packages/python/iii && python -m pytest tests/test_invocation_exception.py -v 2>&1 | tail -15`
Expected: Both tests pass (after Task 15 fixes test attributes)

**Step 3: Commit**

```bash
git add sdk/packages/python/iii/src/iii/iii.py
git commit -m "fix(python-sdk): record exceptions on span in _invoke_with_context"
```

---

### Task 15: Fix test attribute names in test_invocation_exception.py

**Files:**
- Modify: `sdk/packages/python/iii/tests/test_invocation_exception.py:27-33,76-82`

**Step 1: Write the fix**

The real III class uses: `_functions`, `_pending`, `_queue`, `_running` (no `_channels`, no `_pending_invocations`, no `_outbound`).

Replace lines 27-33 (first test):
```python
        client = III.__new__(III)
        client._functions = {}
        client._pending = {}
        client._queue = []
        client._running = False
```

Replace lines 76-82 (second test):
```python
        client = III.__new__(III)
        client._functions = {}
        client._pending = {}
        client._queue = []
        client._running = False
```

Note: `_queue` is a `list` (not `asyncio.Queue`), `_pending` is a `dict`, and `_channels` doesn't exist on III.

**Step 2: Run the tests**

Run: `cd sdk/packages/python/iii && python -m pytest tests/test_invocation_exception.py -v 2>&1 | tail -15`
Expected: Both tests pass

**Step 3: Commit**

```bash
git add sdk/packages/python/iii/tests/test_invocation_exception.py
git commit -m "fix(python-sdk): use correct III attribute names in invocation exception tests"
```

---

### Task 16: Move traceback import to module level in Python SDK

**Files:**
- Modify: `sdk/packages/python/iii/src/iii/iii.py:1-12,434,468`

**Step 1: Write the fix**

Add `import traceback` with the other module-level imports (after line 6 `import os`):
```python
import traceback
```

Remove the inline `import traceback` at line 434 and line 468.

**Step 2: Run tests**

Run: `cd sdk/packages/python/iii && python -m pytest tests/ -v 2>&1 | tail -15`
Expected: All tests pass

**Step 3: Commit**

```bash
git add sdk/packages/python/iii/src/iii/iii.py
git commit -m "refactor(python-sdk): move traceback import to module level"
```

---

### Task 17: Handle non-Error throws in Node.js SDK

**Files:**
- Modify: `sdk/packages/node/iii/src/iii.ts:803-811`

**Step 1: Write the fix**

Replace lines 803-814 (the catch block):
```typescript
      } catch (error) {
        const isError = error instanceof Error
        this.sendMessage(MessageType.InvocationResult, {
          invocation_id,
          function_id,
          error: {
            code: 'invocation_failed',
            message: isError ? error.message : String(error),
            stacktrace: isError ? error.stack : undefined,
          },
          traceparent: getResponseTraceparent(),
          baggage: getResponseBaggage(),
        })
      }
```

**Step 2: Verify no type errors**

Run: `cd sdk/packages/node/iii && npx tsc --noEmit 2>&1 | tail -10`
Expected: No errors

**Step 3: Commit**

```bash
git add sdk/packages/node/iii/src/iii.ts
git commit -m "fix(node-sdk): handle non-Error throws in invocation error handling"
```

---

## Summary

| Wave | Tasks | Component |
|------|-------|-----------|
| 1 | 1-3 | Console Frontend (TS/React) |
| 2 | 4-8 | Engine (Rust) |
| 3 | 9-13 | Rust SDK |
| 4 | 14-17 | Python & Node SDKs |

**Total:** 17 tasks, 19 findings addressed.

**Dependencies:**
- Task 14 and 15 must both be applied before running Python tests (14 fixes the code, 15 fixes the test attributes)
- Task 11 should be applied before Task 12 (consistent force_capture usage)
- All other tasks within a wave are independent

**Final verification after all tasks:**
```bash
cd engine && cargo check
cd sdk/packages/rust/iii && cargo check --features otel && cargo test --features otel
cd sdk/packages/python/iii && python -m pytest tests/ -v
cd sdk/packages/node/iii && npx tsc --noEmit
cd console && npx tsc --noEmit --project packages/console-frontend/tsconfig.json
```
