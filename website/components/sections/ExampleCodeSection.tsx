import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";

const tabs = [
  { id: "ecosystem", label: "Ecosystem" },
  { id: "protocol", label: "Protocol" },
];

const subTabs = {
  ecosystem: [
    { id: "async", label: "TypeScript" },
    { id: "error", label: "Python" },
    { id: "interruption", label: "Rust" },
    { id: "retry", label: "Streams" },
    { id: "concurrency", label: "Context" },
    { id: "sandboxing", label: "Triggers" },
  ],
  protocol: [
    { id: "http", label: "REST API" },
    { id: "mcp", label: "Event" },
    { id: "rpc", label: "Protocol" },
    { id: "grpc", label: "Streams" },
    { id: "cli", label: "Cron" },
    { id: "soap", label: "State" },
    { id: "excel", label: "Observability" },
  ],
};

const codeExamples: Record<
  string,
  { without: string; with: string; description: string; language?: string }
> = {
  // Ecosystem examples - Bridge code in different languages
  async: {
    description:
      "TypeScript SDK: Register functions and invoke them across services with full async support.",
    language: "typescript",
    without: `// Manual WebSocket + message queue setup
import { WebSocket } from 'ws';

const ws = new WebSocket('ws://localhost:8080');
const pending = new Map();
const functions = new Map();

ws.on('message', async (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'invoke') {
    const fn = functions.get(msg.function_path);
    if (fn) {
      const result = await fn(msg.data);
      ws.send(JSON.stringify({
        type: 'result',
        invocation_id: msg.invocation_id,
        result,
      }));
    }
  } else if (msg.type === 'result') {
    const resolve = pending.get(msg.invocation_id);
    if (resolve) resolve(msg.result);
  }
});

// Register and invoke manually...
functions.set('users.create', async (data) => { /*...*/ });`,
    with: `// iii TypeScript SDK - bridge.ts
import { Bridge } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Register a function with automatic context
bridge.registerFunction(
  { function_path: 'users.create' },
  async (input) => {
    const user = await db.users.create(input)
    return { id: user.id, name: user.name }
  }
)

// Invoke functions across services
const result = await bridge.invokeFunction<UserInput, User>(
  'payments.charge',
  { userId: user.id, amount: 100 }
)

// Register triggers for event-driven workflows
bridge.registerTrigger('cron', 'reports.generate', {
  schedule: '0 9 * * *'  // Daily at 9am
})`,
  },
  error: {
    description:
      "Python SDK: Elegant error handling with automatic context propagation and logging.",
    language: "python",
    without: `# Manual async WebSocket handling in Python
import asyncio
import websockets
import json
import uuid

class ManualBridge:
    def __init__(self, url):
        self.url = url
        self.pending = {}
        self.functions = {}
    
    async def connect(self):
        self.ws = await websockets.connect(self.url)
        asyncio.create_task(self._receive_loop())
    
    async def _receive_loop(self):
        async for msg in self.ws:
            data = json.loads(msg)
            if data['type'] == 'invoke':
                fn = self.functions.get(data['function_path'])
                if fn:
                    try:
                        result = await fn(data['data'])
                        await self.ws.send(json.dumps({
                            'type': 'result',
                            'invocation_id': data['invocation_id'],
                            'result': result
                        }))
                    except Exception as e:
                        await self.ws.send(json.dumps({
                            'type': 'result',
                            'error': str(e)
                        }))`,
    with: `# iii Python SDK - bridge.py
from iii import Bridge

bridge = Bridge("ws://engine:8080")

# Decorator-based function registration
@bridge.function("users.sync", description="Sync user to CRM")
async def sync_user(input: dict) -> dict:
    user = await fetch_user(input["user_id"])
    await crm_client.sync(user)
    return {"synced": True, "user_id": user.id}

# Manual registration with error handling
bridge.register_function(
    path="orders.process",
    handler=process_order,
    description="Process incoming orders"
)

# Invoke with automatic timeout and retries
result = await bridge.invoke_function(
    "inventory.reserve",
    {"sku": "ABC123", "quantity": 5},
    timeout=30.0
)

await bridge.connect()`,
  },
  interruption: {
    description:
      "Rust SDK: Type-safe bridge with graceful shutdown and cancellation handling.",
    language: "rust",
    without: `// Manual WebSocket handling in Rust
use tokio_tungstenite::connect_async;
use futures_util::{SinkExt, StreamExt};
use std::collections::HashMap;

struct ManualBridge {
    pending: HashMap<Uuid, oneshot::Sender<Value>>,
    functions: HashMap<String, Box<dyn Fn(Value) -> Value>>,
}

impl ManualBridge {
    async fn connect(&mut self, url: &str) -> Result<(), Error> {
        let (ws, _) = connect_async(url).await?;
        let (mut tx, mut rx) = ws.split();
        
        while let Some(msg) = rx.next().await {
            let data: Message = serde_json::from_str(&msg?)?;
            match data {
                Message::Invoke { id, path, data } => {
                    if let Some(handler) = self.functions.get(&path) {
                        let result = handler(data);
                        tx.send(WsMessage::Text(
                            serde_json::to_string(&result)?
                        )).await?;
                    }
                }
                // More manual handling...
            }
        }
        Ok(())
    }
}`,
    with: `// iii Rust SDK - bridge.rs
use iii::{Bridge, BridgeError};
use serde_json::{json, Value};

let bridge = Bridge::new("ws://engine:8080");

// Register with automatic reconnection
bridge.register_function("orders.validate", |input: Value| {
    async move {
        let order: Order = serde_json::from_value(input)?;
        let valid = validate_order(&order).await?;
        Ok(json!({ "valid": valid, "order_id": order.id }))
    }
});

// Register trigger types for custom integrations
bridge.register_trigger_type(
    "webhook",
    "HTTP webhook trigger",
    WebhookHandler::new(),
);

// Invoke with timeout and error handling
let result = bridge
    .invoke_function_with_timeout(
        "shipping.calculate",
        json!({ "items": items, "destination": addr }),
        Duration::from_secs(10),
    )
    .await?;

bridge.connect().await?;`,
  },
  retry: {
    description: "TypeScript SDK: Streams and state management with automatic persistence.",
    language: "typescript",
    without: `// DIY retry with exponential backoff
async function fetchWithRetry(url, payload, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.status === 429 || res.status >= 500) {
        throw new Error(\`Retryable: \${res.status}\`);
      }
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      
      return await res.json();
    } catch (err) {
      lastError = err;
      const delay = Math.pow(2, attempt) * 1000;
      console.log(\`Retry \${attempt + 1}/\${maxRetries} in \${delay}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}`,
    with: `// iii TypeScript SDK - streams.ts
import { Bridge, MemoryStream } from 'iii'

const bridge = new Bridge('ws://engine:8080')

// Create a typed stream for order processing
const orderStream = new MemoryStream<Order>()

// Register stream operations as functions
bridge.createStream('orders', orderStream)

// Stream operations are now available:
// - streams.get(orders)
// - streams.set(orders) 
// - streams.delete(orders)
// - streams.getGroup(orders)
// - streams.listGroups(orders)

// Use in handlers
bridge.registerFunction(
  { function_path: 'orders.enqueue' },
  async (input) => {
    await orderStream.set(input.orderId, input.order, 'pending')
    return { queued: true }
  }
)`,
  },
  concurrency: {
    description: "Python SDK: Context-aware logging with automatic trace propagation.",
    language: "python",
    without: `# Manual concurrency limiting with p-limit
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent

async function processItems(items) {
  const results = [];
  const errors = [];
  
  const promises = items.map(item =>
    limit(async () => {
      try {
        const res = await fetch('/api/process', {
          method: 'POST',
          body: JSON.stringify(item),
        });
        results.push(await res.json());
      } catch (err) {
        errors.push({ item, error: err });
      }
    })
  );
  
  await Promise.all(promises);
  
  if (errors.length > 0) {
    console.error(\`\${errors.length} items failed\`);
  }
  
  return { results, errors };
}`,
    with: `# iii Python SDK - context & logging
from iii import Bridge
from iii.context import get_context

bridge = Bridge("ws://engine:8080")

@bridge.function("analytics.track")
async def track_event(input: dict) -> dict:
    # Context is automatically propagated
    ctx = get_context()
    
    # Logger includes trace_id and function_path
    ctx.logger.info("Tracking event", extra={
        "event_type": input["type"],
        "user_id": input["user_id"]
    })
    
    await analytics.track(
        event=input["type"],
        properties=input["properties"],
        trace_id=ctx.logger.trace_id  # Distributed tracing
    )
    
    return {"tracked": True}

# Register custom trigger types
bridge.register_trigger_type(
    id="pubsub",
    description="Google Pub/Sub trigger",
    handler=PubSubHandler()
)`,
  },
  sandboxing: {
    description: "Rust SDK: Register custom trigger handlers with type-safe configs.",
    language: "rust",
    without: `// VM2 sandboxing (now deprecated!)
import { VM } from 'vm2';

const vm = new VM({
  timeout: 5000,
  sandbox: {
    fetch: async (url, opts) => {
      // Manually allowlist URLs
      if (!url.startsWith('https://api.trusted.com')) {
        throw new Error('URL not allowed');
      }
      return fetch(url, opts);
    },
  },
  eval: false,
  wasm: false,
});

try {
  const result = vm.run(\`
    (async () => {
      const res = await fetch('/data', { method: 'POST' });
      return res.json();
    })()
  \`);
  return await result;
} catch (err) {
  console.error('Sandbox error:', err);
}`,
    with: `// iii Rust SDK - triggers.rs
use iii::{Bridge, TriggerConfig, TriggerHandler};
use async_trait::async_trait;

pub struct WebhookHandler {
    client: reqwest::Client,
}

#[async_trait]
impl TriggerHandler for WebhookHandler {
    async fn register_trigger(
        &self,
        config: TriggerConfig,
    ) -> Result<(), BridgeError> {
        let webhook_url = config.config
            .get("url")
            .and_then(|v| v.as_str())
            .ok_or(BridgeError::InvalidConfig)?;
        
        // Set up webhook subscription
        self.client
            .post(webhook_url)
            .json(&json!({
                "callback": config.function_path,
                "events": ["order.created", "order.updated"]
            }))
            .send()
            .await?;
        
        tracing::info!(
            trigger_id = %config.id,
            "Webhook trigger registered"
        );
        Ok(())
    }
}`,
  },
  // Protocol examples - iii Adapter code in Rust
  http: {
    description: "REST API Adapter: Hot-reloading HTTP router with automatic function discovery.",
    language: "rust",
    without: `// Manual Axum HTTP server setup
use axum::{Router, routing::post, Json, extract::State};
use std::sync::Arc;
use tokio::sync::RwLock;

struct AppState {
    handlers: HashMap<String, Box<dyn Handler>>,
}

async fn webhook_handler(
    State(state): State<Arc<RwLock<AppState>>>,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    let event = body.get("event").and_then(|v| v.as_str());
    let data = body.get("data");
    
    match (event, data) {
        (Some(e), Some(d)) => {
            let handlers = state.read().await;
            if let Some(handler) = handlers.get(e) {
                match handler.call(d.clone()).await {
                    Ok(result) => Json(json!({ "success": true })),
                    Err(e) => Json(json!({ "error": e.to_string() })),
                }
            } else {
                Json(json!({ "error": "handler not found" }))
            }
        }
        _ => Json(json!({ "error": "invalid payload" })),
    }
}

let app = Router::new()
    .route("/webhook", post(webhook_handler))
    .with_state(state);`,
    with: `// iii REST API Adapter - hot_router.rs
use crate::engine::{Engine, EngineTrait};
use axum::{Router, routing::any, extract::State};

pub struct HotRouter {
    engine: Arc<Engine>,
    routes: Arc<RwLock<HashMap<String, RouteConfig>>>,
}

impl HotRouter {
    pub async fn handle_request(
        &self,
        method: Method,
        path: &str,
        body: Value,
    ) -> Result<Value, ApiError> {
        let routes = self.routes.read().await;
        
        if let Some(config) = routes.get(path) {
            // Invoke registered function through engine
            let result = self.engine
                .invoke_function(&config.function_path, body)
                .await?;
            
            tracing::info!(
                path = %path,
                function = %config.function_path,
                "Request handled"
            );
            
            Ok(result)
        } else {
            Err(ApiError::NotFound)
        }
    }
    
    // Routes update automatically when functions register
    pub async fn on_function_registered(&self, msg: &RegisterFunctionMessage) {
        if let Some(api_config) = &msg.metadata {
            let mut routes = self.routes.write().await;
            routes.insert(api_config.path.clone(), config);
        }
    }
}`,
  },
  mcp: {
    description: "Event Adapter: Redis pub/sub with automatic subscription management.",
    language: "rust",
    without: `// Manual Redis pub/sub in Rust
use redis::{Client, AsyncCommands, aio::ConnectionManager};
use tokio::sync::mpsc;

struct ManualPubSub {
    publisher: ConnectionManager,
    subscriber: Client,
}

impl ManualPubSub {
    async fn subscribe(&self, topic: &str) -> mpsc::Receiver<String> {
        let (tx, rx) = mpsc::channel(100);
        let client = self.subscriber.clone();
        let topic = topic.to_string();
        
        tokio::spawn(async move {
            let mut pubsub = client.get_async_pubsub().await.unwrap();
            pubsub.subscribe(&topic).await.unwrap();
            
            let mut stream = pubsub.into_on_message();
            while let Some(msg) = stream.next().await {
                let payload: String = msg.get_payload().unwrap();
                if tx.send(payload).await.is_err() {
                    break;
                }
            }
        });
        rx
    }
    
    async fn publish(&self, topic: &str, data: &str) -> Result<()> {
        let mut conn = self.publisher.clone();
        conn.publish(topic, data).await?;
        Ok(())
    }
}`,
    with: `// iii Event Adapter - redis_adapter.rs
use crate::modules::event::EventAdapter;
use async_trait::async_trait;

pub struct RedisAdapter {
    publisher: Arc<Mutex<ConnectionManager>>,
    subscriber: Arc<Client>,
    subscriptions: Arc<RwLock<HashMap<String, SubscriptionInfo>>>,
    engine: Arc<Engine>,
}

#[async_trait]
impl EventAdapter for RedisAdapter {
    async fn emit(&self, topic: &str, event_data: Value) {
        let event_json = serde_json::to_string(&event_data)?;
        let mut conn = self.publisher.lock().await;
        conn.publish::<_, _, ()>(topic, &event_json).await?;
        
        tracing::debug!(topic = %topic, "Event emitted");
    }

    async fn subscribe(&self, topic: &str, id: &str, function_path: &str) {
        let engine = Arc::clone(&self.engine);
        
        tokio::spawn(async move {
            let mut pubsub = subscriber.get_async_pubsub().await?;
            pubsub.subscribe(topic).await?;
            
            while let Some(msg) = pubsub.into_on_message().next().await {
                let data: Value = serde_json::from_str(&msg.get_payload()?)?;
                
                // Invoke function through engine
                engine.invoke_function(function_path, data).await;
            }
        });
    }
}

// Auto-register with the adapter registry
crate::register_adapter!(<EventAdapterRegistration> 
    "modules::event::RedisAdapter", make_adapter);`,
  },
  rpc: {
    description: "Bridge Protocol: Type-safe WebSocket messages for cross-service invocation.",
    language: "rust",
    without: `// Manual WebSocket message handling
use serde::{Deserialize, Serialize};
use tokio_tungstenite::tungstenite::Message;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
enum WsMessage {
    #[serde(rename = "invoke")]
    Invoke { id: String, path: String, data: Value },
    #[serde(rename = "result")]  
    Result { id: String, result: Option<Value>, error: Option<String> },
    #[serde(rename = "register")]
    Register { path: String, description: Option<String> },
}

async fn handle_message(msg: Message, state: &mut State) -> Option<Message> {
    let text = msg.into_text().ok()?;
    let parsed: WsMessage = serde_json::from_str(&text).ok()?;
    
    match parsed {
        WsMessage::Invoke { id, path, data } => {
            if let Some(handler) = state.handlers.get(&path) {
                match handler(data).await {
                    Ok(result) => Some(Message::Text(
                        serde_json::to_string(&WsMessage::Result {
                            id, result: Some(result), error: None
                        }).ok()?
                    )),
                    Err(e) => Some(Message::Text(
                        serde_json::to_string(&WsMessage::Result {
                            id, result: None, error: Some(e.to_string())
                        }).ok()?
                    )),
                }
            } else { None }
        }
        _ => None,
    }
}`,
    with: `// iii Bridge Protocol - protocol.rs
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Message {
    RegisterFunction(RegisterFunctionMessage),
    RegisterTriggerType(RegisterTriggerTypeMessage),
    RegisterTrigger(RegisterTriggerMessage),
    RegisterService(RegisterServiceMessage),
    
    InvokeFunction {
        invocation_id: Option<Uuid>,
        function_path: String,
        data: Value,
    },
    InvocationResult {
        invocation_id: Uuid,
        function_path: String,
        result: Option<Value>,
        error: Option<ErrorBody>,
    },
    
    ListFunctions,
    FunctionsAvailable { functions: Vec<FunctionMessage> },
    
    Ping,
    Pong,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterFunctionMessage {
    pub function_path: String,
    pub description: Option<String>,
    pub request_format: Option<String>,
    pub response_format: Option<String>,
    pub metadata: Option<Value>,
}`,
  },
  grpc: {
    description: "Stream Adapter: Real-time data streaming with connection management.",
    language: "rust",
    without: `// gRPC server with @grpc/grpc-js
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDef = protoLoader.loadSync('./service.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(proto.UserService.service, {
  createUser: async (call, callback) => {
    try {
      const { name, email } = call.request;
      
      if (!name || !email) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Name and email required',
        });
      }
      
      const user = await createUser(name, email);
      callback(null, user);
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: err.message,
      });
    }
  },
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});`,
    with: `// iii Stream Adapter - redis_adapter.rs
use crate::modules::streams::{StreamAdapter, StreamEntry};
use async_trait::async_trait;

pub struct RedisStreamAdapter {
    connection: Arc<Mutex<ConnectionManager>>,
    engine: Arc<Engine>,
}

#[async_trait]
impl StreamAdapter for RedisStreamAdapter {
    async fn get(&self, stream: &str, key: &str) -> Option<StreamEntry> {
        let mut conn = self.connection.lock().await;
        let data: Option<String> = conn
            .hget(format!("stream:{}:{}", stream, key), "data")
            .await.ok()?;
        
        data.map(|d| StreamEntry {
            key: key.to_string(),
            data: serde_json::from_str(&d).ok()?,
            group: conn.hget(/* ... */).await.ok()?,
        })
    }

    async fn set(&self, stream: &str, key: &str, data: Value, group: Option<&str>) {
        let mut conn = self.connection.lock().await;
        let hash_key = format!("stream:{}:{}", stream, key);
        
        conn.hset(&hash_key, "data", serde_json::to_string(&data)?).await?;
        if let Some(g) = group {
            conn.hset(&hash_key, "group", g).await?;
            conn.sadd(format!("stream:{}:groups:{}", stream, g), key).await?;
        }
        
        tracing::debug!(stream = %stream, key = %key, "Stream entry set");
    }
}`,
  },
  cli: {
    description: "Cron Adapter: Distributed scheduling with Redis-based locking.",
    language: "rust",
    without: `// Manual distributed cron with Redis locks
use redis::{AsyncCommands, Client};
use tokio_cron_scheduler::{Job, JobScheduler};

struct DistributedCron {
    redis: ConnectionManager,
    instance_id: String,
}

impl DistributedCron {
    async fn try_acquire_lock(&self, job_id: &str) -> bool {
        let lock_key = format!("cron_lock:{}", job_id);
        
        // SET NX with expiry
        let result: Option<String> = redis::cmd("SET")
            .arg(&lock_key)
            .arg(&self.instance_id)
            .arg("NX")
            .arg("PX")
            .arg(30000) // 30 second TTL
            .query_async(&mut self.redis.clone())
            .await
            .ok()?;
        
        result.is_some()
    }
    
    async fn release_lock(&self, job_id: &str) {
        let script = r#"
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            end
            return 0
        "#;
        // Execute Lua script for atomic check-and-delete
        redis::Script::new(script)
            .key(format!("cron_lock:{}", job_id))
            .arg(&self.instance_id)
            .invoke_async(&mut self.redis.clone())
            .await
            .ok();
    }
}`,
    with: `// iii Cron Adapter - redis_adapter.rs
use crate::modules::cron::CronSchedulerAdapter;
use async_trait::async_trait;

const CRON_LOCK_TTL_MS: u64 = 30_000;
const CRON_LOCK_PREFIX: &str = "cron_lock:";

pub struct RedisCronLock {
    connection: Arc<Mutex<ConnectionManager>>,
    instance_id: String,
}

#[async_trait]
impl CronSchedulerAdapter for RedisCronLock {
    async fn try_acquire_lock(&self, job_id: &str) -> bool {
        let lock_key = format!("{}{}", CRON_LOCK_PREFIX, job_id);
        let mut conn = self.connection.lock().await;

        let result: Option<String> = redis::cmd("SET")
            .arg(&lock_key)
            .arg(&self.instance_id)
            .arg("NX")
            .arg("PX")
            .arg(CRON_LOCK_TTL_MS)
            .query_async(&mut *conn)
            .await
            .ok()
            .flatten();

        match result {
            Some(_) => {
                tracing::debug!(job_id = %job_id, "Acquired cron lock");
                true
            }
            None => false,
        }
    }

    async fn release_lock(&self, job_id: &str) {
        let script = r#"
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            end
            return 0
        "#;
        
        redis::Script::new(script)
            .key(format!("{}{}", CRON_LOCK_PREFIX, job_id))
            .arg(&self.instance_id)
            .invoke_async(&mut *self.connection.lock().await)
            .await
            .ok();
    }
}

crate::register_adapter!(<CronAdapterRegistration>
    "modules::cron::RedisCronAdapter", make_adapter);`,
  },
  soap: {
    description: "State Adapter: Persistent key-value state with group management.",
    language: "rust",
    without: `// Manual Redis state management
use redis::{AsyncCommands, Client};
use std::collections::HashMap;

struct StateManager {
    redis: ConnectionManager,
}

impl StateManager {
    async fn get(&self, workflow_id: &str, key: &str) -> Option<Value> {
        let hash_key = format!("state:{}:{}", workflow_id, key);
        let data: Option<String> = self.redis
            .hget(&hash_key, "value")
            .await
            .ok()?;
        
        data.and_then(|d| serde_json::from_str(&d).ok())
    }
    
    async fn set(&self, workflow_id: &str, key: &str, value: Value) {
        let hash_key = format!("state:{}:{}", workflow_id, key);
        let json = serde_json::to_string(&value).unwrap();
        
        let _: () = self.redis
            .hset(&hash_key, "value", &json)
            .await
            .unwrap();
    }
    
    async fn delete(&self, workflow_id: &str, key: &str) {
        let hash_key = format!("state:{}:{}", workflow_id, key);
        let _: () = self.redis.del(&hash_key).await.unwrap();
    }
    
    async fn clear(&self, workflow_id: &str) {
        // Scan and delete all keys matching pattern...
    }
}`,
    with: `// iii State Adapter - redis_adapter.rs
use crate::modules::state::{StateAdapter, StateEntry};
use async_trait::async_trait;

pub struct RedisStateAdapter {
    connection: Arc<Mutex<ConnectionManager>>,
}

#[async_trait]
impl StateAdapter for RedisStateAdapter {
    async fn get(&self, workflow_id: &str, key: &str) -> Option<StateEntry> {
        let mut conn = self.connection.lock().await;
        let hash_key = format!("state:{}:{}", workflow_id, key);
        
        let value: Option<String> = conn.hget(&hash_key, "value").await.ok()?;
        let trace_id: Option<String> = conn.hget(&hash_key, "trace_id").await.ok();
        
        value.map(|v| StateEntry {
            key: key.to_string(),
            value: serde_json::from_str(&v).ok()?,
            trace_id,
        })
    }

    async fn set(&self, workflow_id: &str, key: &str, value: Value, trace_id: Option<&str>) {
        let mut conn = self.connection.lock().await;
        let hash_key = format!("state:{}:{}", workflow_id, key);
        
        let json = serde_json::to_string(&value)?;
        conn.hset(&hash_key, "value", &json).await?;
        
        if let Some(tid) = trace_id {
            conn.hset(&hash_key, "trace_id", tid).await?;
        }
        
        // Add to workflow's key set for listing
        conn.sadd(format!("state:{}:keys", workflow_id), key).await?;
        
        tracing::debug!(workflow_id = %workflow_id, key = %key, "State set");
    }

    async fn delete(&self, workflow_id: &str, key: &str) {
        let mut conn = self.connection.lock().await;
        conn.del(format!("state:{}:{}", workflow_id, key)).await?;
        conn.srem(format!("state:{}:keys", workflow_id), key).await?;
    }
}`,
  },
  excel: {
    description: "Observability Adapter: Structured logging with trace correlation.",
    language: "rust",
    without: `// Manual logging with tracing
use tracing::{info, warn, error, span, Level};
use tracing_subscriber::fmt;

fn setup_logging() {
    tracing_subscriber::fmt()
        .with_max_level(Level::DEBUG)
        .with_target(true)
        .json()
        .init();
}

async fn handle_request(req: Request) {
    let span = span!(Level::INFO, "request", 
        trace_id = %req.trace_id,
        path = %req.path
    );
    let _guard = span.enter();
    
    info!("Processing request");
    
    match process(req).await {
        Ok(result) => {
            info!(result = ?result, "Request completed");
        }
        Err(e) => {
            error!(error = %e, "Request failed");
        }
    }
}`,
    with: `// iii Observability Adapter - redis_logger.rs
use crate::modules::observability::LogAdapter;
use async_trait::async_trait;

pub struct RedisLogAdapter {
    connection: Arc<Mutex<ConnectionManager>>,
    buffer: Arc<Mutex<Vec<LogEntry>>>,
}

#[async_trait]
impl LogAdapter for RedisLogAdapter {
    async fn log(&self, entry: LogEntry) {
        let mut buffer = self.buffer.lock().await;
        buffer.push(entry.clone());
        
        // Flush when buffer is full
        if buffer.len() >= 100 {
            self.flush_buffer(&mut buffer).await;
        }
    }

    async fn flush(&self) {
        let mut buffer = self.buffer.lock().await;
        self.flush_buffer(&mut buffer).await;
    }
}

impl RedisLogAdapter {
    async fn flush_buffer(&self, buffer: &mut Vec<LogEntry>) {
        if buffer.is_empty() { return; }
        
        let mut conn = self.connection.lock().await;
        let entries: Vec<String> = buffer
            .drain(..)
            .filter_map(|e| serde_json::to_string(&e).ok())
            .collect();
        
        // Push to Redis stream for real-time tailing
        for entry in entries {
            conn.xadd("logs:stream", "*", &[("data", &entry)]).await?;
        }
        
        tracing::debug!(count = buffer.len(), "Logs flushed to Redis");
    }
}

crate::register_adapter!(<LogAdapterRegistration>
    "modules::observability::RedisLogAdapter", make_adapter);`,
  },
};

