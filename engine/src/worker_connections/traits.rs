// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

use std::pin::Pin;

use futures::Future;
use serde_json::Value;
use tokio::sync::oneshot;
use tracing::Span;
use tracing_opentelemetry::OpenTelemetrySpanExt;
use uuid::Uuid;

use crate::{
    engine::Outbound,
    function::{FunctionHandler, FunctionResult},
    protocol::{ErrorBody, Message},
    telemetry::{inject_baggage_from_context, inject_traceparent_from_context},
    trigger::{RegistratorUnavailable, Trigger, TriggerRegistrator},
    worker_connections::WorkerConnection,
};

/// How long a function-path registration waits for the registrator worker's
/// `TriggerRegistrationResult` before failing open (legacy / stalled workers
/// are still covered by the late-unwind path in `router_msg`).
const REGISTRATION_ACK_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(10);

impl WorkerConnection {
    pub(crate) fn spawn_assignment(&self, work: impl Future<Output = ()> + Send + 'static) {
        self.spawn_assignment_inner(work, || {});
    }

    fn spawn_assignment_inner(
        &self,
        work: impl Future<Output = ()> + Send + 'static,
        before_insert: impl FnOnce(),
    ) -> Option<tokio::task::JoinHandle<()>> {
        if self
            .cleanup_claimed
            .load(std::sync::atomic::Ordering::SeqCst)
        {
            return None;
        }
        let id = Uuid::new_v4();
        let tasks = self.assignment_tasks.clone();
        let (ready, start) = oneshot::channel();
        struct Finished(
            std::sync::Arc<dashmap::DashMap<Uuid, tokio::task::AbortHandle>>,
            Uuid,
        );
        impl Drop for Finished {
            fn drop(&mut self) {
                self.0.remove(&self.1);
            }
        }
        // Own the guard in the future before its first poll. Aborting an
        // unpolled task must drop tracking just like a completed task does.
        let finished = Finished(tasks, id);
        let task = tokio::spawn(async move {
            let _finished = finished;
            if start.await.is_ok() {
                work.await;
            }
        });
        before_insert();
        self.assignment_tasks.insert(id, task.abort_handle());
        if self
            .cleanup_claimed
            .load(std::sync::atomic::Ordering::SeqCst)
        {
            // Cleanup may have cleared the map before our insertion. Do not
            // leave even a transient entry waiting for cancellation to poll.
            self.assignment_tasks.remove(&id);
            task.abort();
        }
        let _ = ready.send(());
        Some(task)
    }

    async fn assignment(&self, trigger: Trigger, token: String, stop: bool) -> anyhow::Result<()> {
        if self
            .cleanup_claimed
            .load(std::sync::atomic::Ordering::SeqCst)
        {
            return Err(anyhow::Error::new(RegistratorUnavailable));
        }
        let key = format!("{token}:{stop}");
        let (tx, rx) = oneshot::channel();
        self.pending_assignments.insert(
            key.clone(),
            (
                trigger.id.clone(),
                trigger.trigger_type.clone(),
                trigger.function_id.clone(),
                stop,
            ),
        );
        self.pending_trigger_acks.insert(key.clone(), tx);
        struct Pending<'a>(&'a WorkerConnection, String);
        impl Drop for Pending<'_> {
            fn drop(&mut self) {
                self.0.pending_trigger_acks.remove(&self.1);
                self.0.pending_assignments.remove(&self.1);
            }
        }
        let _pending = Pending(self, key);
        let message = if stop {
            Message::UnregisterTrigger {
                assignment_id: Some(token),
                id: trigger.id,
                trigger_type: Some(trigger.trigger_type),
            }
        } else {
            Message::RegisterTrigger {
                assignment_id: Some(token),
                id: trigger.id,
                trigger_type: trigger.trigger_type,
                function_id: trigger.function_id,
                config: trigger.config,
                metadata: trigger.metadata,
                namespace: (trigger.namespace != crate::protocol::DEFAULT_NAMESPACE)
                    .then_some(trigger.namespace),
                trigger_namespace: (trigger.provider_namespace
                    != crate::protocol::DEFAULT_NAMESPACE)
                    .then_some(trigger.provider_namespace),
            }
        };
        let mut disconnected = self.cleanup_done.subscribe();
        let operation = async {
            self.channel
                .send(Outbound::Protocol(message))
                .await
                .map_err(|_| anyhow::Error::new(RegistratorUnavailable))?;
            match rx.await {
                Ok(None) => Ok(()),
                Ok(Some(error)) => Err(anyhow::anyhow!("{error}")),
                Err(_) => Err(anyhow::Error::new(RegistratorUnavailable)),
            }
        };
        tokio::select! {
            result = tokio::time::timeout(REGISTRATION_ACK_TIMEOUT, operation) => result.unwrap_or_else(|_| Err(anyhow::Error::new(RegistratorUnavailable))),
            _ = disconnected.wait_for(|done| *done) => Err(anyhow::Error::new(RegistratorUnavailable)),
        }
    }

    pub(crate) fn assignment_ack(
        &self,
        id: &str,
        kind: &str,
        function: Option<&str>,
        token: &str,
        stop: bool,
        error: Option<ErrorBody>,
    ) {
        let key = format!("{token}:{stop}");
        let valid = self.pending_assignments.get(&key).is_some_and(|entry| {
            entry.0 == id
                && entry.1 == kind
                && function.is_none_or(|function| entry.2 == function)
                && entry.3 == stop
        });
        if valid
            && !self
                .cleanup_claimed
                .load(std::sync::atomic::Ordering::SeqCst)
        {
            if let Some((_, tx)) = self.pending_trigger_acks.remove(&key) {
                let _ = tx.send(error);
            }
        }
    }
}

