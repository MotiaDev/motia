// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

use std::sync::Arc;

use dashmap::DashMap;
use opentelemetry::KeyValue;
use serde_json::Value;
use tokio::sync::oneshot::{self, error::RecvError};
use tracing::Instrument;
use tracing_opentelemetry::OpenTelemetrySpanExt;
use uuid::Uuid;

use crate::telemetry::SpanExt;

use crate::{
    function::{Function, FunctionResult, HandlerFn},
    protocol::ErrorBody,
    worker_connections::WorkerConnection,
    workers::observability::metrics::get_engine_metrics,
    workers::worker::rbac_session::Session,
};

pub mod auth;
pub mod http_function;
pub mod http_invoker;
pub mod method;
pub mod signature;
pub mod url_validator;

// Keep the handler snapshot until its callback returns, and transfer the payload
// to it even when dispatch subsequently waits for a deferred worker response.
async fn call_handler_with_metadata<H: AsRef<HandlerFn> + Send>(
    handler: H,
    invocation_id: Option<Uuid>,
    data: Value,
    session: Option<Arc<Session>>,
    metadata: Option<Value>,
) -> FunctionResult<Option<Value>, ErrorBody> {
    (handler.as_ref())(invocation_id, data, session, metadata).await
}

pub struct Invocation {
    pub id: Uuid,
    pub function_id: String,
    pub worker_id: Option<Uuid>,
    pub sender: oneshot::Sender<Result<Option<Value>, ErrorBody>>,
    /// W3C traceparent for distributed tracing context
    pub traceparent: Option<String>,
    /// W3C baggage for cross-cutting context propagation
    pub baggage: Option<String>,
}

type Invocations = Arc<DashMap<Uuid, Invocation>>;

// Remove unfinished registrations when dispatch fails or its future is dropped.
struct InvocationRegistration<'a> {
    handler: &'a InvocationHandler,
    id: Uuid,
}

impl Drop for InvocationRegistration<'_> {
    fn drop(&mut self) {
        self.handler.remove(&self.id);
    }
}

#[derive(Default)]
pub struct InvocationHandler {
    invocations: Invocations,
    executors: DashMap<Uuid, (WorkerConnection, crate::engine::RoutingReservation)>,
    callers: DashMap<Uuid, WorkerConnection>,
}
impl InvocationHandler {
    pub fn new() -> Self {
        Self {
            invocations: Arc::new(DashMap::new()),
            executors: DashMap::new(),
            callers: DashMap::new(),
        }
    }

    fn clear_worker_id(worker: WorkerConnection, id: Uuid) {
        if let Ok(mut ids) = worker.invocations.try_write() {
            ids.remove(&id);
            return;
        }
        // Drop cannot await. Capacity waits/cancellation never retain this lock;
        // the uncommon concurrent teardown case completes on the runtime.
        tokio::spawn(async move { worker.remove_invocation(&id).await });
    }

    pub(crate) fn reserve_executor(
        &self,
        id: Uuid,
        worker: WorkerConnection,
        reservation: crate::engine::RoutingReservation,
    ) -> bool {
        let Some(_pending) = self.invocations.get(&id) else {
            return false;
        };
        self.executors.insert(id, (worker, reservation));
        true
    }

    pub(crate) fn release_executor(&self, id: &Uuid) {
        if let Some((_, (worker, reservation))) = self.executors.remove(id) {
            drop(reservation);
            Self::clear_worker_id(worker, *id);
        }
    }

