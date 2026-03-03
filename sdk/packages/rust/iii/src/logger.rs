use serde_json::Value;

#[cfg(feature = "otel")]
use opentelemetry::logs::{LogRecord as _, Logger as _, LoggerProvider as _, Severity};

#[derive(Clone, Default)]
pub struct Logger {
    function_name: String,
}

impl Logger {
    pub fn new(function_name: Option<String>) -> Self {
        Self {
            function_name: function_name.unwrap_or_default(),
        }
    }

    /// Emit a LogRecord via the OTel LoggerProvider with trace context from the active span.
    /// Returns `true` if the log was emitted via OTel, `false` otherwise.
    #[cfg(feature = "otel")]
    fn emit_otel(&self, message: &str, severity: Severity, data: Option<&Value>) -> bool {
        let Some(provider) = crate::telemetry::get_logger_provider() else {
            return false;
        };

        let logger = provider.logger("iii-rust-sdk");
        let mut record = logger.create_log_record();
        let now = std::time::SystemTime::now();
        record.set_timestamp(now);
        record.set_observed_timestamp(now);
        record.set_severity_number(severity);
        record.set_body(message.to_string().into());

        if !self.function_name.is_empty() {
            record.add_attribute("function_name", self.function_name.clone());
        }
        if let Some(d) = data {
            record.add_attribute("data", d.to_string());
        }

        // Attach trace context from the active OTel span
        {
            use opentelemetry::trace::TraceContextExt;
            let cx = opentelemetry::Context::current();
            let span_ctx = cx.span().span_context().clone();
            if span_ctx.is_valid() {
                record.set_trace_context(
                    span_ctx.trace_id(),
                    span_ctx.span_id(),
                    Some(span_ctx.trace_flags()),
                );
            }
        }

        logger.emit(record);
        true
    }

    #[cfg_attr(not(feature = "otel"), allow(unused_variables))]
    pub fn info(&self, message: &str, data: Option<Value>) {
        #[cfg(feature = "otel")]
        if self.emit_otel(message, Severity::Info, data.as_ref()) {
            return;
        }
        tracing::info!(function = %self.function_name, message = %message);
    }

    #[cfg_attr(not(feature = "otel"), allow(unused_variables))]
    pub fn warn(&self, message: &str, data: Option<Value>) {
        #[cfg(feature = "otel")]
        if self.emit_otel(message, Severity::Warn, data.as_ref()) {
            return;
        }
        tracing::warn!(function = %self.function_name, message = %message);
    }

    #[cfg_attr(not(feature = "otel"), allow(unused_variables))]
    pub fn error(&self, message: &str, data: Option<Value>) {
        #[cfg(feature = "otel")]
        if self.emit_otel(message, Severity::Error, data.as_ref()) {
            return;
        }
        tracing::error!(function = %self.function_name, message = %message);
    }

    #[cfg_attr(not(feature = "otel"), allow(unused_variables))]
    pub fn debug(&self, message: &str, data: Option<Value>) {
        #[cfg(feature = "otel")]
        if self.emit_otel(message, Severity::Debug, data.as_ref()) {
            return;
        }
        tracing::debug!(function = %self.function_name, message = %message);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn logger_uses_function_name() {
        let logger = Logger::new(Some("my-function".to_string()));
        assert_eq!(logger.function_name, "my-function");
    }

    #[test]
    fn logger_default_function_name() {
        let logger = Logger::new(None);
        assert_eq!(logger.function_name, "");
    }
}
