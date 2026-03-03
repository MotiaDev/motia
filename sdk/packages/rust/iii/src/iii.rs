use std::{
    collections::{HashMap, HashSet},
    sync::{
        Arc, Mutex, MutexGuard,
        atomic::{AtomicBool, AtomicUsize, Ordering},
    },
    time::Duration,
};

/// Extension trait for Mutex that recovers from poisoning instead of panicking.
/// This is safe when the protected data is still valid after a panic in another thread.
trait MutexExt<T> {
    fn lock_or_recover(&self) -> MutexGuard<'_, T>;
}

impl<T> MutexExt<T> for Mutex<T> {
    fn lock_or_recover(&self) -> MutexGuard<'_, T> {
        self.lock().unwrap_or_else(|e| e.into_inner())
    }
}

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::{
    sync::{mpsc, oneshot},
    time::sleep,
};
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};
use uuid::Uuid;

const SDK_VERSION: &str = env!("CARGO_PKG_VERSION");

use crate::{
    channels::{ChannelReader, ChannelWriter, StreamChannelRef},
    context::{Context, with_context},
    error::IIIError,
    logger::Logger,
    protocol::{
        ErrorBody, HttpInvocationConfig, Message, RegisterFunctionMessage, RegisterServiceMessage,
        RegisterTriggerMessage, RegisterTriggerTypeMessage, UnregisterTriggerMessage,
        UnregisterTriggerTypeMessage,
    },
    triggers::{Trigger, TriggerConfig, TriggerHandler},
    types::{Channel, RemoteFunctionData, RemoteFunctionHandler, RemoteTriggerTypeData},
};

#[cfg(feature = "otel")]
use crate::telemetry;
#[cfg(feature = "otel")]
use crate::telemetry::types::OtelConfig;

const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// Worker information returned by `engine::workers::list`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerInfo {
    pub id: String,
    pub name: Option<String>,
    pub runtime: Option<String>,
    pub version: Option<String>,
    pub os: Option<String>,
    pub ip_address: Option<String>,
    pub status: String,
    pub connected_at_ms: u64,
    pub function_count: usize,
    pub functions: Vec<String>,
    pub active_invocations: usize,
}

/// Function information returned by `engine::functions::list`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionInfo {
    pub function_id: String,
    pub description: Option<String>,
    pub request_format: Option<Value>,
    pub response_format: Option<Value>,
    pub metadata: Option<Value>,
}

/// Trigger information returned by `engine::triggers::list`
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerInfo {
    pub id: String,
    pub trigger_type: String,
    pub function_id: String,
    pub config: Value,
}

/// Telemetry metadata provided by the SDK to the engine.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkerTelemetryMeta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub framework: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amplitude_api_key: Option<String>,
}

/// Worker metadata for auto-registration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerMetadata {
    pub runtime: String,
    pub version: String,
    pub name: String,
    pub os: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub telemetry: Option<WorkerTelemetryMeta>,
}

impl Default for WorkerMetadata {
    fn default() -> Self {
        let hostname = hostname::get()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_else(|_| "unknown".to_string());
        let pid = std::process::id();
        let os_info = format!(
            "{} {} ({})",
            std::env::consts::OS,
            std::env::consts::ARCH,
            std::env::consts::FAMILY
        );

        let language = std::env::var("LANG")
            .or_else(|_| std::env::var("LC_ALL"))
            .ok()
            .filter(|s| !s.is_empty())
            .map(|s| s.split('.').next().unwrap_or(&s).to_string());

        Self {
            runtime: "rust".to_string(),
            version: SDK_VERSION.to_string(),
            name: format!("{}:{}", hostname, pid),
            os: os_info,
            telemetry: Some(WorkerTelemetryMeta {
                language,
                ..Default::default()
            }),
        }
    }
}

#[allow(clippy::large_enum_variant)]
enum Outbound {
    Message(Message),
    Shutdown,
}

type PendingInvocation = oneshot::Sender<Result<Value, IIIError>>;

// WebSocket transmitter type alias
type WsTx = futures_util::stream::SplitSink<
    tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>,
    WsMessage,
>;

/// Inject trace context headers for outbound messages.
/// Returns (traceparent, baggage) - both None when otel feature is disabled.
#[cfg(feature = "otel")]
fn inject_trace_headers() -> (Option<String>, Option<String>) {
    use crate::telemetry::context;
    (context::inject_traceparent(), context::inject_baggage())
}

#[cfg(not(feature = "otel"))]
fn inject_trace_headers() -> (Option<String>, Option<String>) {
    (None, None)
}

/// Callback function type for functions available events
pub type FunctionsAvailableCallback = Arc<dyn Fn(Vec<FunctionInfo>) + Send + Sync>;

#[derive(Clone)]
pub struct HttpFunctionRef {
    pub id: String,
    unregister_fn: Arc<dyn Fn() + Send + Sync>,
}