    pub(crate) fn pending(
        &self,
        id: &Uuid,
    ) -> Option<dashmap::mapref::one::Ref<'_, Uuid, Invocation>> {
        self.invocations.get(id)
    }

    pub(crate) fn remove_from_executor(&self, id: &Uuid, worker: Uuid) -> Option<Invocation> {
        // Same lock order as reserve_executor: pending first, executor second.
        let entry = match self.invocations.entry(*id) {
            dashmap::mapref::entry::Entry::Occupied(entry) => entry,
            dashmap::mapref::entry::Entry::Vacant(_) => return None,
        };
        let executor = self.executors.get(id);
        if executor.as_ref().is_some_and(|entry| entry.0.id != worker) {
            return None;
        }
        drop(executor);
        let invocation = entry.remove();
        self.finish_registration(id);
        Some(invocation)
    }

    pub fn remove(&self, invocation_id: &Uuid) -> Option<Invocation> {
        let invocation = self
            .invocations
            .remove(invocation_id)
            .map(|(_, invocation)| invocation);
        if invocation.is_some() {
            self.finish_registration(invocation_id);
        }
        invocation
    }

    fn finish_registration(&self, invocation_id: &Uuid) {
        self.release_executor(invocation_id);
        if let Some((_, caller)) = self.callers.remove(invocation_id) {
            Self::clear_worker_id(caller, *invocation_id);
        }
    }

    pub fn halt_invocation(&self, invocation_id: &Uuid) {
        let invocation = self.remove(invocation_id);

        if let Some(invocation) = invocation {
            let _ = invocation.sender.send(Err(ErrorBody {
                code: "invocation_stopped".into(),
                message: "Invocation stopped".into(),
                stacktrace: None,
            }));
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn handle_invocation(
        &self,
        invocation_id: Option<Uuid>,
        worker_id: Option<Uuid>,
        function_id: String,
        body: Value,
        function_handler: Function,
        traceparent: Option<String>,
        baggage: Option<String>,
        session: Option<Arc<Session>>,
        metadata: Option<Value>,
    ) -> Result<Result<Option<Value>, ErrorBody>, RecvError> {
        self.handle_invocation_inner(
            invocation_id,
            worker_id,
            None,
            function_id,
            body,
            function_handler,
            traceparent,
            baggage,
            session,
            metadata,
        )
        .await
    }

    #[allow(clippy::too_many_arguments)]
    pub(crate) async fn handle_invocation_with_handler(
        &self,
        invocation_id: Option<Uuid>,
        caller: Option<&WorkerConnection>,
        function_id: String,
        body: Value,
        function_handler: Arc<HandlerFn>,
        traceparent: Option<String>,
        baggage: Option<String>,
        session: Option<Arc<Session>>,
        metadata: Option<Value>,
    ) -> Result<Result<Option<Value>, ErrorBody>, RecvError> {
        self.handle_invocation_inner(
            invocation_id,
            caller.map(|worker| worker.id),
            caller.filter(|_| invocation_id.is_some()),
            function_id,
            body,
            function_handler,
            traceparent,
            baggage,
            session,
            metadata,
        )
        .await
    }

    #[allow(clippy::too_many_arguments)]
    async fn handle_invocation_inner<H: AsRef<HandlerFn> + Send>(
        &self,
        invocation_id: Option<Uuid>,
        worker_id: Option<Uuid>,
        caller: Option<&WorkerConnection>,
        function_id: String,
        body: Value,
        function_handler: H,
        traceparent: Option<String>,
        baggage: Option<String>,
        session: Option<Arc<Session>>,
        metadata: Option<Value>,
    ) -> Result<Result<Option<Value>, ErrorBody>, RecvError> {
        // Create span with dynamic name using the function_id
        // Using OTEL semantic conventions for FaaS (Function as a Service)
        let is_builtin = crate::workers::telemetry::is_iii_builtin_function_id(&function_id);

        // Decide whether the ENGINE emits its own `call <fn>` span here
        // (policy in `telemetry::should_suppress_invocation_span`):
        //   - Observability functions (`engine::traces::*`, `engine::logs::*`,
        //     …) are NEVER traced — the pipeline must not observe itself.
        //   - Built-in functions (`state::*`, `stream::*`, `engine::*`,
        //     `configuration::*`, `iii::*`, …) execute in-process, so this
        //     span is the only possible record of the call. Emitted when the
        //     caller supplied a `traceparent` — the call then nests inside
        //     the caller's trace (and carries error status when it fails).
        //     Context-free built-in calls (console RPC polling, boot reads,
        //     engine machinery) stay suppressed so they never root new
        //     single-span traces; `III_OTEL_TRACE_BUILTINS=true` forces them.
        //   - Worker-routed (non-builtin) functions are executed by an external
        //     worker that emits its own handler span (`execute <fn>`, INTERNAL,
        //     service = that worker). An engine-side `call` span would wrap the
        //     same logical invocation as a cross-service duplicate, so suppress
        //     it and let the worker's span be the canonical one.
        let suppress_span = crate::workers::telemetry::should_suppress_invocation_span(
            &function_id,
            traceparent.is_some(),
            crate::workers::telemetry::trace_builtins_enabled(),
        );

        let span = if suppress_span {
            tracing::Span::none()
        } else {
            tracing::info_span!(
                "call",
                otel.name = %format!("call {}", function_id),
                otel.kind = "server",
                otel.status_code = tracing::field::Empty,
                // FAAS semantic conventions (https://opentelemetry.io/docs/specs/semconv/faas/)
                "faas.invoked_name" = %function_id,
                "faas.trigger" = "other",  // III Engine uses its own invocation mechanism
                // Keep function_id for backward compatibility
                function_id = %function_id,
                // Tag internal vs user functions for filtering
                "iii.function.kind" = if is_builtin { "internal" } else { "user" },
            )
            .with_parent_headers(traceparent.as_deref(), None, baggage.as_deref())
        };

        // Run the dispatch under the caller's OTel context whenever one was
        // provided, for BOTH worker-routed and built-in calls:
        //   - Worker-routed: the engine span is suppressed, so there is no
        //     tracing span left to carry the caller's context across the WS
        //     boundary. Attaching it lets the worker's own span (and its
        //     descendants) nest under the caller's trace instead of orphaning
        //     into a new one. `WorkerConnection::handle_function` falls back to
        //     this ambient context (see `worker_connections/traits.rs`).
        //   - Built-in: state/stream writes fire triggers in a spawned
        //     `*_triggers` span. Without the caller context that span (and the
        //     trigger handlers it invokes) would root a brand-new, disconnected
        //     trace; attaching it nests the fan-out under the writer (e.g.
        //     `approval::resolve` → state write → `turn::on_approval`).
        let dispatch_cx = if traceparent.is_some() || baggage.is_some() {
            let cx = crate::telemetry::extract_context(traceparent.as_deref(), baggage.as_deref());
            // The caller's baggage names the CALLER; rewrite `iii.function.id`
            // to the function being invoked so worker-side spans are attributed
            // to their owning function (mirrors the enqueue boundary in
            // `engine/mod.rs` and the `fn_queue` consumer in `queue.rs`).
            // Built-ins execute in-process under the caller's identity and are
            // left untouched.
            Some(if is_builtin {
                cx
            } else {
                crate::telemetry::with_function_id_baggage(&cx, &function_id)
            })
        } else {
            None
        };

        let invocation_fut = async {
            let invocation_id = invocation_id.unwrap_or_else(Uuid::new_v4);
            let (sender, mut receiver) = oneshot::channel();
            // A worker can reply or disconnect before its handler returns Deferred.
            self.invocations.insert(invocation_id, Invocation {
                id: invocation_id,
                function_id: function_id.clone(),
                worker_id,
                sender,
                traceparent,
                baggage,
            });
            let _registration = InvocationRegistration {
                handler: self,
                id: invocation_id,
            };

            if let Some(caller) = caller {
                let mut invocations = caller.invocations.write().await;
                // Cleanup sets this flag before taking the same lock to drain IDs.
                if caller.cleanup_claimed.load(std::sync::atomic::Ordering::SeqCst) {
                    return Ok(Err(ErrorBody {
                        code: "invocation_stopped".into(),
                        message: "Invocation stopped".into(),
                        stacktrace: None,
                    }));
                }
                invocations.insert(invocation_id);
                self.callers.insert(invocation_id, caller.clone());
            }

            // Start timer for invocation duration
            let start_time = std::time::Instant::now();
            let metrics = get_engine_metrics();

            let result = tokio::select! {
                biased;
                result = &mut receiver => return result,
                result = call_handler_with_metadata(
                    function_handler, Some(invocation_id), body, session, metadata,
                ) => result,
            };

            // Calculate duration
            let duration = start_time.elapsed().as_secs_f64();

            let result = match result {
                FunctionResult::Success(result) => {
                    tracing::debug!(invocation_id = %invocation_id, function_id = %function_id, "Function completed successfully");
                    tracing::Span::current().record("otel.status_code", "OK");

                    // Record metrics
                    let attributes = [
                        KeyValue::new("function_id", function_id.clone()),
                        KeyValue::new("status", "ok"),
                    ];
                    metrics.invocations_total.add(1, &attributes);
                    metrics.invocation_duration.record(duration, &attributes);

                    // Update accumulator for readable metrics
                    let acc = crate::workers::observability::metrics::get_metrics_accumulator();
                    acc.invocations_total.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.invocations_success.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.increment_function(&function_id);
                    if !crate::workers::telemetry::is_iii_builtin_function_id(&function_id) {
                        let _ = acc.first_user_success_fn.set(function_id.clone());
                    }

                    Ok(Ok(result))
                }
                FunctionResult::Failure(error) => {
                    tracing::debug!(invocation_id = %invocation_id, function_id = %function_id, error_code = %error.code, "Function failed: {}", error.message);
                    let current_span = tracing::Span::current();
                    current_span.record("otel.status_code", "ERROR");
                    // Attach the error onto the span so the trace UI can render
                    // detail — a bare ERROR status carries no message. The
                    // console's error tab reads `error.message`/`error.type`
                    // attributes and an `exception` event. No-op when the engine
                    // span is suppressed for a worker-routed call (that worker's
                    // own span carries the failure instead).
                    current_span.set_attribute("error.message", error.message.clone());
                    current_span.set_attribute("error.type", error.code.clone());
                    let mut exception_attrs = vec![
                        KeyValue::new("exception.message", error.message.clone()),
                        KeyValue::new("exception.type", error.code.clone()),
                    ];
                    if let Some(stacktrace) = error.stacktrace.clone() {
                        current_span.set_attribute("error.stack", stacktrace.clone());
                        exception_attrs.push(KeyValue::new("exception.stacktrace", stacktrace));
                    }
                    current_span.add_event("exception", exception_attrs);

                    // Record metrics
                    let mut attributes = [
                        KeyValue::new("function_id", function_id.clone()),
                        KeyValue::new("status", "error"),
                    ];
                    metrics.invocations_total.add(1, &attributes);
                    metrics.invocation_duration.record(duration, &attributes);
                    attributes[1] = KeyValue::new("error_code", error.code.clone());
                    metrics.invocation_errors_total.add(1, &attributes);

                    // Update accumulator for readable metrics
                    let acc = crate::workers::observability::metrics::get_metrics_accumulator();
                    acc.invocations_total.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.invocations_error.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.increment_function(&function_id);
                    if !crate::workers::telemetry::is_iii_builtin_function_id(&function_id) {
                        let _ = acc.first_user_failure_fn.set(function_id.clone());
                    }

                    Ok(Err(error))
                }
                FunctionResult::NoResult => {
                    tracing::debug!(invocation_id = %invocation_id, function_id = %function_id, "Function no result");
                    tracing::Span::current().record("otel.status_code", "OK");

                    // Record metrics
                    let attributes = [
                        KeyValue::new("function_id", function_id.clone()),
                        KeyValue::new("status", "ok"),
                    ];
                    metrics.invocations_total.add(1, &attributes);
                    metrics.invocation_duration.record(duration, &attributes);

                    // Update accumulator for readable metrics
                    let acc = crate::workers::observability::metrics::get_metrics_accumulator();
                    acc.invocations_total.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.invocations_success.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.increment_function(&function_id);

                    Ok(Ok(None))
                }
                FunctionResult::Deferred => {
                    tracing::debug!(invocation_id = %invocation_id, function_id = %function_id, "Function deferred");

                    // Drop metric attributes before waiting for the worker response.
                    {
                        let attributes = [
                            KeyValue::new("function_id", function_id.clone()),
                            KeyValue::new("status", "deferred"),
                        ];
                        metrics.invocations_total.add(1, &attributes);
                        metrics.invocation_duration.record(duration, &attributes);
                    }

                    // Update accumulator for readable metrics
                    let acc = crate::workers::observability::metrics::get_metrics_accumulator();
                    acc.invocations_total.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.invocations_deferred.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    acc.increment_function(&function_id);

                    receiver.await
                }
            };
            match &result {
                Ok(Ok(_)) => {
                    tracing::Span::current().record("otel.status_code", "OK");
                }
                Ok(Err(_)) | Err(_) => {
                    tracing::Span::current().record("otel.status_code", "ERROR");
                }
            };
            result
        }
        .instrument(span);

        match dispatch_cx {
            // Engine span suppressed for a worker-routed call: run the dispatch
            // under the caller's OTel context so the worker's span nests under
            // the caller's trace instead of orphaning into a new one.
            Some(cx) => {
                use opentelemetry::trace::FutureExt as _;
                invocation_fut.with_context(cx).await
            }
            None => invocation_fut.await,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invocation_handler_new() {
        let handler = InvocationHandler::new();
        assert!(handler.invocations.is_empty());
    }

    #[test]
    fn test_invocation_handler_default() {
        let handler = InvocationHandler::default();
        assert!(handler.invocations.is_empty());
    }

    #[test]
    fn test_invocation_handler_remove_nonexistent() {
        let handler = InvocationHandler::new();
        let id = Uuid::new_v4();
        let result = handler.remove(&id);
        assert!(result.is_none());
    }

    #[test]
    fn test_invocation_handler_remove_existing() {
        let handler = InvocationHandler::new();
        let id = Uuid::new_v4();
        let (sender, _receiver) = oneshot::channel();

        let invocation = Invocation {
            id,
            function_id: "test_fn".to_string(),
            worker_id: None,
            sender,
            traceparent: None,
            baggage: None,
        };
        handler.invocations.insert(id, invocation);

        let removed = handler.remove(&id);
        assert!(removed.is_some());
        assert_eq!(removed.unwrap().id, id);
        assert!(handler.invocations.is_empty());
    }

    #[test]
    fn test_invocation_handler_halt_invocation_sends_error() {
        let handler = InvocationHandler::new();
        let id = Uuid::new_v4();
        let (sender, mut receiver) = oneshot::channel();

        let invocation = Invocation {
            id,
            function_id: "test_fn".to_string(),
            worker_id: None,
            sender,
            traceparent: None,
            baggage: None,
        };
        handler.invocations.insert(id, invocation);

        handler.halt_invocation(&id);

        // The invocation should have been removed.
        assert!(handler.invocations.is_empty());

        // The receiver should get an error result.
        let result = receiver.try_recv();
        assert!(result.is_ok());
        let inner = result.unwrap();
        assert!(inner.is_err());
        let error = inner.unwrap_err();
        assert_eq!(error.code, "invocation_stopped");
        assert_eq!(error.message, "Invocation stopped");
    }

    #[test]
    fn test_invocation_handler_halt_nonexistent_is_noop() {
        let handler = InvocationHandler::new();
        let id = Uuid::new_v4();
        // Should not panic.
        handler.halt_invocation(&id);
    }

    #[test]
    fn dispatch_baggage_rewrite_names_the_target_function() {
        // `handle_invocation` rewrites `iii.function.id` in the dispatch
        // context for non-builtin targets (extract → rewrite → inject is the
        // exact path the worker-bound baggage header takes), so worker-side
        // spans are attributed to the function they serve — not the caller.
        let caller = "iii.session.id=s-1,iii.function.id=parent::fn";
        let cx = crate::telemetry::extract_context(None, Some(caller));
        let rewritten = crate::telemetry::with_function_id_baggage(&cx, "child::fn");
        let header =
            crate::telemetry::inject_baggage_from_context(&rewritten).expect("baggage header");
        assert!(header.contains("iii.function.id=child::fn"));
        assert!(!header.contains("iii.function.id=parent::fn"));
        assert!(
            header.contains("iii.session.id=s-1"),
            "other entries preserved"
        );
    }

    #[test]
    fn test_invocation_handler_multiple_invocations() {
        let handler = InvocationHandler::new();
        let id1 = Uuid::new_v4();
        let id2 = Uuid::new_v4();
        let (sender1, _rx1) = oneshot::channel();
        let (sender2, _rx2) = oneshot::channel();

        handler.invocations.insert(
            id1,
            Invocation {
                id: id1,
                function_id: "fn1".to_string(),
                worker_id: None,
                sender: sender1,
                traceparent: None,
                baggage: None,
            },
        );
        handler.invocations.insert(
            id2,
            Invocation {
                id: id2,
                function_id: "fn2".to_string(),
                worker_id: Some(Uuid::new_v4()),
                sender: sender2,
                traceparent: Some("00-trace-id".to_string()),
                baggage: Some("key=value".to_string()),
            },
        );

        assert_eq!(handler.invocations.len(), 2);

        let removed = handler.remove(&id1);
        assert!(removed.is_some());
        assert_eq!(handler.invocations.len(), 1);

        let removed = handler.remove(&id2);
        assert!(removed.is_some());
        assert!(handler.invocations.is_empty());
    }
}