impl TriggerRegistrator for WorkerConnection {
    fn register_assignment(
        &self,
        trigger: Trigger,
        token: String,
    ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
        Box::pin(self.assignment(trigger, token, false))
    }
    fn unregister_assignment(
        &self,
        trigger: Trigger,
        token: String,
    ) -> Pin<Box<dyn Future<Output = anyhow::Result<()>> + Send + '_>> {
        Box::pin(self.assignment(trigger, token, true))
    }
    fn register_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        let sender = self.channel.clone();
        let acks = self.pending_trigger_acks.clone();

        Box::pin(async move {
            // Ownerless registrations come from the `engine::register_trigger`
            // FUNCTION, whose invocation runs in a spawned task — awaiting the
            // worker's ack there is safe and makes validation failures
            // synchronous (no id-then-unwind). Connection-owned registrations
            // (`Message::RegisterTrigger`, a worker's own lifecycle bindings)
            // are processed INLINE in the origin connection's read loop; a
            // worker binding its own trigger type would deadlock on its ack,
            // so those keep fire-and-forget + late unwind.
            let await_ack = trigger.worker_id.is_none();
            let trigger_id = trigger.id.clone();
            let rx = if await_ack {
                let (tx, rx) = oneshot::channel();
                acks.insert(trigger_id.clone(), tx);
                Some(rx)
            } else {
                None
            };

            let sent = sender
                .send(Outbound::Protocol(Message::RegisterTrigger {
                    assignment_id: None,
                    id: trigger.id,
                    trigger_type: trigger.trigger_type,
                    function_id: trigger.function_id,
                    config: trigger.config,
                    metadata: trigger.metadata,
                    namespace: (trigger.namespace != crate::protocol::DEFAULT_NAMESPACE)
                        .then_some(trigger.namespace),
                    // Which of its namespaces this bind belongs to. The message
                    // only ever reaches the provider filed under this key, so
                    // it is a statement rather than a request — and it lets a
                    // provider serving more than one namespace tell them apart.
                    trigger_namespace: (trigger.provider_namespace
                        != crate::protocol::DEFAULT_NAMESPACE)
                        .then_some(trigger.provider_namespace),
                }))
                .await;
            if let Err(err) = sent {
                acks.remove(&trigger_id);
                return Err(anyhow::Error::new(RegistratorUnavailable).context(format!(
                    "failed to send register trigger message through worker channel: {err}"
                )));
            }

            let Some(rx) = rx else { return Ok(()) };
            match tokio::time::timeout(REGISTRATION_ACK_TIMEOUT, rx).await {
                Ok(Ok(None)) => Ok(()),
                Ok(Ok(Some(err))) => Err(anyhow::anyhow!("{}: {}", err.code, err.message)),
                // Ack channel dropped (connection teardown) — fail open; the
                // disconnect GC / late-unwind own the cleanup.
                Ok(Err(_)) => Ok(()),
                Err(_elapsed) => {
                    acks.remove(&trigger_id);
                    tracing::debug!(
                        trigger_id = %trigger_id,
                        "no TriggerRegistrationResult within timeout; accepting registration (late unwind still applies)"
                    );
                    Ok(())
                }
            }
        })
    }

    /// Fire-and-forget re-delivery. Replay/recovery runs inline on THIS
    /// worker's read loop (`router_msg` handling its `RegisterTriggerType`),
    /// so awaiting the ack like `register_trigger` does for ownerless
    /// triggers would stall the connection until the timeout — the ack can
    /// only be read once the loop is free again. Failures are still handled:
    /// the worker's `TriggerRegistrationResult` takes the late-unwind path in
    /// `router_msg`, which re-parks the trigger as a pending intent.
    fn replay_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        let sender = self.channel.clone();

        Box::pin(async move {
            sender
                .send(Outbound::Protocol(Message::RegisterTrigger {
                    assignment_id: None,
                    id: trigger.id,
                    trigger_type: trigger.trigger_type,
                    function_id: trigger.function_id,
                    config: trigger.config,
                    metadata: trigger.metadata,
                    namespace: (trigger.namespace != crate::protocol::DEFAULT_NAMESPACE)
                        .then_some(trigger.namespace),
                    // Which of its namespaces this bind belongs to. The message
                    // only ever reaches the provider filed under this key, so
                    // it is a statement rather than a request — and it lets a
                    // provider serving more than one namespace tell them apart.
                    trigger_namespace: (trigger.provider_namespace
                        != crate::protocol::DEFAULT_NAMESPACE)
                        .then_some(trigger.provider_namespace),
                }))
                .await
                .map_err(|err| {
                    anyhow::anyhow!(
                        "failed to send register trigger message through worker channel: {}",
                        err
                    )
                })?;

            Ok(())
        })
    }

    fn unregister_trigger(
        &self,
        trigger: Trigger,
    ) -> Pin<Box<dyn Future<Output = Result<(), anyhow::Error>> + Send + '_>> {
        let sender = self.channel.clone();

        Box::pin(async move {
            sender
                .send(Outbound::Protocol(Message::UnregisterTrigger {
                    assignment_id: None,
                    id: trigger.id,
                    trigger_type: Some(trigger.trigger_type),
                }))
                .await
                .map_err(|err| {
                    anyhow::anyhow!(
                        "failed to send unregister trigger message through worker channel: {}",
                        err
                    )
                })?;

            Ok(())
        })
    }
}