impl HttpFunctionRef {
    pub fn unregister(&self) {
        (self.unregister_fn)();
    }
}

struct IIIInner {
    address: String,
    outbound: mpsc::UnboundedSender<Outbound>,
    receiver: Mutex<Option<mpsc::UnboundedReceiver<Outbound>>>,
    running: AtomicBool,
    started: AtomicBool,
    pending: Mutex<HashMap<Uuid, PendingInvocation>>,
    functions: Mutex<HashMap<String, RemoteFunctionData>>,
    http_functions: Mutex<HashMap<String, RegisterFunctionMessage>>,
    trigger_types: Mutex<HashMap<String, RemoteTriggerTypeData>>,
    triggers: Mutex<HashMap<String, RegisterTriggerMessage>>,
    services: Mutex<HashMap<String, RegisterServiceMessage>>,
    worker_metadata: Mutex<Option<WorkerMetadata>>,
    functions_available_callbacks: Mutex<HashMap<usize, FunctionsAvailableCallback>>,
    functions_available_callback_counter: AtomicUsize,
    functions_available_function_id: Mutex<Option<String>>,
    functions_available_trigger: Mutex<Option<Trigger>>,
    #[cfg(feature = "otel")]
    otel_config: Mutex<Option<OtelConfig>>,
}

#[derive(Clone)]
pub struct III {
    inner: Arc<IIIInner>,
}

/// Guard that unsubscribes from functions available events when dropped
pub struct FunctionsAvailableGuard {
    iii: III,
    callback_id: usize,
}

impl Drop for FunctionsAvailableGuard {
    fn drop(&mut self) {
        let mut callbacks = self
            .iii
            .inner
            .functions_available_callbacks
            .lock_or_recover();
        callbacks.remove(&self.callback_id);

        if callbacks.is_empty() {
            let mut trigger = self.iii.inner.functions_available_trigger.lock_or_recover();
            if let Some(trigger) = trigger.take() {
                trigger.unregister();
            }
        }
    }
}

impl III {
    /// Create a new III with default worker metadata (auto-detected runtime, os, hostname)
    pub fn new(address: &str) -> Self {
        Self::with_metadata(address, WorkerMetadata::default())
    }

