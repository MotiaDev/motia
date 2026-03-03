pub mod channels;
pub mod context;
pub mod error;
pub mod iii;
pub mod logger;
pub mod protocol;
pub mod stream;
#[cfg(feature = "otel")]
pub mod telemetry;
pub mod triggers;
pub mod types;

pub use channels::{
    ChannelDirection, ChannelItem, ChannelReader, ChannelWriter, StreamChannelRef,
    extract_channel_refs, is_channel_ref,
};
pub use context::{Context, get_context, with_context};
pub use error::IIIError;
pub use iii::{
    FunctionInfo, FunctionsAvailableGuard, HttpFunctionRef, III, TriggerInfo, WorkerInfo,
    WorkerMetadata,
};
pub use logger::Logger;
pub use protocol::{
    ErrorBody, FunctionMessage, HttpAuthConfig, HttpInvocationConfig, HttpMethod, Message,
    RegisterFunctionMessage, RegisterServiceMessage, RegisterTriggerMessage,
    RegisterTriggerTypeMessage,
};
pub use stream::{Streams, UpdateBuilder};
pub use triggers::{Trigger, TriggerConfig, TriggerHandler};
pub use types::{
    ApiRequest, ApiResponse, Channel, FieldPath, StreamUpdateInput, UpdateOp, UpdateResult,
};

pub use serde_json::Value;

#[derive(Debug, Clone, Default)]
pub struct InitOptions {
    pub metadata: Option<WorkerMetadata>,
    #[cfg(feature = "otel")]
    pub otel: Option<crate::telemetry::types::OtelConfig>,
}

pub fn init(address: &str, options: InitOptions) -> Result<III, IIIError> {
    let InitOptions {
        metadata,
        #[cfg(feature = "otel")]
        otel,
    } = options;

    let iii = if let Some(metadata) = metadata {
        III::with_metadata(address, metadata)
    } else {
        III::new(address)
    };

    #[cfg(feature = "otel")]
    if let Some(cfg) = otel {
        iii.set_otel_config(cfg);
    }

    let handle = tokio::runtime::Handle::try_current()
        .map_err(|_| IIIError::Runtime("iii_sdk::init requires an active Tokio runtime".into()))?;

    let client = iii.clone();
    handle.spawn(async move {
        if let Err(err) = client.connect().await {
            tracing::warn!(error = %err, "iii_sdk::init auto-connect failed");
        }
    });

    Ok(iii)
}

// OpenTelemetry re-exports (behind "otel" feature flag)
#[cfg(feature = "otel")]
pub use telemetry::{
    context::{
        current_span_id, current_trace_id, extract_baggage, extract_context, extract_traceparent,
        get_all_baggage, get_baggage_entry, inject_baggage, inject_traceparent,
        remove_baggage_entry, set_baggage_entry,
    },
    flush_otel, get_meter, get_tracer,
    http_instrumentation::execute_traced_request,
    init_otel, is_initialized, shutdown_otel,
    types::OtelConfig,
    types::ReconnectionConfig,
    with_span,
};

// Re-export commonly used OpenTelemetry types for convenience
#[cfg(feature = "otel")]
pub use opentelemetry::trace::SpanKind;
#[cfg(feature = "otel")]
pub use opentelemetry::trace::Status as SpanStatus;