/// Internal proof that permit.send was never reached. Never inferred from a
/// public error code or a socket/writer failure after enqueue.
pub(crate) struct NotEnqueued(pub ErrorBody);

impl WorkerConnection {
    pub(crate) fn enqueue_function<'a>(
        &'a self,
        invocation_id: Option<Uuid>,
        function_id: String,
        input: Value,
        metadata: Option<Value>,
        pending: Option<&'a crate::invocation::InvocationHandler>,
    ) -> Pin<Box<dyn Future<Output = Result<(), NotEnqueued>> + Send + 'a>> {
        // Capture OTel context from current tracing span BEFORE async move
        // This ensures we get the trace context from the #[tracing::instrument] span.
        let current_span = Span::current();
        let span_cx = current_span.context();
        // Fall back to the ambient OTel context when the active tracing span
        // carries no valid span context — e.g. the engine intentionally
        // suppressed its per-invocation `call` span for this worker-routed call
        // (see `invocation/mod.rs`). Without this the worker invocation would
        // inject an empty traceparent and start a new, orphaned trace instead of
        // nesting under the caller. Every existing flow has a valid tracing
        // span here, so this is a no-op for them.
        let otel_context = if inject_traceparent_from_context(&span_cx).is_some() {
            span_cx
        } else {
            opentelemetry::Context::current()
        };

        Box::pin(async move {
            let traceparent = inject_traceparent_from_context(&otel_context);
            let baggage = inject_baggage_from_context(&otel_context);

            let function_id = if let Some(session) = &self.session {
                if let Some(prefix) = &session.function_registration_prefix {
                    let needle = format!("{prefix}::");
                    function_id
                        .strip_prefix(&needle)
                        .map(String::from)
                        .unwrap_or(function_id)
                } else {
                    function_id
                }
            } else {
                function_id
            };

            let stopped = || {
                Err(NotEnqueued(ErrorBody {
                    code: "invocation_stopped".into(),
                    message: "Invocation stopped".into(),
                    stacktrace: None,
                }))
            };
            if self
                .cleanup_claimed
                .load(std::sync::atomic::Ordering::SeqCst)
            {
                return stopped();
            }

            // Reserve before tracking so cancellation while waiting for capacity
            // cannot leave a worker-local ID behind.
            let mut cleanup_done = self.cleanup_done.subscribe();
            let permit = tokio::select! {
                biased;
                _ = cleanup_done.wait_for(|done| *done) => return stopped(),
                result = self.channel.reserve() => match result {
                    Ok(permit) => permit,
                    Err(err) => return Err(NotEnqueued(ErrorBody {
                        code: "channel_send_failed".into(),
                        message: err.to_string(),
                        stacktrace: None,
                    })),
                },
            };

            let mut invocations = self.invocations.write().await;
            // A reserved permit can outlive channel closure. Serialize registration
            // with cleanup's drain, and reject it once cleanup has started.
            if self
                .cleanup_claimed
                .load(std::sync::atomic::Ordering::SeqCst)
            {
                return stopped();
            }
            if self.channel.is_closed() {
                return Err(NotEnqueued(ErrorBody {
                    code: "channel_send_failed".into(),
                    message: "channel closed".into(),
                    stacktrace: None,
                }));
            }
            // Serialize the enqueue with terminal removal. This guard is
            // synchronous and is dropped before returning, never across await.
            let registration = match (pending, invocation_id) {
                (Some(pending), Some(id)) => match pending.pending(&id) {
                    Some(registration) => Some(registration),
                    None => return stopped(),
                },
                _ => None,
            };
            if let Some(id) = invocation_id {
                invocations.insert(id);
            }
            permit.send(Outbound::Protocol(Message::InvokeFunction {
                invocation_id,
                function_id,
                data: input,
                traceparent,
                baggage,
                action: None,
                metadata,
                namespace: None,
            }));
            drop(registration);
            Ok(())
        })
    }
}