    /// Create a new III with custom worker metadata
    pub fn with_metadata(address: &str, metadata: WorkerMetadata) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let inner = IIIInner {
            address: address.into(),
            outbound: tx,
            receiver: Mutex::new(Some(rx)),
            running: AtomicBool::new(false),
            started: AtomicBool::new(false),
            pending: Mutex::new(HashMap::new()),
            functions: Mutex::new(HashMap::new()),
            http_functions: Mutex::new(HashMap::new()),
            trigger_types: Mutex::new(HashMap::new()),
            triggers: Mutex::new(HashMap::new()),
            services: Mutex::new(HashMap::new()),
            worker_metadata: Mutex::new(Some(metadata)),
            functions_available_callbacks: Mutex::new(HashMap::new()),
            functions_available_callback_counter: AtomicUsize::new(0),
            functions_available_function_id: Mutex::new(None),
            functions_available_trigger: Mutex::new(None),
            #[cfg(feature = "otel")]
            otel_config: Mutex::new(None),
        };
        Self {
            inner: Arc::new(inner),
        }
    }

    /// Get the engine WebSocket address this client connects to.
    pub fn address(&self) -> &str {
        &self.inner.address
    }

    /// Set custom worker metadata (call before connect)
    pub fn set_metadata(&self, metadata: WorkerMetadata) {
        *self.inner.worker_metadata.lock_or_recover() = Some(metadata);
    }

    /// Set OpenTelemetry configuration (call before connect)
    #[cfg(feature = "otel")]
    pub fn set_otel_config(&self, config: OtelConfig) {
        *self.inner.otel_config.lock_or_recover() = Some(config);
    }

    pub async fn connect(&self) -> Result<(), IIIError> {
        if self.inner.started.swap(true, Ordering::SeqCst) {
            return Ok(());
        }

        let receiver = self.inner.receiver.lock_or_recover().take();
        let Some(rx) = receiver else {
            return Ok(());
        };

        let iii = self.clone();

        tokio::spawn(async move {
            iii.inner.running.store(true, Ordering::SeqCst);
            iii.run_connection(rx).await;
        });

        // Initialize OpenTelemetry if configured.
        // NOTE: This runs after the connection spawn, so the first few function
        // invocations may not carry tracing context. The global tracer returns a
        // no-op until initialization completes, so no panics occur — traces
        // simply won't appear for those early calls.
        #[cfg(feature = "otel")]
        {
            let config = self.inner.otel_config.lock_or_recover().take();
            if let Some(mut config) = config {
                // Default engine_ws_url to the III address if not set
                if config.engine_ws_url.is_none() {
                    config.engine_ws_url = Some(self.inner.address.clone());
                }
                telemetry::init_otel(config).await;
            }
        }

        Ok(())
    }

    /// Shutdown the III client.
    ///
    /// This stops the connection loop and sends a shutdown signal.
    /// If the `otel` feature is enabled, this will spawn a background task
    /// to flush telemetry data, but does NOT wait for it to complete.
    /// For guaranteed telemetry flush, use `shutdown_async()` instead.
    #[deprecated(note = "Use shutdown_async() for guaranteed telemetry flush")]
    pub fn shutdown(&self) {
        self.inner.running.store(false, Ordering::SeqCst);
        let _ = self.inner.outbound.send(Outbound::Shutdown);

        // Shutdown OpenTelemetry (best-effort, does not wait for flush)
        #[cfg(feature = "otel")]
        {
            tracing::warn!(
                "shutdown() does not await telemetry flush; use shutdown_async() instead"
            );
            tokio::spawn(async {
                telemetry::shutdown_otel().await;
            });
        }
    }

    /// Shutdown the III client and flush all pending telemetry data.
    ///
    /// This method stops the connection loop and sends a shutdown signal.
    /// When the `otel` feature is enabled, it additionally awaits the
    /// OpenTelemetry flush, ensuring all spans, metrics, and logs are
    /// exported before returning.
    pub async fn shutdown_async(&self) {
        self.inner.running.store(false, Ordering::SeqCst);
        let _ = self.inner.outbound.send(Outbound::Shutdown);

        #[cfg(feature = "otel")]
        telemetry::shutdown_otel().await;
    }

    pub fn register_function<F, Fut>(&self, id: impl Into<String>, handler: F)
    where
        F: Fn(Value) -> Fut + Send + Sync + 'static,
        Fut: std::future::Future<Output = Result<Value, IIIError>> + Send + 'static,
    {
        let message = RegisterFunctionMessage {
            id: id.into(),
            description: None,
            request_format: None,
            response_format: None,
            metadata: None,
            invocation: None,
        };

        self.register_function_with(message, handler);
    }

    pub fn register_function_with_description<F, Fut>(
        &self,
        id: impl Into<String>,
        description: impl Into<String>,
        handler: F,
    ) where
        F: Fn(Value) -> Fut + Send + Sync + 'static,
        Fut: std::future::Future<Output = Result<Value, IIIError>> + Send + 'static,
    {
        let message = RegisterFunctionMessage {
            id: id.into(),
            description: Some(description.into()),
            request_format: None,
            response_format: None,
            metadata: None,
            invocation: None,
        };

        self.register_function_with(message, handler);
    }

    pub fn register_function_with<F, Fut>(&self, message: RegisterFunctionMessage, handler: F)
    where
        F: Fn(Value) -> Fut + Send + Sync + 'static,
        Fut: std::future::Future<Output = Result<Value, IIIError>> + Send + 'static,
    {
        if self
            .inner
            .http_functions
            .lock_or_recover()
            .contains_key(&message.id)
        {
            panic!(
                "function id '{}' already registered as HTTP function",
                message.id
            );
        }
        let function_id = message.id.clone();

        let user_handler = Arc::new(move |input: Value| Box::pin(handler(input)));

        let wrapped_handler: RemoteFunctionHandler = Arc::new(move |input: Value| {
            let function_id = function_id.clone();
            let user_handler = user_handler.clone();

            Box::pin(async move {
                let logger = Logger::new(Some(function_id.clone()));
                let context = Context { logger, span: None };

                with_context(context, || user_handler(input)).await
            })
        });

        let data = RemoteFunctionData {
            message: message.clone(),
            handler: wrapped_handler,
        };

        self.inner
            .functions
            .lock_or_recover()
            .insert(message.id.clone(), data);
        let _ = self.send_message(message.to_message());
    }

    pub fn register_http_function(
        &self,
        id: impl Into<String>,
        config: HttpInvocationConfig,
    ) -> Result<HttpFunctionRef, IIIError> {
        let id = id.into();
        if id.trim().is_empty() {
            return Err(IIIError::Remote {
                code: "invalid_id".into(),
                message: "id is required".into(),
            });
        }
        if self.inner.functions.lock_or_recover().contains_key(&id)
            || self
                .inner
                .http_functions
                .lock_or_recover()
                .contains_key(&id)
        {
            return Err(IIIError::Remote {
                code: "duplicate_id".into(),
                message: "function id already registered".into(),
            });
        }

        let message = RegisterFunctionMessage {
            id: id.clone(),
            description: None,
            request_format: None,
            response_format: None,
            metadata: None,
            invocation: Some(config),
        };

        self.inner
            .http_functions
            .lock_or_recover()
            .insert(id.clone(), message.clone());
        let _ = self.send_message(message.to_message());

        let iii = self.clone();
        let unregister_id = id.clone();
        let unregister_fn = Arc::new(move || {
            let _ = iii
                .inner
                .http_functions
                .lock_or_recover()
                .remove(&unregister_id);
            let _ = iii.send_message(Message::UnregisterFunction {
                id: unregister_id.clone(),
            });
        });

        Ok(HttpFunctionRef { id, unregister_fn })
    }

    pub fn register_service(&self, id: impl Into<String>, description: Option<String>) {
        let id = id.into();
        let message = RegisterServiceMessage {
            id: id.clone(),
            name: id,
            description,
        };

        self.inner
            .services
            .lock_or_recover()
            .insert(message.id.clone(), message.clone());
        let _ = self.send_message(message.to_message());
    }

    pub fn register_service_with_name(
        &self,
        id: impl Into<String>,
        name: impl Into<String>,
        description: Option<String>,
    ) {
        let message = RegisterServiceMessage {
            id: id.into(),
            name: name.into(),
            description,
        };

        self.inner
            .services
            .lock_or_recover()
            .insert(message.id.clone(), message.clone());
        let _ = self.send_message(message.to_message());
    }

    pub fn register_trigger_type<H>(
        &self,
        id: impl Into<String>,
        description: impl Into<String>,
        handler: H,
    ) where
        H: TriggerHandler + 'static,
    {
        let message = RegisterTriggerTypeMessage {
            id: id.into(),
            description: description.into(),
        };

        self.inner.trigger_types.lock_or_recover().insert(
            message.id.clone(),
            RemoteTriggerTypeData {
                message: message.clone(),
                handler: Arc::new(handler),
            },
        );

        let _ = self.send_message(message.to_message());
    }

    pub fn unregister_trigger_type(&self, id: impl Into<String>) {
        let id = id.into();
        self.inner.trigger_types.lock_or_recover().remove(&id);
        let msg = UnregisterTriggerTypeMessage { id };
        let _ = self.send_message(msg.to_message());
    }

    pub fn register_trigger(
        &self,
        trigger_type: impl Into<String>,
        function_id: impl Into<String>,
        config: impl serde::Serialize,
    ) -> Result<Trigger, IIIError> {
        let id = Uuid::new_v4().to_string();
        let config = serde_json::to_value(config)?;
        let message = RegisterTriggerMessage {
            id: id.clone(),
            trigger_type: trigger_type.into(),
            function_id: function_id.into(),
            config,
        };

        self.inner
            .triggers
            .lock_or_recover()
            .insert(message.id.clone(), message.clone());
        let _ = self.send_message(message.to_message());

        let iii = self.clone();
        let trigger_type = message.trigger_type.clone();
        let unregister_id = message.id.clone();
        let unregister_fn = Arc::new(move || {
            let _ = iii.inner.triggers.lock_or_recover().remove(&unregister_id);
            let msg = UnregisterTriggerMessage {
                id: unregister_id.clone(),
                trigger_type: trigger_type.clone(),
            };
            let _ = iii.send_message(msg.to_message());
        });

        Ok(Trigger::new(unregister_fn))
    }

    pub async fn trigger(
        &self,
        function_id: &str,
        data: impl serde::Serialize,
    ) -> Result<Value, IIIError> {
        let value = serde_json::to_value(data)?;
        self.trigger_with_timeout(function_id, value, DEFAULT_TIMEOUT)
            .await
    }

    pub async fn trigger_with_timeout(
        &self,
        function_id: &str,
        data: Value,
        timeout: Duration,
    ) -> Result<Value, IIIError> {
        let invocation_id = Uuid::new_v4();
        let (tx, rx) = oneshot::channel();

        self.inner
            .pending
            .lock_or_recover()
            .insert(invocation_id, tx);

        let (tp, bg) = inject_trace_headers();

        self.send_message(Message::InvokeFunction {
            invocation_id: Some(invocation_id),
            function_id: function_id.to_string(),
            data,
            traceparent: tp,
            baggage: bg,
        })?;

        match tokio::time::timeout(timeout, rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err(IIIError::NotConnected),
            Err(_) => {
                self.inner.pending.lock_or_recover().remove(&invocation_id);
                Err(IIIError::Timeout)
            }
        }
    }

    pub fn trigger_void<TInput>(&self, function_id: &str, data: TInput) -> Result<(), IIIError>
    where
        TInput: Serialize,
    {
        let value = serde_json::to_value(data)?;

        let (tp, bg) = inject_trace_headers();

        self.send_message(Message::InvokeFunction {
            invocation_id: None,
            function_id: function_id.to_string(),
            data: value,
            traceparent: tp,
            baggage: bg,
        })
    }

    pub async fn call(
        &self,
        function_id: &str,
        data: impl serde::Serialize,
    ) -> Result<Value, IIIError> {
        self.trigger(function_id, data).await
    }

    pub fn call_void<TInput>(&self, function_id: &str, data: TInput) -> Result<(), IIIError>
    where
        TInput: Serialize,
    {
        self.trigger_void(function_id, data)
    }

    pub async fn call_with_timeout(
        &self,
        function_id: &str,
        data: Value,
        timeout: Duration,
    ) -> Result<Value, IIIError> {
        self.trigger_with_timeout(function_id, data, timeout).await
    }

    /// List all registered functions from the engine
    pub async fn list_functions(&self) -> Result<Vec<FunctionInfo>, IIIError> {
        let result = self
            .trigger("engine::functions::list", serde_json::json!({}))
            .await?;

        let functions = result
            .get("functions")
            .and_then(|v| serde_json::from_value::<Vec<FunctionInfo>>(v.clone()).ok())
            .unwrap_or_default();

        Ok(functions)
    }

    /// Subscribe to function availability events
    /// Returns a guard that will unsubscribe when dropped
    pub fn on_functions_available<F>(&self, callback: F) -> FunctionsAvailableGuard
    where
        F: Fn(Vec<FunctionInfo>) + Send + Sync + 'static,
    {
        let callback = Arc::new(callback);
        let callback_id = self
            .inner
            .functions_available_callback_counter
            .fetch_add(1, Ordering::Relaxed);

        self.inner
            .functions_available_callbacks
            .lock_or_recover()
            .insert(callback_id, callback);

        // Set up trigger if not already done
        let mut trigger_guard = self.inner.functions_available_trigger.lock_or_recover();
        if trigger_guard.is_none() {
            // Get or create function path (reuse existing if trigger registration previously failed)
            let function_id = {
                let mut path_guard = self.inner.functions_available_function_id.lock_or_recover();
                if path_guard.is_none() {
                    let path = format!("iii.on_functions_available.{}", Uuid::new_v4());
                    *path_guard = Some(path.clone());
                    path
                } else {
                    path_guard.clone().unwrap()
                }
            };

            // Register handler function only if it doesn't already exist
            let function_exists = self
                .inner
                .functions
                .lock_or_recover()
                .contains_key(&function_id);
            if !function_exists {
                let iii = self.clone();
                self.register_function(function_id.clone(), move |input: Value| {
                    let iii = iii.clone();
                    async move {
                        // Extract functions from trigger payload
                        let functions = input
                            .get("functions")
                            .and_then(|v| {
                                serde_json::from_value::<Vec<FunctionInfo>>(v.clone()).ok()
                            })
                            .unwrap_or_default();

                        let callbacks = iii.inner.functions_available_callbacks.lock_or_recover();
                        for cb in callbacks.values() {
                            cb(functions.clone());
                        }
                        Ok(Value::Null)
                    }
                });
            }

            // Register trigger
            match self.register_trigger(
                "engine::functions-available",
                function_id,
                serde_json::json!({}),
            ) {
                Ok(trigger) => {
                    *trigger_guard = Some(trigger);
                }
                Err(err) => {
                    tracing::warn!(error = %err, "Failed to register functions_available trigger");
                }
            }
        }

        FunctionsAvailableGuard {
            iii: self.clone(),
            callback_id,
        }
    }

    /// List all connected workers from the engine
    pub async fn list_workers(&self) -> Result<Vec<WorkerInfo>, IIIError> {
        let result = self
            .trigger("engine::workers::list", serde_json::json!({}))
            .await?;

        let workers = result
            .get("workers")
            .and_then(|v| serde_json::from_value::<Vec<WorkerInfo>>(v.clone()).ok())
            .unwrap_or_default();

        Ok(workers)
    }

    /// List all registered triggers from the engine
    pub async fn list_triggers(&self) -> Result<Vec<TriggerInfo>, IIIError> {
        let result = self
            .trigger("engine::triggers::list", serde_json::json!({}))
            .await?;

        let triggers = result
            .get("triggers")
            .and_then(|v| serde_json::from_value::<Vec<TriggerInfo>>(v.clone()).ok())
            .unwrap_or_default();

        Ok(triggers)
    }

    /// Create a streaming channel pair for worker-to-worker data transfer.
    ///
    /// Returns a `Channel` with writer, reader, and their serializable refs
    /// that can be passed as fields in invocation data to other functions.
    pub async fn create_channel(&self, buffer_size: Option<usize>) -> Result<Channel, IIIError> {
        let result = self
            .call(
                "engine::channels::create",
                serde_json::json!({ "buffer_size": buffer_size }),
            )
            .await?;

        let writer_ref: StreamChannelRef = serde_json::from_value(
            result
                .get("writer")
                .cloned()
                .ok_or_else(|| IIIError::Serde("missing 'writer' in channel response".into()))?,
        )
        .map_err(|e| IIIError::Serde(e.to_string()))?;

        let reader_ref: StreamChannelRef = serde_json::from_value(
            result
                .get("reader")
                .cloned()
                .ok_or_else(|| IIIError::Serde("missing 'reader' in channel response".into()))?,
        )
        .map_err(|e| IIIError::Serde(e.to_string()))?;

        Ok(Channel {
            writer: ChannelWriter::new(&self.inner.address, &writer_ref),
            reader: ChannelReader::new(&self.inner.address, &reader_ref),
            writer_ref,
            reader_ref,
        })
    }

    /// Register this worker's metadata with the engine (called automatically on connect)
    fn register_worker_metadata(&self) {
        if let Some(metadata) = self.inner.worker_metadata.lock_or_recover().clone() {
            let _ = self.trigger_void("engine::workers::register", metadata);
        }
    }

    fn send_message(&self, message: Message) -> Result<(), IIIError> {
        if !self.inner.running.load(Ordering::SeqCst) {
            return Ok(());
        }

        self.inner
            .outbound
            .send(Outbound::Message(message))
            .map_err(|_| IIIError::NotConnected)
    }

    async fn run_connection(&self, mut rx: mpsc::UnboundedReceiver<Outbound>) {
        let mut queue: Vec<Message> = Vec::new();

        while self.inner.running.load(Ordering::SeqCst) {
            match connect_async(&self.inner.address).await {
                Ok((stream, _)) => {
                    tracing::info!(address = %self.inner.address, "iii connected");
                    let (mut ws_tx, mut ws_rx) = stream.split();

                    queue.extend(self.collect_registrations());
                    Self::dedupe_registrations(&mut queue);
                    if let Err(err) = self.flush_queue(&mut ws_tx, &mut queue).await {
                        tracing::warn!(error = %err, "failed to flush queue");
                        sleep(Duration::from_secs(2)).await;
                        continue;
                    }

                    // Auto-register worker metadata on connect (like Node SDK)
                    self.register_worker_metadata();

                    let mut should_reconnect = false;

                    while self.inner.running.load(Ordering::SeqCst) && !should_reconnect {
                        tokio::select! {
                            outgoing = rx.recv() => {
                                match outgoing {
                                    Some(Outbound::Message(message)) => {
                                        if let Err(err) = self.send_ws(&mut ws_tx, &message).await {
                                            tracing::warn!(error = %err, "send failed; reconnecting");
                                            queue.push(message);
                                            should_reconnect = true;
                                        }
                                    }
                                    Some(Outbound::Shutdown) => {
                                        self.inner.running.store(false, Ordering::SeqCst);
                                        return;
                                    }
                                    None => {
                                        self.inner.running.store(false, Ordering::SeqCst);
                                        return;
                                    }
                                }
                            }
                            incoming = ws_rx.next() => {
                                match incoming {
                                    Some(Ok(frame)) => {
                                        if let Err(err) = self.handle_frame(frame) {
                                            tracing::warn!(error = %err, "failed to handle frame");
                                        }
                                    }
                                    Some(Err(err)) => {
                                        tracing::warn!(error = %err, "websocket receive error");
                                        should_reconnect = true;
                                    }
                                    None => {
                                        should_reconnect = true;
                                    }
                                }
                            }
                        }
                    }
                }
                Err(err) => {
                    tracing::warn!(error = %err, "failed to connect; retrying");
                }
            }

            if self.inner.running.load(Ordering::SeqCst) {
                sleep(Duration::from_secs(2)).await;
            }
        }
    }

    fn collect_registrations(&self) -> Vec<Message> {
        let mut messages = Vec::new();

        for trigger_type in self.inner.trigger_types.lock_or_recover().values() {
            messages.push(trigger_type.message.to_message());
        }

        for service in self.inner.services.lock_or_recover().values() {
            messages.push(service.to_message());
        }

        for function in self.inner.functions.lock_or_recover().values() {
            messages.push(function.message.to_message());
        }

        for message in self.inner.http_functions.lock_or_recover().values() {
            messages.push(message.to_message());
        }

        for trigger in self.inner.triggers.lock_or_recover().values() {
            messages.push(trigger.to_message());
        }

        messages
    }

    fn dedupe_registrations(queue: &mut Vec<Message>) {
        let mut seen = HashSet::new();
        let mut deduped_rev = Vec::with_capacity(queue.len());

        for message in queue.iter().rev() {
            let key = match message {
                Message::RegisterTriggerType { id, .. } => format!("trigger_type:{id}"),
                Message::RegisterTrigger { id, .. } => format!("trigger:{id}"),
                Message::RegisterFunction { id, .. } => {
                    format!("function:{id}")
                }
                Message::RegisterService { id, .. } => format!("service:{id}"),
                _ => {
                    deduped_rev.push(message.clone());
                    continue;
                }
            };

            if seen.insert(key) {
                deduped_rev.push(message.clone());
            }
        }

        deduped_rev.reverse();
        *queue = deduped_rev;
    }

    async fn flush_queue(
        &self,
        ws_tx: &mut WsTx,
        queue: &mut Vec<Message>,
    ) -> Result<(), IIIError> {
        let mut drained = Vec::new();
        std::mem::swap(queue, &mut drained);

        let mut iter = drained.into_iter();
        while let Some(message) = iter.next() {
            if let Err(err) = self.send_ws(ws_tx, &message).await {
                queue.push(message);
                queue.extend(iter);
                return Err(err);
            }
        }

        Ok(())
    }

    async fn send_ws(&self, ws_tx: &mut WsTx, message: &Message) -> Result<(), IIIError> {
        let payload = serde_json::to_string(message)?;
        ws_tx.send(WsMessage::Text(payload.into())).await?;
        Ok(())
    }

    fn handle_frame(&self, frame: WsMessage) -> Result<(), IIIError> {
        match frame {
            WsMessage::Text(text) => self.handle_message(&text),
            WsMessage::Binary(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                self.handle_message(&text)
            }
            _ => Ok(()),
        }
    }

    fn handle_message(&self, payload: &str) -> Result<(), IIIError> {
        let message: Message = serde_json::from_str(payload)?;

        match message {
            Message::InvocationResult {
                invocation_id,
                result,
                error,
                ..
            } => {
                self.handle_invocation_result(invocation_id, result, error);
            }
            Message::InvokeFunction {
                invocation_id,
                function_id,
                data,
                traceparent,
                baggage,
            } => {
                self.handle_invoke_function(invocation_id, function_id, data, traceparent, baggage);
            }
            Message::RegisterTrigger {
                id,
                trigger_type,
                function_id,
                config,
            } => {
                self.handle_register_trigger(id, trigger_type, function_id, config);
            }
            Message::Ping => {
                let _ = self.send_message(Message::Pong);
            }
            Message::WorkerRegistered { worker_id } => {
                tracing::debug!(worker_id = %worker_id, "Worker registered");
            }
            _ => {}
        }

        Ok(())
    }

    fn handle_invocation_result(
        &self,
        invocation_id: Uuid,
        result: Option<Value>,
        error: Option<ErrorBody>,
    ) {
        let sender = self.inner.pending.lock_or_recover().remove(&invocation_id);
        if let Some(sender) = sender {
            let result = match error {
                Some(error) => Err(IIIError::Remote {
                    code: error.code,
                    message: error.message,
                }),
                None => Ok(result.unwrap_or(Value::Null)),
            };
            let _ = sender.send(result);
        }
    }

    fn handle_invoke_function(
        &self,
        invocation_id: Option<Uuid>,
        function_id: String,
        data: Value,
        traceparent: Option<String>,
        baggage: Option<String>,
    ) {
        tracing::debug!(function_id = %function_id, traceparent = ?traceparent, baggage = ?baggage, "Invoking function");

        let handler = self
            .inner
            .functions
            .lock_or_recover()
            .get(&function_id)
            .map(|data| data.handler.clone());

        let Some(handler) = handler else {
            tracing::warn!(function_id = %function_id, "Invocation: Function not found");

            if let Some(invocation_id) = invocation_id {
                let (resp_tp, resp_bg) = inject_trace_headers();

                let error = ErrorBody {
                    code: "function_not_found".to_string(),
                    message: "Function not found".to_string(),
                };
                let result = self.send_message(Message::InvocationResult {
                    invocation_id,
                    function_id,
                    result: None,
                    error: Some(error),
                    traceparent: resp_tp,
                    baggage: resp_bg,
                });

                if let Err(err) = result {
                    tracing::warn!(error = %err, "error sending invocation result");
                }
            }
            return;
        };

        let iii = self.clone();

        tokio::spawn(async move {
            // Extract incoming trace context and create a span for this invocation.
            // This ensures the handler and any outbound calls it makes (e.g.
            // invoke_function_with_timeout) are linked as children of the caller's trace.
            // We use FutureExt::with_context() instead of cx.attach() because
            // ContextGuard is !Send and can't be held across .await in tokio::spawn.
            #[cfg(feature = "otel")]
            let otel_cx = {
                use crate::telemetry::context::extract_context;
                use opentelemetry::trace::{SpanKind, TraceContextExt, Tracer};

                let parent_cx = extract_context(traceparent.as_deref(), baggage.as_deref());
                let tracer = opentelemetry::global::tracer("iii-rust-sdk");
                let span = tracer
                    .span_builder(format!("call {}", function_id))
                    .with_kind(SpanKind::Server)
                    .start_with_context(&tracer, &parent_cx);
                parent_cx.with_span(span)
            };

            #[cfg(feature = "otel")]
            let result = {
                use opentelemetry::trace::FutureExt as OtelFutureExt;
                handler(data).with_context(otel_cx.clone()).await
            };

            #[cfg(not(feature = "otel"))]
            let result = handler(data).await;

            // Record span status based on result
            #[cfg(feature = "otel")]
            {
                use opentelemetry::trace::{Status, TraceContextExt};
                let span = otel_cx.span();
                match &result {
                    Ok(_) => span.set_status(Status::Ok),
                    Err(err) => span.set_status(Status::error(err.to_string())),
                }
            }

            if let Some(invocation_id) = invocation_id {
                // Inject trace context from our span into the response.
                // We briefly attach the otel context (no .await crossing)
                // so inject_traceparent/inject_baggage can read it.
                #[cfg(feature = "otel")]
                let (resp_tp, resp_bg) = {
                    let _guard = otel_cx.attach();
                    inject_trace_headers()
                };
                #[cfg(not(feature = "otel"))]
                let (resp_tp, resp_bg) = inject_trace_headers();

                let message = match result {
                    Ok(value) => Message::InvocationResult {
                        invocation_id,
                        function_id,
                        result: Some(value),
                        error: None,
                        traceparent: resp_tp,
                        baggage: resp_bg,
                    },
                    Err(err) => Message::InvocationResult {
                        invocation_id,
                        function_id,
                        result: None,
                        error: Some(ErrorBody {
                            code: "invocation_failed".to_string(),
                            message: err.to_string(),
                        }),
                        traceparent: resp_tp,
                        baggage: resp_bg,
                    },
                };

                let _ = iii.send_message(message);
            } else if let Err(err) = result {
                tracing::warn!(error = %err, "error handling async invocation");
            }
        });
    }

    fn handle_register_trigger(
        &self,
        id: String,
        trigger_type: String,
        function_id: String,
        config: Value,
    ) {
        let handler = self
            .inner
            .trigger_types
            .lock_or_recover()
            .get(&trigger_type)
            .map(|data| data.handler.clone());

        let iii = self.clone();

        tokio::spawn(async move {
            let message = if let Some(handler) = handler {
                let config = TriggerConfig {
                    id: id.clone(),
                    function_id: function_id.clone(),
                    config,
                };

                match handler.register_trigger(config).await {
                    Ok(()) => Message::TriggerRegistrationResult {
                        id,
                        trigger_type,
                        function_id,
                        error: None,
                    },
                    Err(err) => Message::TriggerRegistrationResult {
                        id,
                        trigger_type,
                        function_id,
                        error: Some(ErrorBody {
                            code: "trigger_registration_failed".to_string(),
                            message: err.to_string(),
                        }),
                    },
                }
            } else {
                Message::TriggerRegistrationResult {
                    id,
                    trigger_type,
                    function_id,
                    error: Some(ErrorBody {
                        code: "trigger_type_not_found".to_string(),
                        message: "Trigger type not found".to_string(),
                    }),
                }
            };

            let _ = iii.send_message(message);
        });
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use serde_json::json;

    use super::*;
    use crate::protocol::{HttpInvocationConfig, HttpMethod};

    #[test]
    fn register_trigger_unregister_removes_entry() {
        let iii = III::new("ws://localhost:1234");
        let trigger = iii
            .register_trigger("demo", "functions.echo", json!({ "foo": "bar" }))
            .unwrap();

        assert_eq!(iii.inner.triggers.lock().unwrap().len(), 1);

        trigger.unregister();

        assert_eq!(iii.inner.triggers.lock().unwrap().len(), 0);
    }

    #[test]
    fn register_http_function_stores_and_unregister_removes() {
        let iii = III::new("ws://localhost:1234");
        let config = HttpInvocationConfig {
            url: "https://example.com/invoke".to_string(),
            method: HttpMethod::Post,
            timeout_ms: Some(30000),
            headers: HashMap::new(),
            auth: None,
        };

        let http_fn = iii
            .register_http_function("external::my_lambda", config)
            .unwrap();

        assert_eq!(http_fn.id, "external::my_lambda");
        assert_eq!(iii.inner.http_functions.lock().unwrap().len(), 1);

        http_fn.unregister();

        assert_eq!(iii.inner.http_functions.lock().unwrap().len(), 0);
    }

    #[test]
    fn register_http_function_rejects_empty_id() {
        let iii = III::new("ws://localhost:1234");
        let config = HttpInvocationConfig {
            url: "https://example.com/invoke".to_string(),
            method: HttpMethod::Post,
            timeout_ms: None,
            headers: HashMap::new(),
            auth: None,
        };

        let result = iii.register_http_function("", config);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn invoke_function_times_out_and_clears_pending() {
        let iii = III::new("ws://localhost:1234");
        let result = iii
            .trigger_with_timeout(
                "functions.echo",
                json!({ "a": 1 }),
                Duration::from_millis(10),
            )
            .await;

        assert!(matches!(result, Err(IIIError::Timeout)));
        assert!(iii.inner.pending.lock().unwrap().is_empty());
    }
}
