// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at team@iii.dev
// See LICENSE and PATENTS files for details.

pub mod config;

use std::{pin::Pin, sync::Arc};

use dashmap::DashMap;
use futures::Future;
use serde_json::Value;

use crate::{
    engine::{Engine, EngineTrait, RegisterFunctionRequest},
    function::FunctionResult,
    invocation::{
        auth::resolve_auth_ref,
        http_function::HttpFunctionConfig,
        http_invoker::{HttpEndpointParams, HttpInvoker, HttpInvokerConfig},
        method::HttpAuth,
    },
    protocol::ErrorBody,
    workers::traits::Worker,
};

use config::HttpFunctionsConfig;

type HandlerFuture = Pin<Box<dyn Future<Output = FunctionResult<Option<Value>, ErrorBody>> + Send>>;

#[derive(Clone)]
pub struct HttpFunctionsWorker {
    engine: Arc<Engine>,
    http_invoker: Arc<HttpInvoker>,
    /// Keyed by `(namespace, function_path)`, matching `FunctionsRegistry`.
    /// The same function id may legitimately be exported by workers in two
    /// different namespaces; a bare-path key would let the second registration
    /// clobber the first's config, and the first worker's unregister would then
    /// drop the survivor's entry.
    http_functions: Arc<DashMap<(String, String), HttpFunctionConfig>>,
    #[allow(dead_code)]
    config: HttpFunctionsConfig,
}

impl HttpFunctionsWorker {
    fn create_handler_wrapper(
        &self,
        config: HttpFunctionConfig,
        auth: Option<HttpAuth>,
    ) -> crate::engine::Handler<impl Fn(Value) -> HandlerFuture + Send + Sync + 'static> {
        let invoker = self.http_invoker.clone();
        let function_path = config.function_path.clone();
        let url = config.url.clone();
        let method = config.method.clone();
        let timeout_ms = config.timeout_ms;
        let headers = config.headers.clone();

        crate::engine::Handler::new(move |input: Value| -> HandlerFuture {
            let invoker = invoker.clone();
            let function_path = function_path.clone();
            let url = url.clone();
            let method = method.clone();
            let headers = headers.clone();
            let auth = auth.clone();

            Box::pin(async move {
                let endpoint = HttpEndpointParams {
                    url: &url,
                    method: &method,
                    timeout_ms: &timeout_ms,
                    headers: &headers,
                    auth: &auth,
                };

                match invoker
                    .invoke_http(
                        &function_path,
                        &endpoint,
                        uuid::Uuid::new_v4(),
                        input,
                        None,
                        None,
                    )
                    .await
                {
                    Ok(result) => FunctionResult::Success(result),
                    Err(e) => FunctionResult::Failure(e),
                }
            })
        })
    }

    /// Build an immutable owner endpoint before publishing any ownership.
    pub(crate) async fn prepare_http_handler(
        &self,
        config: HttpFunctionConfig,
    ) -> Result<Arc<crate::function::HandlerFn>, ErrorBody> {
        self.http_invoker
            .url_validator()
            .validate(&config.url)
            .await
            .map_err(|e| ErrorBody {
                code: "url_validation_failed".into(),
                message: e.to_string(),
                stacktrace: None,
            })?;
        let auth = config.auth.as_ref().map(resolve_auth_ref).transpose()?;
        let handler = Arc::new(self.create_handler_wrapper(config, auth));
        Ok(Arc::new(move |_id, input, _session, _metadata| {
            let handler = handler.clone();
            Box::pin(async move { handler.call(input).await })
        }))
    }

    /// Registers an HTTP-invocation function into `namespace`.
    ///
    /// `namespace` must be the effective namespace of the connection that sent
    /// the `RegisterFunction` (`Engine::connection_namespace`). It is not a
    /// decoration: the service registry, `external_function_owners`, the
    /// unregister path and invoke-time resolution are all keyed by it, so a
    /// registration written anywhere else is unreachable and un-removable.
    pub async fn register_http_function(
        &self,
        namespace: &str,
        config: HttpFunctionConfig,
    ) -> Result<(), ErrorBody> {
        let endpoint = self.prepare_http_handler(config.clone()).await?;
        let handler = crate::engine::Handler::new(move |input| endpoint(None, input, None, None));

        self.engine.register_function_handler_ns(
            namespace,
            RegisterFunctionRequest {
                function_id: config.function_path.clone(),
                description: config.description.clone(),
                request_format: config.request_format.clone(),
                response_format: config.response_format.clone(),
                metadata: config.metadata.clone(),
            },
            handler,
        );

        self.http_functions.insert(
            (namespace.to_string(), config.function_path.clone()),
            config,
        );

        Ok(())
    }

    /// Removes an HTTP-invocation function from `namespace`. Must be given the
    /// same namespace [`Self::register_http_function`] wrote to.
    pub async fn unregister_http_function(
        &self,
        namespace: &str,
        function_path: &str,
    ) -> Result<(), ErrorBody> {
        self.http_functions
            .remove(&(namespace.to_string(), function_path.to_string()));
        self.engine.functions.remove(namespace, function_path);
        Ok(())
    }

    pub fn http_invoker(&self) -> &Arc<HttpInvoker> {
        &self.http_invoker
    }

    pub fn http_functions(&self) -> &Arc<DashMap<(String, String), HttpFunctionConfig>> {
        &self.http_functions
    }
}

