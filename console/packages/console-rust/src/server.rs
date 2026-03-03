use anyhow::Result;
use axum::{
    body::Body,
    extract::Path,
    http::{header, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use rust_embed::Embed;
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing::info;

#[derive(Embed)]
#[folder = "assets/"]
struct Assets;

/// Server configuration
pub struct ServerConfig {
    pub port: u16,
    pub host: String,
    pub engine_host: String,
    pub engine_port: u16,
    pub ws_port: u16,
    pub enable_flow: bool,
}

/// Generate index.html with runtime config injected
fn get_index_html(config: &ServerConfig) -> String {
    let runtime_config = json!({
        "basePath": "/",
        "engineHost": config.engine_host,
        "enginePort": config.engine_port,
        "wsPort": config.ws_port,
        "enableFlow": config.enable_flow,
    });

    // Get the base index.html from embedded assets
    let index_content = Assets::get("index.html")
        .map(|file| String::from_utf8_lossy(&file.data).to_string())
        .unwrap_or_else(|| {
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>iii Console</title>
</head>
<body>
    <div id="root"></div>
    <script>console.error('Assets not found. Build frontend first.');</script>
</body>
</html>"#
                .to_string()
        });

    // Inject the runtime config script before the closing </head> tag
    let config_json = serde_json::to_string(&runtime_config).unwrap_or_else(|_| "{}".to_string());
    let config_script = format!(
        r#"<script>window.__CONSOLE_CONFIG__={};</script>"#,
        config_json
    );

    index_content.replace("</head>", &format!("{}</head>", config_script))
}

/// Serve the /api/config endpoint with runtime configuration
async fn serve_config(
    axum::extract::State(config): axum::extract::State<std::sync::Arc<ServerConfig>>,
) -> Json<serde_json::Value> {
    Json(json!({
        "engineHost": config.engine_host,
        "enginePort": config.engine_port,
        "wsPort": config.ws_port,
        "consolePort": config.port,
        "version": env!("CARGO_PKG_VERSION"),
        "enableFlow": config.enable_flow
    }))
}

/// Serve the index.html with runtime config
async fn serve_index(
    axum::extract::State(config): axum::extract::State<std::sync::Arc<ServerConfig>>,
) -> Html<String> {
    Html(get_index_html(&config))
}

/// Serve static files or fallback to index.html for SPA routing
async fn serve_static_or_index(
    axum::extract::State(config): axum::extract::State<std::sync::Arc<ServerConfig>>,
    Path(path): Path<String>,
) -> Response {
    // Try to serve the static file first
    if let Some(file) = Assets::get(&path) {
        let mime = mime_guess::from_path(&path).first_or_octet_stream();
        let body = Body::from(file.data.to_vec());

        Response::builder()
            .status(StatusCode::OK)
            .header(
                header::CONTENT_TYPE,
                HeaderValue::from_str(mime.as_ref()).unwrap(),
            )
            .body(body)
            .unwrap()
    } else {
        // Fallback to index.html for SPA routing
        Html(get_index_html(&config)).into_response()
    }
}

/// Run the console server
pub async fn run_server(config: ServerConfig) -> Result<()> {
    // Resolve hostname to IP address
    let host = if config.host == "localhost" {
        "127.0.0.1".to_string()
    } else if config.host == "0.0.0.0" || config.host.parse::<std::net::IpAddr>().is_ok() {
        config.host.clone()
    } else {
        // Try to resolve hostname
        use std::net::ToSocketAddrs;
        format!("{}:0", config.host)
            .to_socket_addrs()
            .ok()
            .and_then(|mut addrs| addrs.next())
            .map(|addr| addr.ip().to_string())
            .unwrap_or_else(|| "127.0.0.1".to_string())
    };

    let addr: SocketAddr = format!("{}:{}", host, config.port)
        .parse()
        .map_err(|e| anyhow::anyhow!("Invalid address: {}", e))?;

    let config = std::sync::Arc::new(config);

    // Build CORS layer - restrict to console origins
    let mut origins: Vec<HeaderValue> = vec![
        format!("http://127.0.0.1:{}", config.port).parse().unwrap(),
        format!("http://localhost:{}", config.port).parse().unwrap(),
        format!("https://127.0.0.1:{}", config.port)
            .parse()
            .unwrap(),
        format!("https://localhost:{}", config.port)
            .parse()
            .unwrap(),
    ];

    // Add configured host origins if different from defaults
    let cors_host = if config.host == "0.0.0.0" {
        "localhost" // 0.0.0.0 is not a valid Origin host; browsers use the resolved name
    } else {
        &config.host
    };
    if cors_host != "localhost" && cors_host != "127.0.0.1" {
        if let Ok(v) = format!("http://{}:{}", cors_host, config.port).parse::<HeaderValue>() {
            origins.push(v);
        }
        if let Ok(v) = format!("https://{}:{}", cors_host, config.port).parse::<HeaderValue>() {
            origins.push(v);
        }
    }
    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::ACCEPT]);

    // Build the router
    let app = Router::new()
        .route("/", get(serve_index))
        .route("/api/config", get(serve_config))
        .route("/{*path}", get(serve_static_or_index))
        .layer(cors)
        .with_state(config);

    info!("Console available at http://{}", addr);

    // Create the listener
    let listener = tokio::net::TcpListener::bind(addr).await?;

    // Start the server
    axum::serve(listener, app).await?;

    Ok(())
}
