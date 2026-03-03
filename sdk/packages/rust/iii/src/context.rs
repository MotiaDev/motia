use crate::logger::Logger;

#[derive(Clone)]
pub struct Context {
    pub logger: Logger,
    /// The active tracing span for this context, used for OTel trace propagation.
    /// Matches Node SDK's `trace?: Span` field on Context.
    pub span: Option<tracing::Span>,
}

tokio::task_local! {
    static CONTEXT: Context;
}

pub async fn with_context<F, Fut, T>(context: Context, f: F) -> T
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = T>,
{
    CONTEXT.scope(context, f()).await
}

pub fn get_context() -> Context {
    CONTEXT
        .try_with(|ctx| ctx.clone())
        .unwrap_or_else(|_| Context {
            logger: Logger::default(),
            span: None,
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn get_context_returns_scoped_context() {
        let logger = Logger::new(Some("fn-ctx".to_string()));

        with_context(Context { logger, span: None }, || async {
            let ctx = get_context();
            // Verify we get back a context (logger methods must not panic)
            ctx.logger.info("inside", None);
        })
        .await;
    }

    #[tokio::test]
    async fn get_context_returns_default_outside_scope() {
        let ctx = get_context();
        ctx.logger.info("outside", None);
    }
}