#[async_trait::async_trait]
impl Worker for HttpFunctionsWorker {
    fn name(&self) -> &'static str {
        "HttpFunctionsWorker"
    }

    async fn create(engine: Arc<Engine>, config: Option<Value>) -> anyhow::Result<Box<dyn Worker>> {
        let config: HttpFunctionsConfig = config
            .map(serde_json::from_value)
            .transpose()?
            .unwrap_or_default();

        let http_invoker = Arc::new(HttpInvoker::new(HttpInvokerConfig {
            url_validator: config.security.clone().into(),
            ..HttpInvokerConfig::default()
        })?);

        let http_functions = Arc::new(DashMap::new());

        Ok(Box::new(Self {
            engine,
            http_invoker,
            http_functions,
            config,
        }))
    }

    fn register_functions(&self, _engine: Arc<Engine>) {}

    async fn initialize(&self) -> anyhow::Result<()> {
        self.engine
            .service_registry
            .register_service("http_functions", Arc::new(self.clone()));

        Ok(())
    }
}

crate::register_worker!(
    "iii-http-functions",
    HttpFunctionsWorker,
    description = "Expose external HTTP endpoints from config as callable functions."
);

#[cfg(test)]
mod tests {
    use std::{
        collections::HashMap,
        sync::{Arc, Mutex},
    };

    use axum::{
        Json, Router,
        body::Bytes,
        extract::State,
        http::{HeaderMap, Method, StatusCode},
        routing::{get, post},
    };
    use serde_json::json;
    use serial_test::serial;
    use tokio::{net::TcpListener, task::JoinHandle};

    use super::*;
    use crate::{
        config::SecurityConfig,
        engine::EngineTrait,
        invocation::{auth::HttpAuthConfig, method::HttpMethod},
        workers::observability::metrics::ensure_default_meter,
    };

    #[derive(Clone, Default)]
    struct RequestCapture {
        headers: Arc<Mutex<HashMap<String, String>>>,
        method: Arc<Mutex<Option<String>>>,
        body: Arc<Mutex<Option<Value>>>,
    }

    async fn echo_handler(
        State(capture): State<RequestCapture>,
        method: Method,
        headers: HeaderMap,
        body: Bytes,
    ) -> (StatusCode, Json<Value>) {
        let mut header_map = HashMap::new();
        for (name, value) in &headers {
            header_map.insert(
                name.as_str().to_string(),
                value.to_str().unwrap_or_default().to_string(),
            );
        }

        *capture.method.lock().expect("lock request method") = Some(method.to_string());
        *capture.headers.lock().expect("lock request headers") = header_map.clone();
        *capture.body.lock().expect("lock request body") = Some(if body.is_empty() {
            Value::Null
        } else {
            serde_json::from_slice(&body).expect("request body should be valid json")
        });

        (
            StatusCode::OK,
            Json(json!({
                "method": method.to_string(),
                "headers": header_map,
                "body": capture.body.lock().expect("lock request body").clone().unwrap_or(Value::Null),
            })),
        )
    }

    async fn empty_handler() -> StatusCode {
        StatusCode::NO_CONTENT
    }