function CodeBlock({
  code,
  variant,
  isDarkMode,
  language = "tsx",
}: {
  code: string;
  variant: "without" | "with";
  isDarkMode: boolean;
  language?: string;
}) {
  return (
    <div
      className={`rounded-lg sm:rounded-xl overflow-hidden border h-full flex flex-col transition-colors duration-300 min-h-[200px] max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh] ${
        isDarkMode
          ? "border-iii-dark bg-iii-black"
          : "border-iii-medium/30 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b transition-colors duration-300 flex-shrink-0 ${
          isDarkMode
            ? "border-iii-dark bg-iii-dark/50"
            : "border-iii-medium/20 bg-iii-light/50"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            variant === "with"
              ? isDarkMode
                ? "bg-iii-accent"
                : "bg-iii-accent-light"
              : "bg-red-500"
          }`}
        />
        <span
          className={`text-xs sm:text-sm transition-colors duration-300 ${
            isDarkMode ? "text-iii-medium" : "text-iii-medium"
          }`}
        >
          {variant === "with" ? "With iii" : "Without iii"}
        </span>
      </div>
      <div className="p-2 sm:p-3 md:p-4 overflow-auto flex-1">
        <Highlight
          theme={isDarkMode ? themes.nightOwl : themes.github}
          code={code.trim()}
          language={language as any}
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-mono leading-relaxed overflow-x-auto">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="whitespace-pre">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

interface ExampleCodeSectionProps {
  isDarkMode?: boolean;
}

export function ExampleCodeSection({
  isDarkMode = true,
}: ExampleCodeSectionProps) {
  const [activeTab, setActiveTab] = useState<"ecosystem" | "protocol">(
    "ecosystem"
  );
  const [activeSubTab, setActiveSubTab] = useState("async");

  const currentSubTabs = subTabs[activeTab];
  const currentExample = codeExamples[activeSubTab];

  const handleTabChange = (tab: "ecosystem" | "protocol") => {
    setActiveTab(tab);
    setActiveSubTab(subTabs[tab][0].id);
  };

  return (
    <section
      className={`relative py-8 sm:py-12 md:py-16 lg:py-24 overflow-hidden font-mono transition-colors duration-300 ${
        isDarkMode ? "text-iii-light" : "text-iii-black"
      }`}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 space-y-2 sm:space-y-3 md:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter">
            Let's see some{" "}
            <span
              className={`bg-clip-text text-transparent ${
                isDarkMode ? "bg-iii-accent" : "bg-iii-accent-light "
              }`}
            >
              code
            </span>
          </h2>
          <p className="text-iii-medium text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-2">
            This is how application code is when it's backed by iii. Notice
            anything?
          </p>
        </div>

        {/* Main tabs */}
        <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
          <div
            className={`inline-flex rounded-lg border p-0.5 sm:p-1 transition-colors duration-300 ${
              isDarkMode
                ? "border-iii-dark bg-iii-dark/50"
                : "border-iii-medium/30 bg-white/50"
            }`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  handleTabChange(tab.id as "ecosystem" | "protocol")
                }
                className={`px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? "bg-iii-light text-iii-black"
                      : "bg-iii-black text-iii-light"
                    : isDarkMode
                    ? "text-iii-medium hover:text-iii-light"
                    : "text-iii-medium hover:text-iii-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub tabs - scrollable on mobile */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex overflow-x-auto scrollbar-hide pb-2 justify-center">
            <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center px-2">
            {currentSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                  className={`px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs md:text-sm transition-colors whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? isDarkMode
                      ? "bg-iii-dark text-iii-light"
                      : "bg-iii-medium/20 text-iii-black"
                    : isDarkMode
                    ? "text-iii-medium hover:text-iii-light"
                    : "text-iii-medium hover:text-iii-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {currentExample && (
          <div className="min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] mb-3 sm:mb-4 md:mb-6 max-w-xl mx-auto flex items-center justify-center px-2">
            <p className="text-center text-iii-medium line-clamp-3 text-[10px] sm:text-xs md:text-sm leading-4 sm:leading-5 md:leading-6">
              {currentExample.description}
            </p>
          </div>
        )}

        {/* Code comparison - stack on mobile and tablet, side-by-side on large screens */}
        {currentExample && (
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6">
            <div className="flex-1 min-w-0">
            <CodeBlock
              code={currentExample.without}
              variant="without"
              isDarkMode={isDarkMode}
              language={currentExample.language}
            />
            </div>
            <div className="flex-1 min-w-0">
            <CodeBlock
              code={currentExample.with}
              variant="with"
              isDarkMode={isDarkMode}
              language={currentExample.language}
            />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