impl FunctionHandler for WorkerConnection {
    fn handle_function<'a>(
        &'a self,
        invocation_id: Option<Uuid>,
        function_id: String,
        input: Value,
        metadata: Option<Value>,
    ) -> Pin<Box<dyn Future<Output = FunctionResult<Option<Value>, ErrorBody>> + Send + 'a>> {
        let enqueue = self.enqueue_function(invocation_id, function_id, input, metadata, None);
        Box::pin(async move {
            match enqueue.await {
                Ok(()) => FunctionResult::Deferred,
                Err(error) => FunctionResult::Failure(error.0),
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use tokio::sync::mpsc;

    fn make_worker() -> (WorkerConnection, mpsc::Receiver<Outbound>) {
        let (tx, rx) = mpsc::channel(16);
        (WorkerConnection::new(tx), rx)
    }

    #[tokio::test]
    async fn shared_trigger_ack_cleanup_racing_spawn_cancels_never_polled_task() {
        let (worker, _rx) = make_worker();
        let polls = std::sync::Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let observed = polls.clone();
        let task = worker
            .spawn_assignment_inner(
                async move {
                    observed.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
                },
                || {
                    // Current-thread runtime: spawn cannot poll before this synchronous
                    // cleanup ordering. Cleanup wins after admission but before insert.
                    worker
                        .cleanup_claimed
                        .store(true, std::sync::atomic::Ordering::SeqCst);
                    for task in worker.assignment_tasks.iter() {
                        task.abort();
                    }
                    worker.assignment_tasks.clear();
                },
            )
            .unwrap();
        assert!(task.await.unwrap_err().is_cancelled());
        assert_eq!(polls.load(std::sync::atomic::Ordering::SeqCst), 0);
        assert!(
            worker.assignment_tasks.is_empty(),
            "never-polled cancellation must remove tracking inserted after cleanup's clear"
        );
    }

    #[tokio::test]
    async fn shared_trigger_ack_task_tracking_covers_completion_and_cancellation_orderings() {
        let (worker, _rx) = make_worker();
        let polls = std::sync::Arc::new(std::sync::atomic::AtomicUsize::new(0));
        let observed = polls.clone();
        let never_polled = worker
            .spawn_assignment_inner(
                async move {
                    observed.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
                },
                || {},
            )
            .unwrap();
        assert_eq!(worker.assignment_tasks.len(), 1);
        never_polled.abort();
        assert!(never_polled.await.unwrap_err().is_cancelled());
        assert_eq!(polls.load(std::sync::atomic::Ordering::SeqCst), 0);
        assert!(worker.assignment_tasks.is_empty());

        let immediate = worker.spawn_assignment_inner(async {}, || {}).unwrap();
        immediate.await.unwrap();
        assert!(
            worker.assignment_tasks.is_empty(),
            "completion cannot precede tracking insertion"
        );

        let (started, ready) = oneshot::channel();
        let running = worker
            .spawn_assignment_inner(
                async move {
                    started.send(()).unwrap();
                    std::future::pending::<()>().await;
                },
                || {},
            )
            .unwrap();
        ready.await.unwrap();
        assert_eq!(worker.assignment_tasks.len(), 1);
        worker
            .cleanup_claimed
            .store(true, std::sync::atomic::Ordering::SeqCst);
        for task in worker.assignment_tasks.iter() {
            task.abort();
        }
        worker.assignment_tasks.clear();
        assert!(running.await.unwrap_err().is_cancelled());
        assert!(worker.assignment_tasks.is_empty());
        assert!(
            worker
                .spawn_assignment_inner(
                    async {
                        panic!("cleanup must reject admission");
                    },
                    || panic!("must not insert after admission rejection")
                )
                .is_none()
        );
    }

    fn trigger(id: &str, worker_id: Option<Uuid>) -> Trigger {
        Trigger {
            id: id.into(),
            trigger_type: "http".into(),
            function_id: "fn1".into(),
            config: json!({}),
            worker_id,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        }
    }

    /// Resolve the pending ack for `id` once the delivery message lands.
    async fn ack(
        worker: &WorkerConnection,
        rx: &mut mpsc::Receiver<Outbound>,
        id: &str,
        error: Option<ErrorBody>,
    ) {
        let msg = rx.recv().await.expect("RegisterTrigger delivered");
        assert!(matches!(
            msg,
            Outbound::Protocol(Message::RegisterTrigger { .. })
        ));
        let (_, tx) = worker
            .pending_trigger_acks
            .remove(id)
            .expect("pending ack entry");
        tx.send(error).unwrap();
    }

    // KAN-319: drive the production registry/router, not a proposed assignment API.
    async fn shared_provider() -> (
        std::sync::Arc<crate::engine::Engine>,
        WorkerConnection,
        mpsc::Receiver<Outbound>,
    ) {
        crate::workers::observability::metrics::ensure_default_meter();
        let engine = std::sync::Arc::new(crate::engine::Engine::new());
        engine.set_shared_namespace_ownership(true);
        let (worker, rx) = make_worker();
        engine.worker_registry.register_worker(worker.clone());
        engine.begin_namespace_resolution(&worker);
        engine.resolve_connection_namespace(&worker, "orders").await;
        let declaration: Message = serde_json::from_value(json!({
            "type": "registertriggertype", "id": "http", "description": "assignment fixture",
            "delivery_mode": "parallel", "delivery_contract": "shared_v1"
        }))
        .unwrap();
        engine.router_msg(&worker, &declaration).await.unwrap();
        (engine, worker, rx)
    }

    fn shared_binding(id: &str, owner: Option<Uuid>) -> Trigger {
        let mut binding = trigger(id, owner);
        binding.home_namespace = "orders".into();
        binding.namespace = "orders".into();
        binding
    }

    async fn delivery(rx: &mut mpsc::Receiver<Outbound>) -> Value {
        let Outbound::Protocol(message) = rx.recv().await.expect("assignment enqueued") else {
            panic!("expected protocol assignment");
        };
        serde_json::to_value(message).unwrap()
    }

    async fn registration_ack(
        engine: &crate::engine::Engine,
        worker: &WorkerConnection,
        frame: &Value,
        assignment: Value,
        error: Value,
    ) {
        let message: Message = serde_json::from_value(json!({
            "type": "triggerregistrationresult", "id": frame["id"],
            "trigger_type": frame["trigger_type"], "function_id": frame["function_id"],
            "assignment_id": assignment, "error": error
        }))
        .unwrap();
        engine.router_msg(worker, &message).await.unwrap();
    }

    #[tokio::test]
    async fn shared_trigger_ack_legacy_helper_still_accepts_positive_ack() {
        // Existing helper remains the disabled-path control, not an assignment bypass.
        let (worker, mut rx) = make_worker();
        let (result, ()) = tokio::join!(
            worker.register_trigger(trigger("legacy-control", None)),
            ack(&worker, &mut rx, "legacy-control", None),
        );
        result.unwrap();
        assert!(worker.pending_trigger_acks.is_empty());
    }

    #[test]
    fn shared_trigger_ack_assignment_wire_roundtrips() {
        for input in [
            json!({"type":"registertrigger", "id":"route", "trigger_type":"http", "function_id":"fn1", "config":{}, "assignment_id":"generation-1"}),
            json!({"type":"unregistertrigger", "id":"route", "trigger_type":"http", "assignment_id":"generation-1"}),
            json!({"type":"triggerregistrationresult", "id":"route", "trigger_type":"http", "function_id":"fn1", "assignment_id":"generation-1"}),
        ] {
            let message: Message = serde_json::from_value(input).unwrap();
            assert_eq!(
                serde_json::to_value(message).unwrap()["assignment_id"],
                "generation-1",
                "assignment identity must survive the shared_v1 wire"
            );
        }
    }

    #[test]
    fn shared_trigger_ack_stop_result_is_additive() {
        let input = json!({"type":"unregistertriggerresult", "id":"route", "trigger_type":"http", "assignment_id":"generation-1"});
        let decoded = serde_json::from_value::<Message>(input.clone());
        assert!(
            decoded.is_ok(),
            "shared_v1 requires positive stop acknowledgement: {decoded:?}"
        );
        assert_eq!(serde_json::to_value(decoded.unwrap()).unwrap(), input);
    }

    #[tokio::test(start_paused = true)]
    async fn shared_trigger_ack_timeout_is_not_installation() {
        let (engine, worker, mut rx) = shared_provider().await;
        let task = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .register_trigger(shared_binding("timeout", None))
                    .await
            }
        });
        let frame = delivery(&mut rx).await;
        assert!(
            !task.is_finished(),
            "queue enqueue is not installation acknowledgement"
        );
        tokio::time::advance(REGISTRATION_ACK_TIMEOUT + std::time::Duration::from_millis(1)).await;
        let outcome = task.await.unwrap();
        assert!(
            !matches!(
                outcome,
                Ok(crate::trigger::RegisterTriggerOutcome::Registered)
            ),
            "shared_v1 timeout must fail or remain pending, never accept installation: {outcome:?}"
        );
        assert!(
            !engine
                .trigger_registry
                .triggers
                .contains_key(frame["id"].as_str().unwrap())
        );
        assert!(worker.pending_trigger_acks.is_empty());
    }

    #[tokio::test]
    async fn shared_trigger_ack_owned_queue_waits_for_positive_installation() {
        let (engine, worker, mut rx) = shared_provider().await;
        let task = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .register_trigger(shared_binding("owned", Some(Uuid::new_v4())))
                    .await
            }
        });
        let frame = delivery(&mut rx).await;
        assert!(
            !task.is_finished(),
            "connection-owned shared_v1 enqueue must not report installed"
        );
        assert!(
            frame["assignment_id"].is_string(),
            "shared_v1 install requires an opaque assignment_id: {frame}"
        );
        registration_ack(
            &engine,
            &worker,
            &frame,
            frame["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        assert_eq!(
            task.await.unwrap().unwrap(),
            crate::trigger::RegisterTriggerOutcome::Registered
        );
        assert!(worker.pending_trigger_acks.is_empty());
    }

    #[tokio::test]
    async fn shared_trigger_ack_stale_generation_cannot_complete_pending_install() {
        let (engine, worker, mut rx) = shared_provider().await;
        let task = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .register_trigger(shared_binding("generation", None))
                    .await
            }
        });
        let frame = delivery(&mut rx).await;
        registration_ack(
            &engine,
            &worker,
            &frame,
            json!("retired-generation"),
            Value::Null,
        )
        .await;
        tokio::task::yield_now().await;
        assert!(
            !task.is_finished(),
            "an id-only match must not accept a stale assignment generation"
        );
        assert!(
            frame["assignment_id"].is_string(),
            "assignment identity missing: {frame}"
        );
        registration_ack(
            &engine,
            &worker,
            &frame,
            frame["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        assert_eq!(
            task.await.unwrap().unwrap(),
            crate::trigger::RegisterTriggerOutcome::Registered
        );
    }

    #[tokio::test]
    async fn shared_trigger_ack_foreign_session_cannot_complete_pending_install() {
        let (engine, worker, mut rx) = shared_provider().await;
        let (foreign, _foreign_rx) = make_worker();
        engine.worker_registry.register_worker(foreign.clone());
        let task = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .register_trigger(shared_binding("session", None))
                    .await
            }
        });
        let frame = delivery(&mut rx).await;
        registration_ack(
            &engine,
            &foreign,
            &frame,
            frame["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        tokio::task::yield_now().await;
        assert!(
            !task.is_finished(),
            "foreign session cannot install another provider's assignment"
        );
        assert!(
            frame["assignment_id"].is_string(),
            "session fencing needs assignment identity: {frame}"
        );
        registration_ack(
            &engine,
            &worker,
            &frame,
            frame["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        task.await.unwrap().unwrap();
    }

    #[tokio::test]
    async fn shared_trigger_ack_disconnect_does_not_fail_open() {
        let (engine, worker, mut rx) = shared_provider().await;
        let task = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .register_trigger(shared_binding("disconnect", None))
                    .await
            }
        });
        let frame = delivery(&mut rx).await;
        // Isolate transport loss first. Concurrent registry removal can block
        // this current-thread executor on a DashMap write while registration
        // holds its read guard across the pending ack. That is not the ack
        // behavior under test and would prevent even a timeout from firing.
        worker.pending_trigger_acks.clear();
        let outcome = tokio::time::timeout(std::time::Duration::from_secs(2), task)
            .await
            .expect("dropped ack channel must resolve installation without fail-open")
            .unwrap();
        engine.trigger_registry.unregister_worker(&worker.id).await;
        assert!(
            !matches!(
                outcome,
                Ok(crate::trigger::RegisterTriggerOutcome::Registered)
            ),
            "disconnect before ack is not successful installation: {outcome:?}"
        );
        assert!(
            !engine
                .trigger_registry
                .triggers
                .contains_key(frame["id"].as_str().unwrap())
        );
    }

    #[tokio::test]
    async fn shared_trigger_ack_removed_intent_rejects_late_installation_ack() {
        let (engine, worker, mut rx) = shared_provider().await;
        let registration = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .register_trigger(shared_binding("removed", None))
                    .await
            }
        });
        let install = delivery(&mut rx).await;
        registration_ack(
            &engine,
            &worker,
            &install,
            install["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        registration.await.unwrap().unwrap();
        let removal = tokio::spawn({
            let engine = engine.clone();
            async move {
                engine
                    .trigger_registry
                    .unregister_trigger("removed".into(), None)
                    .await
            }
        });
        let stop = delivery(&mut rx).await;
        assert_eq!(stop["type"], "unregistertrigger");
        assert!(
            stop["assignment_id"].is_string(),
            "removal must revoke an identified assignment before forgetting intent: {stop}"
        );
        assert_eq!(stop["assignment_id"], install["assignment_id"]);
        assert!(
            !removal.is_finished(),
            "enqueued stop is not positive teardown acknowledgement"
        );
        registration_ack(
            &engine,
            &worker,
            &install,
            install["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        assert!(
            !removal.is_finished(),
            "late installation ack cannot satisfy pending stop"
        );
        let stopped: Message = serde_json::from_value(json!({
            "type":"unregistertriggerresult", "id":stop["id"],
            "trigger_type":stop["trigger_type"], "assignment_id":stop["assignment_id"]
        }))
        .unwrap();
        engine.router_msg(&worker, &stopped).await.unwrap();
        assert!(removal.await.unwrap().unwrap());
        registration_ack(
            &engine,
            &worker,
            &install,
            install["assignment_id"].clone(),
            Value::Null,
        )
        .await;
        assert!(!engine.trigger_registry.triggers.contains_key("removed"));
        assert!(
            !engine
                .trigger_registry
                .pending_triggers
                .contains_key("removed")
        );
        assert!(worker.pending_trigger_acks.is_empty());
    }

    #[tokio::test]
    async fn register_trigger_sends_message_and_accepts_on_ok_ack() {
        let (worker, mut rx) = make_worker();
        let (res, ()) = tokio::join!(
            worker.register_trigger(trigger("t1", None)),
            ack(&worker, &mut rx, "t1", None),
        );
        res.unwrap();
        assert!(worker.pending_trigger_acks.is_empty());
    }

    #[tokio::test]
    async fn ownerless_registration_rejects_synchronously_on_error_ack() {
        let (worker, mut rx) = make_worker();
        let (res, ()) = tokio::join!(
            worker.register_trigger(trigger("t_bad", None)),
            ack(
                &worker,
                &mut rx,
                "t_bad",
                Some(ErrorBody::new(
                    "trigger_registration_failed",
                    "unknown model"
                )),
            ),
        );
        let err = res.unwrap_err().to_string();
        assert!(err.contains("unknown model"), "got: {err}");
        assert!(worker.pending_trigger_acks.is_empty());
    }

    #[tokio::test]
    async fn connection_owned_registration_stays_fire_and_forget() {
        let (worker, mut rx) = make_worker();
        // A worker's own lifecycle binding: returns as soon as the delivery is
        // queued, never waits on (or creates) a pending ack.
        worker
            .register_trigger(trigger("t_owned", Some(Uuid::new_v4())))
            .await
            .unwrap();
        assert!(worker.pending_trigger_acks.is_empty());
        let msg = rx.recv().await.unwrap();
        assert!(matches!(
            msg,
            Outbound::Protocol(Message::RegisterTrigger { .. })
        ));
    }

    #[tokio::test]
    async fn replay_trigger_is_fire_and_forget_even_for_ownerless_triggers() {
        let (worker, mut rx) = make_worker();
        // Replay runs inline on this worker's read loop, so it must return as
        // soon as the delivery is queued — no pending ack, no timeout — even
        // for ownerless (durable) triggers that DO await an ack on the
        // register_trigger path.
        worker
            .replay_trigger(trigger("t_replayed", None))
            .await
            .unwrap();
        assert!(worker.pending_trigger_acks.is_empty());
        let msg = rx.recv().await.unwrap();
        assert!(matches!(
            msg,
            Outbound::Protocol(Message::RegisterTrigger { .. })
        ));
    }

    #[tokio::test]
    async fn unregister_trigger_sends_message() {
        let (worker, mut rx) = make_worker();
        let trigger = Trigger {
            id: "t2".into(),
            trigger_type: "cron".into(),
            function_id: "fn2".into(),
            config: json!({}),
            worker_id: None,
            metadata: None,
            namespace: "default".to_string(),
            trigger_namespace: None,
            home_namespace: crate::protocol::default_namespace(),
            provider_namespace: crate::protocol::default_namespace(),
        };
        worker.unregister_trigger(trigger).await.unwrap();
        let msg = rx.recv().await.unwrap();
        match msg {
            Outbound::Protocol(Message::UnregisterTrigger {
                id, trigger_type, ..
            }) => {
                assert_eq!(id, "t2");
                assert_eq!(trigger_type, Some("cron".into()));
            }
            _ => panic!("Expected UnregisterTrigger message"),
        }
    }

    #[tokio::test]
    async fn handle_function_returns_deferred() {
        let (worker, mut rx) = make_worker();
        let inv_id = Uuid::new_v4();
        let result = worker
            .handle_function(
                Some(inv_id),
                "fn1".into(),
                json!({"key": "val"}),
                Some(json!({"session_id": "s_1"})),
            )
            .await;
        assert!(matches!(result, FunctionResult::Deferred));

        let msg = rx.recv().await.unwrap();
        match msg {
            Outbound::Protocol(Message::InvokeFunction {
                invocation_id,
                function_id,
                data,
                metadata,
                ..
            }) => {
                assert_eq!(invocation_id, Some(inv_id));
                assert_eq!(function_id, "fn1");
                assert_eq!(data, json!({"key": "val"}));
                // Metadata rides as a distinct field on the wire message, not
                // folded into `data`.
                assert_eq!(metadata, Some(json!({"session_id": "s_1"})));
            }
            _ => panic!("Expected InvokeFunction message"),
        }

        // Verify invocation was tracked
        assert!(worker.invocations.read().await.contains(&inv_id));
    }
}