    async fn invalid_handler() -> &'static str {
        "not-json"
    }

    async fn error_handler() -> (StatusCode, Json<Value>) {
        (
            StatusCode::BAD_GATEWAY,
            Json(json!({
                "error": {
                    "code": "UPSTREAM_ERROR",
                    "message": "upstream failed"
                }
            })),
        )
    }

    async fn spawn_http_server() -> (String, RequestCapture, JoinHandle<()>) {
        let capture = RequestCapture::default();
        let app = Router::new()
            .route("/echo", get(echo_handler).post(echo_handler))
            .route("/empty", post(empty_handler))
            .route("/invalid", post(invalid_handler))
            .route("/error", post(error_handler))
            .with_state(capture.clone());

        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind local http test server");
        let addr = listener.local_addr().expect("local addr");
        let handle = tokio::spawn(async move {
            axum::serve(listener, app)
                .await
                .expect("serve local http app");
        });

        (format!("http://{addr}"), capture, handle)
    }

    fn permissive_config() -> HttpFunctionsConfig {
        HttpFunctionsConfig {
            security: SecurityConfig {
                require_https: false,
                block_private_ips: false,
                url_allowlist: vec!["*".to_string()],
            },
        }
    }

    fn build_module(engine: Arc<crate::engine::Engine>) -> HttpFunctionsWorker {
        let config = permissive_config();
        HttpFunctionsWorker {
            engine,
            http_invoker: Arc::new(
                HttpInvoker::new(HttpInvokerConfig {
                    url_validator: config.security.clone().into(),
                    ..HttpInvokerConfig::default()
                })
                .expect("create http invoker"),
            ),
            http_functions: Arc::new(DashMap::new()),
            config,
        }
    }

    fn make_function_config(function_path: &str, url: String) -> HttpFunctionConfig {
        HttpFunctionConfig {
            function_path: function_path.to_string(),
            url,
            method: HttpMethod::Post,
            timeout_ms: Some(5_000),
            headers: HashMap::new(),
            auth: None,
            description: Some(format!("test function {function_path}")),
            request_format: None,
            response_format: None,
            metadata: None,
            registered_at: None,
            updated_at: None,
        }
    }

    async fn shared_http_engine() -> Arc<Engine> {
        ensure_default_meter();
        let engine = Arc::new(Engine::new());
        engine.set_shared_namespace_ownership(true);
        build_module(engine.clone())
            .initialize()
            .await
            .expect("initialize existing HTTP fixture");
        engine
    }

    async fn shared_http_owner(
        engine: &Engine,
    ) -> (
        crate::worker_connections::WorkerConnection,
        tokio::sync::mpsc::Receiver<crate::engine::Outbound>,
    ) {
        let (tx, rx) = tokio::sync::mpsc::channel(32);
        let worker = crate::worker_connections::WorkerConnection::new(tx);
        engine.worker_registry.register_worker(worker.clone());
        engine.begin_namespace_resolution(&worker);
        engine.resolve_connection_namespace(&worker, "orders").await;
        (worker, rx)
    }

    fn shared_http_registration(url: String, owner: &str) -> crate::protocol::Message {
        crate::protocol::Message::RegisterFunction {
            id: "shared-http::echo".to_string(),
            description: Some("canonical outbound HTTP descriptor".to_string()),
            request_format: Some(json!({"type": "object"})),
            response_format: Some(json!({"type": "object"})),
            metadata: Some(json!({"version": 1})),
            invocation: Some(crate::protocol::HttpInvocationRef {
                url,
                method: crate::invocation::method::HttpMethod::Post,
                timeout_ms: Some(if owner == "a" { 2_000 } else { 3_000 }),
                headers: HashMap::from([("x-owner".to_string(), owner.to_string())]),
                auth: None,
            }),
        }
    }

    async fn shared_http_call(engine: &Engine) -> Value {
        tokio::time::timeout(
            std::time::Duration::from_secs(5),
            engine.call_with_metadata_ns(
                "orders",
                "shared-http::echo",
                json!({"probe": true}),
                None,
            ),
        )
        .await
        .expect("outbound HTTP invocation must finish without retries")
        .expect("invoke retained endpoint")
        .expect("echo response body")
    }

    fn shared_http_assert_rejected(rx: &mut tokio::sync::mpsc::Receiver<crate::engine::Outbound>) {
        match rx
            .try_recv()
            .expect("mixed invocation kinds must be rejected")
        {
            crate::engine::Outbound::Protocol(crate::protocol::Message::RegistrationRejected {
                code,
                namespace,
                function_id,
                ..
            }) => {
                assert_eq!(code, "function_owner_mismatch");
                assert_eq!(namespace, "orders");
                assert_eq!(function_id.as_deref(), Some("shared-http::echo"));
            }
            other => panic!("expected kind rejection, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn shared_namespace_http_distinct_valid_endpoints_receive_selected_calls() {
        let engine = shared_http_engine().await;
        let (a, mut a_rx) = shared_http_owner(&engine).await;
        let (b, mut b_rx) = shared_http_owner(&engine).await;
        let (a_url, a_capture, a_server) = spawn_http_server().await;
        let (b_url, b_capture, b_server) = spawn_http_server().await;
        for (worker, url, owner) in [(&a, a_url, "a"), (&b, b_url, "b")] {
            engine
                .router_msg(
                    worker,
                    &shared_http_registration(format!("{url}/echo"), owner),
                )
                .await
                .unwrap();
        }
        assert!(a.has_external_function_id("shared-http::echo").await);
        assert!(
            b.has_external_function_id("shared-http::echo").await,
            "compatible HTTP owner with a distinct URL/header/timeout must join"
        );
        assert!(a_rx.try_recv().is_err());
        assert!(
            b_rx.try_recv().is_err(),
            "compatible endpoint cannot be rejected"
        );
        let mut selected = Vec::new();
        for _ in 0..4 {
            let result = shared_http_call(&engine).await;
            assert_eq!(result["body"], json!({"probe": true}));
            selected.push(result["headers"]["x-owner"].clone());
        }
        assert_eq!(
            selected,
            vec![json!("a"), json!("b"), json!("a"), json!("b")]
        );
        for (capture, owner) in [(&a_capture, "a"), (&b_capture, "b")] {
            let headers = capture.headers.lock().expect("captured endpoint headers");
            assert_eq!(headers.get("x-owner").map(String::as_str), Some(owner));
            assert_eq!(*capture.body.lock().unwrap(), Some(json!({"probe": true})));
        }
        a_server.abort();
        b_server.abort();
    }

    #[tokio::test]
    async fn shared_namespace_http_failed_join_preserves_incumbent_and_allows_valid_join() {
        let engine = shared_http_engine().await;
        let (a, _a_rx) = shared_http_owner(&engine).await;
        let (b, _b_rx) = shared_http_owner(&engine).await;
        let (url, _, server) = spawn_http_server().await;
        engine
            .router_msg(&a, &shared_http_registration(format!("{url}/echo"), "a"))
            .await
            .unwrap();
        let before = engine.functions.get("orders", "shared-http::echo").unwrap();
        engine
            .router_msg(&b, &shared_http_registration("://bad-url".to_string(), "b"))
            .await
            .unwrap();
        assert!(!b.has_external_function_id("shared-http::echo").await);
        engine
            .router_msg(
                &b,
                &crate::protocol::Message::UnregisterFunction {
                    id: "shared-http::echo".to_string(),
                },
            )
            .await
            .unwrap();
        let after = engine.functions.get("orders", "shared-http::echo").unwrap();
        assert!(Arc::ptr_eq(&before.handler, &after.handler));
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "a");
        assert!(
            engine
                .service_registry
                .get("orders", "shared-http")
                .is_some()
        );

        let (c, mut c_rx) = shared_http_owner(&engine).await;
        engine
            .router_msg(&c, &shared_http_registration(format!("{url}/echo"), "c"))
            .await
            .unwrap();
        assert!(
            c.has_external_function_id("shared-http::echo").await,
            "failed endpoint join must not prevent a later compatible HTTP owner"
        );
        assert!(c_rx.try_recv().is_err());
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "a");
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "c");
        server.abort();
    }

    #[tokio::test]
    async fn shared_namespace_http_mixed_kind_rejection_preserves_compatible_http_join() {
        let engine = shared_http_engine().await;
        let (a, _a_rx) = shared_http_owner(&engine).await;
        let (b, mut b_rx) = shared_http_owner(&engine).await;
        let (url, _, server) = spawn_http_server().await;
        let http = shared_http_registration(format!("{url}/echo"), "a");
        engine.router_msg(&a, &http).await.unwrap();
        let mut regular = http.clone();
        if let crate::protocol::Message::RegisterFunction { invocation, .. } = &mut regular {
            *invocation = None;
        }
        engine.router_msg(&b, &regular).await.unwrap();
        shared_http_assert_rejected(&mut b_rx);
        assert!(b.get_regular_function_ids().await.is_empty());
        assert!(b.get_external_function_ids().await.is_empty());
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "a");
        engine
            .router_msg(&b, &shared_http_registration(format!("{url}/echo"), "b"))
            .await
            .unwrap();
        assert!(
            b.has_external_function_id("shared-http::echo").await,
            "rejected regular owner must still be able to join with the canonical HTTP kind"
        );
        assert!(b_rx.try_recv().is_err());
        engine
            .router_msg(
                &a,
                &crate::protocol::Message::UnregisterFunction {
                    id: "shared-http::echo".to_string(),
                },
            )
            .await
            .unwrap();
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "b");
        server.abort();
    }

    #[tokio::test]
    async fn shared_namespace_http_remove_one_owner_retains_peer_until_final_removal() {
        let engine = shared_http_engine().await;
        let (a, _a_rx) = shared_http_owner(&engine).await;
        let (b, _b_rx) = shared_http_owner(&engine).await;
        let (url, _, server) = spawn_http_server().await;
        for (worker, owner) in [(&a, "a"), (&b, "b")] {
            engine
                .router_msg(
                    worker,
                    &shared_http_registration(format!("{url}/echo"), owner),
                )
                .await
                .unwrap();
        }
        let unregister = crate::protocol::Message::UnregisterFunction {
            id: "shared-http::echo".to_string(),
        };
        engine.router_msg(&a, &unregister).await.unwrap();
        assert!(
            engine
                .functions
                .get("orders", "shared-http::echo")
                .is_some(),
            "removing one HTTP owner must retain the peer's canonical function"
        );
        assert!(
            engine
                .service_registry
                .get("orders", "shared-http")
                .is_some()
        );
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "b");
        engine
            .router_msg(
                &a,
                &crate::protocol::Message::UnregisterFunction {
                    id: "shared-http::echo".to_string(),
                },
            )
            .await
            .unwrap();
        assert_eq!(shared_http_call(&engine).await["headers"]["x-owner"], "b");
        engine.router_msg(&b, &unregister).await.unwrap();
        assert!(
            engine
                .functions
                .get("orders", "shared-http::echo")
                .is_none()
        );
        assert!(
            engine
                .service_registry
                .get("orders", "shared-http")
                .is_none()
        );
        server.abort();
    }

    #[tokio::test]
    async fn create_and_initialize_registers_http_functions_service() {
        ensure_default_meter();
        let engine = Arc::new(crate::engine::Engine::new());
        let config = serde_json::to_value(permissive_config()).expect("serialize config");

        let module = HttpFunctionsWorker::create(engine.clone(), Some(config))
            .await
            .expect("create http functions module");
        assert_eq!(module.name(), "HttpFunctionsWorker");

        module.initialize().await.expect("initialize module");

        assert!(
            engine
                .service_registry
                .get_service::<HttpFunctionsWorker>("http_functions")
                .is_some()
        );

        let module = engine
            .service_registry
            .get_service::<HttpFunctionsWorker>("http_functions")
            .expect("http functions service");
        assert!(Arc::strong_count(module.http_invoker()) >= 1);
        assert!(module.http_functions().is_empty());
        module.register_functions(engine.clone());
    }

    #[tokio::test]
    async fn register_http_function_invokes_local_server_and_unregisters() {
        ensure_default_meter();
        let engine = Arc::new(crate::engine::Engine::new());
        let module = build_module(engine.clone());
        let (base_url, capture, server) = spawn_http_server().await;

        let mut config = make_function_config("remote.echo", format!("{base_url}/echo"));
        config
            .headers
            .insert("x-custom".to_string(), "present".to_string());

        module
            .register_http_function(crate::protocol::DEFAULT_NAMESPACE, config.clone())
            .await
            .expect("register http function");
        assert!(module.http_functions.contains_key(&(
            crate::protocol::DEFAULT_NAMESPACE.to_string(),
            "remote.echo".to_string()
        )));
        assert!(
            engine
                .functions
                .get(crate::protocol::DEFAULT_NAMESPACE, "remote.echo")
                .is_some()
        );

        let result = engine
            .call("remote.echo", json!({ "hello": "world" }))
            .await
            .expect("invoke remote http function")
            .expect("http function should return a body");

        assert_eq!(result["body"], json!({ "hello": "world" }));
        assert_eq!(result["method"], "POST");

        {
            let headers = capture.headers.lock().expect("lock captured headers");
            assert_eq!(headers.get("x-custom").map(String::as_str), Some("present"));
            assert_eq!(
                headers.get("x-iii-function-path").map(String::as_str),
                Some("remote.echo")
            );
        }

        module
            .unregister_http_function(crate::protocol::DEFAULT_NAMESPACE, "remote.echo")
            .await
            .expect("unregister http function");
        assert!(!module.http_functions.contains_key(&(
            crate::protocol::DEFAULT_NAMESPACE.to_string(),
            "remote.echo".to_string()
        )));
        assert!(
            engine
                .functions
                .get(crate::protocol::DEFAULT_NAMESPACE, "remote.echo")
                .is_none()
        );

        server.abort();
    }

    #[tokio::test]
    async fn invoke_http_handler_returns_invalid_response_and_upstream_errors() {
        ensure_default_meter();
        let engine = Arc::new(crate::engine::Engine::new());
        let module = build_module(engine.clone());
        let (base_url, _capture, server) = spawn_http_server().await;

        module
            .register_http_function(
                crate::protocol::DEFAULT_NAMESPACE,
                make_function_config("remote.invalid", format!("{base_url}/invalid")),
            )
            .await
            .expect("register invalid response function");
        let invalid_result = engine.call("remote.invalid", json!({ "test": true })).await;
        match invalid_result {
            Err(err) => assert_eq!(err.code, "invalid_response"),
            _ => panic!("expected invalid_response error"),
        }

        module
            .register_http_function(
                crate::protocol::DEFAULT_NAMESPACE,
                make_function_config("remote.error", format!("{base_url}/error")),
            )
            .await
            .expect("register upstream error function");
        let error_result = engine.call("remote.error", json!({ "test": true })).await;
        match error_result {
            Err(err) => {
                assert_eq!(err.code, "UPSTREAM_ERROR");
                assert_eq!(err.message, "upstream failed");
            }
            _ => panic!("expected upstream error"),
        }

        module
            .register_http_function(
                crate::protocol::DEFAULT_NAMESPACE,
                make_function_config("remote.empty", format!("{base_url}/empty")),
            )
            .await
            .expect("register empty response function");
        let empty_result = engine
            .call("remote.empty", json!({ "test": true }))
            .await
            .expect("invoke empty response function");
        assert!(empty_result.is_none());

        server.abort();
    }

    #[tokio::test]
    async fn register_http_function_rejects_invalid_url() {
        ensure_default_meter();
        let engine = Arc::new(crate::engine::Engine::new());
        let module = build_module(engine);

        let result = module
            .register_http_function(
                crate::protocol::DEFAULT_NAMESPACE,
                make_function_config("remote.bad", "://bad-url".to_string()),
            )
            .await;

        match result {
            Err(err) => assert_eq!(err.code, "url_validation_failed"),
            _ => panic!("expected url validation failure"),
        }
        assert!(!module.http_functions.contains_key(&(
            crate::protocol::DEFAULT_NAMESPACE.to_string(),
            "remote.bad".to_string()
        )));
    }

    #[tokio::test]
    #[serial]
    async fn register_http_function_resolves_bearer_auth_and_sends_header() {
        ensure_default_meter();
        let engine = Arc::new(crate::engine::Engine::new());
        let module = build_module(engine.clone());
        let (base_url, capture, server) = spawn_http_server().await;

        // SAFETY: serialized test, no concurrent env mutation.
        unsafe { std::env::set_var("TEST_HTTP_TOKEN", "secret-token") };

        let mut config = make_function_config("remote.auth", format!("{base_url}/echo"));
        config.auth = Some(HttpAuthConfig::Bearer {
            token_key: "TEST_HTTP_TOKEN".to_string(),
        });

        module
            .register_http_function(crate::protocol::DEFAULT_NAMESPACE, config)
            .await
            .expect("register auth protected function");

        let result = engine
            .call("remote.auth", json!({ "secure": true }))
            .await
            .expect("invoke auth protected function");
        assert!(result.is_some());

        let headers = capture.headers.lock().expect("lock captured headers");
        assert_eq!(
            headers.get("authorization").map(String::as_str),
            Some("Bearer secret-token")
        );
        drop(headers);

        // SAFETY: serialized test, no concurrent env mutation.
        unsafe { std::env::remove_var("TEST_HTTP_TOKEN") };
        server.abort();
    }
}
