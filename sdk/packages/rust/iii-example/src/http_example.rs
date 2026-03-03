use iii_sdk::{ApiRequest, ApiResponse, IIIError, III, execute_traced_request, get_context};
use serde_json::json;

pub fn setup(iii: &III) {
    let client = reqwest::Client::new();

    // GET http-fetch — fetch a todo from JSONPlaceholder (demonstrates OTel fetch instrumentation)
    let get_client = client.clone();
    iii.register_function("api::get::http::rust::fetch", move |_input| {
        let client = get_client.clone();
        async move {
            let ctx = get_context();
            ctx.logger.info("Fetching todo from external API", None);

            let request = client
                .get("https://jsonplaceholder.typicode.com/todos/1")
                .build()
                .map_err(|e| IIIError::Handler(e.to_string()))?;

            let response = execute_traced_request(&client, request)
                .await
                .map_err(|e| IIIError::Handler(e.to_string()))?;

            let status = response.status().as_u16();
            ctx.logger
                .info("Fetched todo successfully", Some(json!({ "status": status })));

            let data: serde_json::Value = response
                .json::<serde_json::Value>()
                .await
                .map_err(|e| IIIError::Handler(e.to_string()))?;

            let api_response = ApiResponse {
                status_code: 200,
                body: json!({ "upstream_status": status, "data": data }),
                headers: [("Content-Type".into(), "application/json".into())].into(),
            };

            Ok(serde_json::to_value(api_response)?)
        }
    });

    iii.register_trigger(
        "http",
        "api::get::http::rust::fetch",
        json!({
            "api_path": "http-fetch",
            "http_method": "GET",
            "description": "Fetch a todo from JSONPlaceholder (demonstrates OTel fetch instrumentation)",
            "metadata": { "tags": ["http-example"] }
        }),
    )
    .expect("failed to register GET http-fetch trigger");

    // POST http-fetch — post to httpbin (demonstrates request body size in OTel spans)
    let post_client = client.clone();
    iii.register_function("api::post::http::rust::fetch", move |input| {
        let client = post_client.clone();
        async move {
            let ctx = get_context();
            let req: ApiRequest = serde_json::from_value(input)
                .unwrap_or_else(|_| serde_json::from_value(json!({})).unwrap());

            ctx.logger
                .info("Posting to httpbin", Some(json!({ "body": req.body })));

            let payload = if req.body.is_null() {
                json!({ "message": "hello from iii rust" })
            } else {
                req.body.clone()
            };

            let request = client
                .post("https://httpbin.org/post")
                .header("Content-Type", "application/json")
                .json(&payload)
                .build()
                .map_err(|e| IIIError::Handler(e.to_string()))?;

            let response = execute_traced_request(&client, request)
                .await
                .map_err(|e| IIIError::Handler(e.to_string()))?;

            let status = response.status().as_u16();
            ctx.logger
                .info("Post completed", Some(json!({ "status": status })));

            let data: serde_json::Value = response
                .json::<serde_json::Value>()
                .await
                .map_err(|e| IIIError::Handler(e.to_string()))?;

            let api_response = ApiResponse {
                status_code: status,
                body: json!({ "upstream_status": status, "data": data }),
                headers: [("Content-Type".into(), "application/json".into())].into(),
            };

            Ok(serde_json::to_value(api_response)?)
        }
    });

    iii.register_trigger(
        "http",
        "api::post::http::rust::fetch",
        json!({
            "api_path": "http-fetch",
            "http_method": "POST",
            "description": "POST to httpbin (demonstrates request body size in OTel spans)",
            "metadata": { "tags": ["http-example"] }
        }),
    )
    .expect("failed to register POST http-fetch trigger");
}
