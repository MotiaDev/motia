# Function Queue Consumer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor queue adapters to be transport-only and move consumer logic into QueueCoreModule, so function queues work with any adapter (builtin, RabbitMQ, Redis) by simply swapping config.

**Architecture:** Adapters become pure transport (setup, publish, consume, ack, nack). QueueCoreModule owns one consumer loop per function queue, receives QueueMessage from adapter via async channel, calls engine.call(), and decides ack/nack based on result and retry config. Swapping adapter in YAML changes only transport — consumer loop, function invocation, retry logic, and tracing stay the same.

**Tech Stack:** Rust, tokio, async_trait, lapin (RabbitMQ), serde_json

---

### Task 1: Rename NamedQueueConfig → FunctionQueueConfig

**Files:**
- Modify: `engine/src/modules/queue/config.rs`
- Modify: `engine/src/modules/queue/mod.rs`
- Modify: `engine/src/modules/queue/queue.rs`
- Modify: `engine/src/modules/queue/adapters/builtin/adapter.rs`
- Modify: `engine/src/modules/queue/adapters/rabbitmq/adapter.rs`
- Modify: `engine/src/modules/queue/adapters/redis_adapter.rs`
- Modify: `engine/src/modules/queue/adapters/bridge.rs`

**Step 1: Rename the struct in config.rs**

In `config.rs`, rename `NamedQueueConfig` to `FunctionQueueConfig` everywhere:
- Line 39: `pub struct NamedQueueConfig` → `pub struct FunctionQueueConfig`
- Line 59: `impl Default for NamedQueueConfig` → `impl Default for FunctionQueueConfig`

**Step 2: Update mod.rs re-export**

In `mod.rs` line 16:
```rust
pub use self::config::FunctionQueueConfig;
```

**Step 3: Update all imports and usages across adapters and queue.rs**

Replace `NamedQueueConfig` with `FunctionQueueConfig` in:
- `queue.rs`: import, method signature for `start_named_queue`, test helpers
- `mod.rs`: trait method `start_named_queue` signature
- `adapters/builtin/adapter.rs`: import and `start_named_queue` signature
- `adapters/rabbitmq/adapter.rs`: import and `start_named_queue` signature
- `adapters/redis_adapter.rs`: import and `start_named_queue` signature
- `adapters/bridge.rs`: import and `start_named_queue` signature

**Step 4: Rename methods named_queue → function_queue**

Replace throughout:
- `enqueue_to_named_queue` → `enqueue_to_function_queue` (in queue.rs, both the method and the QueueEnqueuer trait impl)
- `start_named_queue` → `start_function_queue` (trait + all adapters)
- `stop_named_queue` → `stop_function_queue` (trait + all adapters)
- `enqueue_to_queue` → `publish_to_function_queue` (trait + all adapters)

Also update `QueueEnqueuer` trait in `engine/src/engine/mod.rs` if it references `enqueue_to_named_queue`.

**Step 5: Run tests to verify rename is clean**

Run: `cargo test -p iii-engine --lib -- queue`
Expected: All 59+ queue tests pass

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: rename named_queue to function_queue throughout queue module"
```

---

### Task 2: Define QueueMessage struct

**Files:**
- Create: `engine/src/modules/queue/message.rs`
- Modify: `engine/src/modules/queue/mod.rs`

**Step 1: Write the test**

Create `engine/src/modules/queue/message.rs`:

```rust
use serde_json::Value;

/// Common message abstraction between adapter and consumer loop.
/// Adapters translate their native message format into this struct.
pub struct QueueMessage {
    /// Adapter-specific tag for ack/nack (e.g., RabbitMQ delivery tag)
    pub delivery_id: u64,
    /// The function to invoke
    pub function_id: String,
    /// The payload to pass to the function
    pub data: Value,
    /// Current attempt number (derived from transport-native retry count)
    pub attempt: u32,
    /// W3C traceparent header for distributed tracing
    pub traceparent: Option<String>,
    /// W3C baggage header for context propagation
    pub baggage: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn queue_message_fields_accessible() {
        let msg = QueueMessage {
            delivery_id: 42,
            function_id: "functions.process_order".to_string(),
            data: json!({"order_id": "o-1"}),
            attempt: 0,
            traceparent: Some("00-abc-def-01".to_string()),
            baggage: Some("queue=orders".to_string()),
        };

        assert_eq!(msg.delivery_id, 42);
        assert_eq!(msg.function_id, "functions.process_order");
        assert_eq!(msg.data["order_id"], "o-1");
        assert_eq!(msg.attempt, 0);
        assert!(msg.traceparent.is_some());
        assert!(msg.baggage.is_some());
    }

    #[test]
    fn queue_message_optional_tracing_fields() {
        let msg = QueueMessage {
            delivery_id: 1,
            function_id: "fn".to_string(),
            data: json!(null),
            attempt: 3,
            traceparent: None,
            baggage: None,
        };

        assert!(msg.traceparent.is_none());
        assert!(msg.baggage.is_none());
        assert_eq!(msg.attempt, 3);
    }
}
```

**Step 2: Register the module in mod.rs**

Add to `mod.rs`:
```rust
mod message;
pub use self::message::QueueMessage;
```

**Step 3: Run test to verify**

Run: `cargo test -p iii-engine --lib -- queue::message`
Expected: 2 tests pass

**Step 4: Commit**

```bash
git add engine/src/modules/queue/message.rs engine/src/modules/queue/mod.rs
git commit -m "feat: add QueueMessage struct for adapter-consumer abstraction"
```

---

### Task 3: Extend QueueAdapter trait with transport-only methods

**Files:**
- Modify: `engine/src/modules/queue/mod.rs`

**Step 1: Add new transport methods to the QueueAdapter trait**

Add these methods to the trait with default `unimplemented!()` bodies so existing adapters compile:

```rust
use tokio::sync::mpsc;

#[async_trait::async_trait]
pub trait QueueAdapter: Send + Sync + 'static {
    // ... existing methods ...

    /// Set up transport topology for a function queue (exchanges, queues, bindings).
    /// Called once per queue during initialization.
    async fn setup_function_queue(
        &self,
        _queue_name: &str,
        _config: &FunctionQueueConfig,
    ) -> anyhow::Result<()> {
        Ok(()) // no-op by default (schemaless stores like builtin)
    }

    /// Start consuming from a function queue. Returns a receiver that yields QueueMessages.
    /// The adapter spawns an internal task that forwards messages into the channel.
    async fn consume_function_queue(
        &self,
        _queue_name: &str,
        _prefetch: u32,
    ) -> anyhow::Result<mpsc::Receiver<QueueMessage>> {
        unimplemented!("consume_function_queue not implemented for this adapter")
    }

    /// Acknowledge successful processing of a message.
    async fn ack_function_queue(&self, _queue_name: &str, _delivery_id: u64) -> anyhow::Result<()> {
        Ok(()) // no-op by default
    }

    /// Negative-acknowledge a message. If requeue=false, adapter routes to retry/DLQ.
    async fn nack_function_queue(
        &self,
        _queue_name: &str,
        _delivery_id: u64,
        _requeue: bool,
    ) -> anyhow::Result<()> {
        Ok(()) // no-op by default
    }
}
```

**Step 2: Run tests to verify compilation**

Run: `cargo test -p iii-engine --lib -- queue`
Expected: All existing tests pass (new methods have defaults)

**Step 3: Commit**

```bash
git add engine/src/modules/queue/mod.rs
git commit -m "feat: add transport-only methods to QueueAdapter trait"
```

---

### Task 4: Implement builtin adapter transport methods

**Files:**
- Modify: `engine/src/modules/queue/adapters/builtin/adapter.rs`

The builtin adapter currently uses `BuiltinQueue` for everything. For the new transport contract, we implement consume/ack/nack over the same KV store, but without engine references.

**Step 1: Write the test for consume_function_queue**

Add to `adapters/builtin/adapter.rs` tests:

```rust
#[tokio::test]
async fn consume_function_queue_receives_published_messages() {
    let engine = Arc::new(Engine::new());
    let adapter = make_adapter(Arc::clone(&engine));

    // Setup (no-op for builtin) + start consuming
    let config = crate::modules::queue::FunctionQueueConfig::default();
    adapter.setup_function_queue("test-q", &config).await.unwrap();

    let mut receiver = adapter.consume_function_queue("test-q", 10).await.unwrap();

    // Publish a message
    adapter.publish_to_function_queue(
        "test-q", "fn.handler", json!({"key": "val"}),
        3, 1000, None, None,
    ).await;

    // Should receive it
    let msg = tokio::time::timeout(
        std::time::Duration::from_secs(2),
        receiver.recv(),
    ).await.expect("timeout").expect("channel closed");

    assert_eq!(msg.function_id, "fn.handler");
    assert_eq!(msg.data["key"], "val");
    assert_eq!(msg.attempt, 0);

    // Ack should succeed
    adapter.ack_function_queue("test-q", msg.delivery_id).await.unwrap();
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test -p iii-engine --lib -- builtin::tests::consume_function_queue`
Expected: FAIL (not yet implemented)

**Step 3: Implement consume_function_queue for builtin adapter**

The builtin adapter needs to:
1. Maintain a `HashMap<String, mpsc::Sender<QueueMessage>>` for active consumer channels
2. `consume_function_queue`: create a channel, store the sender, spawn a polling loop that pops jobs from the KV store and sends them into the channel
3. `publish_to_function_queue`: push a Job to the KV store (existing logic), which the polling loop picks up
4. `ack_function_queue`: remove the job from the active set in KV store
5. `nack_function_queue`: if requeue=false, increment attempt and schedule retry with backoff delay

Implementation approach — add a new `fn_queue_consumers` field to `BuiltinQueueAdapter`:

```rust
pub struct BuiltinQueueAdapter {
    queue: Arc<BuiltinQueue>,
    engine: Arc<Engine>,
    subscriptions: Arc<RwLock<HashMap<String, SubscriptionHandle>>>,
    fn_queue_senders: Arc<RwLock<HashMap<String, mpsc::Sender<QueueMessage>>>>,
}
```

For `consume_function_queue`:
```rust
async fn consume_function_queue(
    &self,
    queue_name: &str,
    prefetch: u32,
) -> anyhow::Result<mpsc::Receiver<QueueMessage>> {
    let (tx, rx) = mpsc::channel(prefetch as usize);
    let queue_name = queue_name.to_string();
    let queue = Arc::clone(&self.queue);

    // Store sender for tracking
    self.fn_queue_senders.write().await.insert(queue_name.clone(), tx.clone());

    // Spawn polling loop
    tokio::spawn(async move {
        let mut delivery_counter: u64 = 0;
        loop {
            if tx.is_closed() {
                break;
            }
            if let Some(job) = queue.pop_waiting_job(&queue_name).await {
                delivery_counter += 1;
                let msg = QueueMessage {
                    delivery_id: delivery_counter,
                    function_id: job.function_id.unwrap_or_default(),
                    data: job.data,
                    attempt: job.attempts_made,
                    traceparent: job.traceparent,
                    baggage: job.baggage,
                };
                if tx.send(msg).await.is_err() {
                    break;
                }
            } else {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
        }
    });

    Ok(rx)
}
```

Note: The exact `pop_waiting_job` method name depends on what `BuiltinQueue` exposes. Check `builtins/queue.rs` for the actual API. The polling loop may need to use the existing `queue.pop_job` or similar method.

**Step 4: Run test to verify it passes**

Run: `cargo test -p iii-engine --lib -- builtin::tests::consume_function_queue`
Expected: PASS

**Step 5: Commit**

```bash
git add engine/src/modules/queue/adapters/builtin/adapter.rs
git commit -m "feat: implement consume/ack/nack transport methods for builtin adapter"
```

---

### Task 5: Add consumer loop to QueueCoreModule

**Files:**
- Modify: `engine/src/modules/queue/queue.rs`

This is the core of the refactoring. The consumer loop in `QueueCoreModule::initialize()` replaces the per-adapter `start_function_queue` call.

**Step 1: Write a test for the consumer loop**

Add to `queue.rs` tests. This requires enhancing `MockQueueAdapter` to support `consume_function_queue`:

```rust
use tokio::sync::mpsc;
use std::sync::Mutex as StdMutex;

struct MockTransportAdapter {
    // ... existing mock fields ...
    consume_receivers: StdMutex<HashMap<String, mpsc::Receiver<QueueMessage>>>,
    consume_senders: StdMutex<HashMap<String, mpsc::Sender<QueueMessage>>>,
}

impl MockTransportAdapter {
    fn new() -> Self {
        Self {
            // ... existing ...
            consume_receivers: StdMutex::new(HashMap::new()),
            consume_senders: StdMutex::new(HashMap::new()),
        }
    }

    /// Inject a message into the consumer channel for testing
    async fn inject_message(&self, queue_name: &str, msg: QueueMessage) {
        let senders = self.consume_senders.lock().unwrap();
        if let Some(tx) = senders.get(queue_name) {
            tx.send(msg).await.ok();
        }
    }
}

#[async_trait::async_trait]
impl QueueAdapter for MockTransportAdapter {
    // ... existing methods ...

    async fn consume_function_queue(
        &self,
        queue_name: &str,
        prefetch: u32,
    ) -> anyhow::Result<mpsc::Receiver<QueueMessage>> {
        let (tx, rx) = mpsc::channel(prefetch as usize);
        self.consume_senders.lock().unwrap().insert(queue_name.to_string(), tx);
        Ok(rx)
    }

    async fn ack_function_queue(&self, _queue_name: &str, _delivery_id: u64) -> anyhow::Result<()> {
        self.ack_count.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }

    async fn nack_function_queue(&self, _queue_name: &str, _delivery_id: u64, _requeue: bool) -> anyhow::Result<()> {
        self.nack_count.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }
}
```

Test the consumer loop:

```rust
#[tokio::test]
async fn consumer_loop_calls_engine_and_acks_on_success() {
    let engine = Arc::new(Engine::new());
    register_test_function(&engine, "fn.process", true);

    let adapter = Arc::new(MockTransportAdapter::new());
    let mut queue_configs = HashMap::new();
    queue_configs.insert("orders".to_string(), FunctionQueueConfig::default());

    let module = QueueCoreModule {
        adapter: adapter.clone(),
        engine: engine.clone(),
        _config: QueueModuleConfig { adapter: None, queue_configs },
    };

    // Initialize starts consumer loops
    module.initialize().await.unwrap();

    // Inject a message
    adapter.inject_message("orders", QueueMessage {
        delivery_id: 1,
        function_id: "fn.process".to_string(),
        data: json!({"order_id": "o-1"}),
        attempt: 0,
        traceparent: None,
        baggage: None,
    }).await;

    // Wait for processing
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;

    assert_eq!(adapter.ack_count.load(Ordering::SeqCst), 1);
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test -p iii-engine --lib -- queue::tests::consumer_loop_calls_engine`
Expected: FAIL

**Step 3: Implement the consumer loop in initialize()**

Replace the `start_function_queue` call in `initialize()` with the consumer loop:

```rust
async fn initialize(&self) -> anyhow::Result<()> {
    tracing::info!("Initializing QueueModule");
    self._config.validate()?;
    self.engine.set_queue_module(Arc::new(self.clone())).await;

    // Start a consumer loop for each function queue
    for (name, config) in &self._config.queue_configs {
        // Setup topology (adapter-specific, e.g., RabbitMQ declares exchanges)
        self.adapter.setup_function_queue(name, config).await?;

        let prefetch = if config.r#type == "fifo" { 1 } else { config.concurrency };
        let mut receiver = self.adapter.consume_function_queue(name, prefetch).await?;

        let adapter = self.adapter.clone();
        let engine = self.engine.clone();
        let queue_name = name.clone();
        let max_retries = config.max_retries;

        let semaphore = Arc::new(tokio::sync::Semaphore::new(prefetch as usize));

        tokio::spawn(async move {
            while let Some(msg) = receiver.recv().await {
                let adapter = adapter.clone();
                let engine = engine.clone();
                let queue_name = queue_name.clone();
                let semaphore = semaphore.clone();

                let permit = semaphore.acquire_owned().await;
                if permit.is_err() {
                    break;
                }
                let permit = permit.unwrap();

                tokio::spawn(async move {
                    let delivery_id = msg.delivery_id;
                    let function_id = msg.function_id.clone();

                    let span = tracing::info_span!(
                        "fn_queue_job",
                        otel.name = %format!("fn_queue {}", queue_name),
                        function_id = %function_id,
                        queue = %queue_name,
                        attempt = %msg.attempt,
                        delivery_id = %delivery_id,
                    );

                    // TODO: restore parent tracing from msg.traceparent/baggage

                    let result = async {
                        engine.call(&function_id, msg.data).await
                    }
                    .instrument(span)
                    .await;

                    match result {
                        Ok(_) => {
                            if let Err(e) = adapter.ack_function_queue(&queue_name, delivery_id).await {
                                tracing::error!(error = %e, "Failed to ack message");
                            }
                        }
                        Err(_) if msg.attempt < max_retries => {
                            if let Err(e) = adapter.nack_function_queue(&queue_name, delivery_id, false).await {
                                tracing::error!(error = %e, "Failed to nack message");
                            }
                        }
                        Err(_) => {
                            // Exhausted retries — ack so it goes to DLQ
                            if let Err(e) = adapter.ack_function_queue(&queue_name, delivery_id).await {
                                tracing::error!(error = %e, "Failed to ack exhausted message");
                            }
                        }
                    }

                    drop(permit);
                });
            }

            tracing::warn!(queue = %queue_name, "Consumer loop ended");
        });

        tracing::info!(
            queue = %name,
            r#type = %config.r#type,
            concurrency = %config.concurrency,
            "Started function queue consumer"
        );
    }

    // Register the queue trigger type (backward compat)
    let trigger_type = TriggerType {
        id: "queue".to_string(),
        _description: "Queue core module".to_string(),
        registrator: Box::new(self.clone()),
        worker_id: None,
    };

    let _ = self.engine.register_trigger_type(trigger_type).await;

    Ok(())
}
```

For FIFO queues (prefetch=1, semaphore=1), this naturally serializes to one message at a time.

**Step 4: Run test to verify it passes**

Run: `cargo test -p iii-engine --lib -- queue::tests::consumer_loop`
Expected: PASS

**Step 5: Write additional tests**

Test FIFO serialization:
```rust
#[tokio::test]
async fn consumer_loop_fifo_processes_sequentially() {
    // Setup with fifo config (concurrency ignored, prefetch=1)
    // Inject two messages rapidly
    // Verify they are processed one at a time (second starts after first completes)
}
```

Test nack on failure:
```rust
#[tokio::test]
async fn consumer_loop_nacks_on_failure_within_retry_limit() {
    // Register a failing function
    // Inject message with attempt=0, max_retries=3
    // Verify nack is called (not ack)
}
```

Test ack on exhausted retries:
```rust
#[tokio::test]
async fn consumer_loop_acks_on_exhausted_retries() {
    // Register a failing function
    // Inject message with attempt=3, max_retries=3
    // Verify ack is called (moves to DLQ via adapter)
}
```

**Step 6: Run all tests**

Run: `cargo test -p iii-engine --lib -- queue`
Expected: All pass

**Step 7: Commit**

```bash
git add engine/src/modules/queue/queue.rs
git commit -m "feat: move consumer loop from adapters into QueueCoreModule"
```

---

### Task 6: Remove old start/stop_function_queue from trait and adapters

**Files:**
- Modify: `engine/src/modules/queue/mod.rs`
- Modify: `engine/src/modules/queue/adapters/builtin/adapter.rs`
- Modify: `engine/src/modules/queue/adapters/rabbitmq/adapter.rs`
- Modify: `engine/src/modules/queue/adapters/redis_adapter.rs`
- Modify: `engine/src/modules/queue/adapters/bridge.rs`

**Step 1: Remove methods from trait**

In `mod.rs`, remove `start_function_queue` and `stop_function_queue` from the `QueueAdapter` trait.

**Step 2: Remove implementations from all adapters**

- Builtin: Remove `start_function_queue` (lines 286-312) and `stop_function_queue` (lines 314-324). Also remove `DynamicFunctionHandler` struct and impl (lines 119-151) — its logic now lives in the consumer loop.
- RabbitMQ: Remove `start_named_queue` (line 418-423) and `stop_named_queue` (line 425-427)
- Redis: Remove `start_named_queue` (line 383-385) and `stop_named_queue` (line 387-389)
- Bridge: Remove `start_named_queue` (line 270-273) and `stop_named_queue` (line 275-277)

**Step 3: Run tests**

Run: `cargo test -p iii-engine --lib -- queue`
Expected: All pass (consumer loop now handles what start/stop did)

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove start/stop_function_queue from trait and adapters"
```

---

### Task 7: Implement RabbitMQ function queue topology

**Files:**
- Modify: `engine/src/modules/queue/adapters/rabbitmq/naming.rs`
- Modify: `engine/src/modules/queue/adapters/rabbitmq/topology.rs`
- Modify: `engine/src/modules/queue/adapters/rabbitmq/adapter.rs`

**Step 1: Add function queue naming**

In `naming.rs`, add a new struct `FnQueueNames`:

```rust
pub struct FnQueueNames {
    pub name: String,
}

impl FnQueueNames {
    pub fn new(name: impl Into<String>) -> Self {
        Self { name: name.into() }
    }

    pub fn exchange(&self) -> String {
        format!("{}.__fn_queue::{}", EXCHANGE_PREFIX, self.name)
    }

    pub fn queue(&self) -> String {
        format!("{}.__fn_queue::{}.queue", EXCHANGE_PREFIX, self.name)
    }

    pub fn retry_exchange(&self) -> String {
        format!("{}.__fn_queue::{}::retry", EXCHANGE_PREFIX, self.name)
    }

    pub fn retry_queue(&self) -> String {
        format!("{}.__fn_queue::{}::retry.queue", EXCHANGE_PREFIX, self.name)
    }

    pub fn dlq_exchange(&self) -> String {
        format!("{}.__fn_queue::{}::dlq", EXCHANGE_PREFIX, self.name)
    }

    pub fn dlq(&self) -> String {
        format!("{}.__fn_queue::{}::dlq.queue", EXCHANGE_PREFIX, self.name)
    }
}
```

Add tests for naming:

```rust
#[test]
fn test_fn_queue_names() {
    let names = FnQueueNames::new("orders");
    assert_eq!(names.exchange(), "iii.__fn_queue::orders");
    assert_eq!(names.queue(), "iii.__fn_queue::orders.queue");
    assert_eq!(names.retry_exchange(), "iii.__fn_queue::orders::retry");
    assert_eq!(names.retry_queue(), "iii.__fn_queue::orders::retry.queue");
    assert_eq!(names.dlq(), "iii.__fn_queue::orders::dlq.queue");
}
```

**Step 2: Add topology setup for function queues**

In `topology.rs`, add `setup_function_queue` method:

```rust
pub async fn setup_function_queue(
    &self,
    queue_name: &str,
    backoff_ms: u64,
) -> Result<()> {
    let names = FnQueueNames::new(queue_name);

    // Main exchange (direct) and queue with DLX to retry
    self.channel.exchange_declare(
        &names.exchange(),
        lapin::ExchangeKind::Direct,
        ExchangeDeclareOptions { durable: true, ..Default::default() },
        FieldTable::default(),
    ).await?;

    let mut main_queue_args = FieldTable::default();
    main_queue_args.insert(
        "x-dead-letter-exchange".into(),
        AMQPValue::LongString(names.retry_exchange().into()),
    );

    self.channel.queue_declare(
        &names.queue(),
        QueueDeclareOptions { durable: true, ..Default::default() },
        main_queue_args,
    ).await?;

    self.channel.queue_bind(
        &names.queue(),
        &names.exchange(),
        queue_name,
        QueueBindOptions::default(),
        FieldTable::default(),
    ).await?;

    // Retry exchange and queue (TTL → back to main)
    self.channel.exchange_declare(
        &names.retry_exchange(),
        lapin::ExchangeKind::Direct,
        ExchangeDeclareOptions { durable: true, ..Default::default() },
        FieldTable::default(),
    ).await?;

    let mut retry_queue_args = FieldTable::default();
    retry_queue_args.insert(
        "x-message-ttl".into(),
        AMQPValue::LongUInt(backoff_ms as u32),
    );
    retry_queue_args.insert(
        "x-dead-letter-exchange".into(),
        AMQPValue::LongString(names.exchange().into()),
    );
    retry_queue_args.insert(
        "x-dead-letter-routing-key".into(),
        AMQPValue::LongString(queue_name.into()),
    );

    self.channel.queue_declare(
        &names.retry_queue(),
        QueueDeclareOptions { durable: true, ..Default::default() },
        retry_queue_args,
    ).await?;

    self.channel.queue_bind(
        &names.retry_queue(),
        &names.retry_exchange(),
        queue_name,
        QueueBindOptions::default(),
        FieldTable::default(),
    ).await?;

    // DLQ exchange and queue
    self.channel.exchange_declare(
        &names.dlq_exchange(),
        lapin::ExchangeKind::Direct,
        ExchangeDeclareOptions { durable: true, ..Default::default() },
        FieldTable::default(),
    ).await?;

    self.channel.queue_declare(
        &names.dlq(),
        QueueDeclareOptions { durable: true, ..Default::default() },
        FieldTable::default(),
    ).await?;

    self.channel.queue_bind(
        &names.dlq(),
        &names.dlq_exchange(),
        queue_name,
        QueueBindOptions::default(),
        FieldTable::default(),
    ).await?;

    tracing::debug!(queue = %queue_name, "Function queue RabbitMQ topology setup complete");
    Ok(())
}
```

**Step 3: Implement setup_function_queue on adapter**

In `adapter.rs`:

```rust
async fn setup_function_queue(
    &self,
    queue_name: &str,
    config: &FunctionQueueConfig,
) -> anyhow::Result<()> {
    self.topology
        .setup_function_queue(queue_name, config.backoff_ms)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to setup function queue topology: {}", e))
}
```

**Step 4: Run tests**

Run: `cargo test -p iii-engine --lib -- rabbitmq::naming`
Expected: naming tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement RabbitMQ function queue topology with retry and DLQ"
```

---

### Task 8: Implement RabbitMQ consume/ack/nack

**Files:**
- Modify: `engine/src/modules/queue/adapters/rabbitmq/adapter.rs`

**Step 1: Implement consume_function_queue**

The RabbitMQ adapter needs to:
1. Set prefetch via `basic_qos` on a dedicated channel (or use the existing one)
2. Call `basic_consume` on the function queue
3. Spawn a task that forwards lapin deliveries into a `mpsc::Sender<QueueMessage>`
4. Track delivery tags for ack/nack

```rust
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::sync::mpsc;

// Add to RabbitMQAdapter struct:
// delivery_map: Arc<RwLock<HashMap<u64, lapin::message::Delivery>>>,
// delivery_counter: Arc<AtomicU64>,

async fn consume_function_queue(
    &self,
    queue_name: &str,
    prefetch: u32,
) -> anyhow::Result<mpsc::Receiver<QueueMessage>> {
    use super::naming::FnQueueNames;
    use futures::StreamExt;

    let names = FnQueueNames::new(queue_name);

    // Set per-queue prefetch
    self.channel
        .basic_qos(prefetch as u16, BasicQosOptions::default())
        .await
        .map_err(|e| anyhow::anyhow!("Failed to set QoS: {}", e))?;

    let consumer_tag = format!("fn-queue-consumer-{}-{}", queue_name, uuid::Uuid::new_v4());
    let mut consumer = self.channel
        .basic_consume(
            &names.queue(),
            &consumer_tag,
            BasicConsumeOptions::default(),
            lapin::types::FieldTable::default(),
        )
        .await
        .map_err(|e| anyhow::anyhow!("Failed to create consumer: {}", e))?;

    let (tx, rx) = mpsc::channel(prefetch as usize);
    let delivery_map = Arc::clone(&self.delivery_map);
    let delivery_counter = Arc::clone(&self.delivery_counter);

    tokio::spawn(async move {
        while let Some(delivery_result) = consumer.next().await {
            match delivery_result {
                Ok(delivery) => {
                    let delivery_id = delivery_counter.fetch_add(1, Ordering::SeqCst);

                    // Parse message: body = raw JSON data, headers contain function_id + tracing
                    let data: serde_json::Value = match serde_json::from_slice(&delivery.data) {
                        Ok(v) => v,
                        Err(e) => {
                            tracing::error!(error = %e, "Failed to parse function queue message");
                            let _ = delivery.nack(BasicNackOptions { requeue: false, ..Default::default() }).await;
                            continue;
                        }
                    };

                    let headers = delivery.properties.headers().as_ref();

                    let function_id = headers
                        .and_then(|h| h.inner().get("function_id"))
                        .and_then(|v| match v {
                            lapin::types::AMQPValue::LongString(s) => Some(s.to_string()),
                            _ => None,
                        })
                        .unwrap_or_default();

                    let traceparent = headers
                        .and_then(|h| h.inner().get("traceparent"))
                        .and_then(|v| match v {
                            lapin::types::AMQPValue::LongString(s) => Some(s.to_string()),
                            _ => None,
                        });

                    let baggage = headers
                        .and_then(|h| h.inner().get("baggage"))
                        .and_then(|v| match v {
                            lapin::types::AMQPValue::LongString(s) => Some(s.to_string()),
                            _ => None,
                        });

                    // Attempt count from x-delivery-count (RabbitMQ native)
                    let attempt = headers
                        .and_then(|h| h.inner().get("x-delivery-count"))
                        .and_then(|v| match v {
                            lapin::types::AMQPValue::LongUInt(n) => Some(*n),
                            lapin::types::AMQPValue::LongLongInt(n) => Some(*n as u32),
                            _ => None,
                        })
                        .unwrap_or(0);

                    // Store delivery for later ack/nack
                    delivery_map.write().await.insert(delivery_id, delivery);

                    let msg = QueueMessage {
                        delivery_id,
                        function_id,
                        data,
                        attempt,
                        traceparent,
                        baggage,
                    };

                    if tx.send(msg).await.is_err() {
                        break;
                    }
                }
                Err(e) => {
                    tracing::error!(error = %e, "Error receiving delivery from function queue");
                }
            }
        }
    });

    Ok(rx)
}
```

**Step 2: Implement ack_function_queue**

```rust
async fn ack_function_queue(&self, _queue_name: &str, delivery_id: u64) -> anyhow::Result<()> {
    let delivery = self.delivery_map.write().await.remove(&delivery_id);
    if let Some(delivery) = delivery {
        delivery.ack(BasicAckOptions::default()).await
            .map_err(|e| anyhow::anyhow!("Failed to ack: {}", e))?;
    }
    Ok(())
}
```

**Step 3: Implement nack_function_queue**

```rust
async fn nack_function_queue(
    &self,
    _queue_name: &str,
    delivery_id: u64,
    requeue: bool,
) -> anyhow::Result<()> {
    let delivery = self.delivery_map.write().await.remove(&delivery_id);
    if let Some(delivery) = delivery {
        delivery.nack(BasicNackOptions { requeue, ..Default::default() }).await
            .map_err(|e| anyhow::anyhow!("Failed to nack: {}", e))?;
    }
    Ok(())
}
```

**Step 4: Update publish_to_function_queue**

Update the existing `publish_to_function_queue` (renamed from `enqueue_to_queue`) to use the new topology and message format:

```rust
async fn publish_to_function_queue(
    &self,
    queue_name: &str,
    function_id: &str,
    data: Value,
    _max_retries: u32,
    _backoff_ms: u64,
    traceparent: Option<String>,
    baggage: Option<String>,
) {
    use super::naming::FnQueueNames;

    let names = FnQueueNames::new(queue_name);

    // Body = raw data payload
    let payload = match serde_json::to_vec(&data) {
        Ok(p) => p,
        Err(e) => {
            tracing::error!(error = %e, "Failed to serialize data");
            return;
        }
    };

    // Headers: function_id, traceparent, baggage
    let mut headers = lapin::types::FieldTable::default();
    headers.insert(
        "function_id".into(),
        lapin::types::AMQPValue::LongString(function_id.into()),
    );
    if let Some(tp) = &traceparent {
        headers.insert(
            "traceparent".into(),
            lapin::types::AMQPValue::LongString(tp.as_str().into()),
        );
    }
    if let Some(bg) = &baggage {
        headers.insert(
            "baggage".into(),
            lapin::types::AMQPValue::LongString(bg.as_str().into()),
        );
    }

    let properties = lapin::BasicProperties::default()
        .with_content_type("application/json".into())
        .with_delivery_mode(2)
        .with_headers(headers);

    if let Err(e) = self.channel
        .basic_publish(
            &names.exchange(),
            queue_name,
            BasicPublishOptions::default(),
            &payload,
            properties,
        )
        .await
    {
        tracing::error!(error = %e, queue = %queue_name, "Failed to publish to function queue");
    }
}
```

**Step 5: Update RabbitMQAdapter struct to include new fields**

Add `delivery_map` and `delivery_counter` fields:

```rust
pub struct RabbitMQAdapter {
    publisher: Arc<Publisher>,
    retry_handler: Arc<RetryHandler>,
    topology: Arc<TopologyManager>,
    channel: Arc<Channel>,
    subscriptions: Arc<RwLock<HashMap<String, SubscriptionInfo>>>,
    engine: Arc<Engine>,
    config: RabbitMQConfig,
    delivery_map: Arc<RwLock<HashMap<u64, Delivery>>>,
    delivery_counter: Arc<AtomicU64>,
}
```

Update `new()` and `Clone` impl accordingly.

**Step 6: Run tests (compile check — RabbitMQ integration tests need a running broker)**

Run: `cargo check -p iii-engine --features rabbitmq`
Expected: Compiles successfully

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: implement RabbitMQ function queue consume/ack/nack transport"
```

---

### Task 9: Update bridge and redis adapters

**Files:**
- Modify: `engine/src/modules/queue/adapters/bridge.rs`
- Modify: `engine/src/modules/queue/adapters/redis_adapter.rs`

**Step 1: Bridge adapter — no-op transport stubs**

The bridge adapter delegates everything to the remote side. For function queues, the remote engine handles consuming:

```rust
async fn setup_function_queue(
    &self,
    _queue_name: &str,
    _config: &FunctionQueueConfig,
) -> anyhow::Result<()> {
    // Remote side manages topology
    Ok(())
}

async fn consume_function_queue(
    &self,
    _queue_name: &str,
    _prefetch: u32,
) -> anyhow::Result<tokio::sync::mpsc::Receiver<QueueMessage>> {
    // Bridge adapter: consuming happens on the remote engine
    // Return a channel that will never receive (consumer loop will be idle)
    let (_tx, rx) = tokio::sync::mpsc::channel(1);
    Ok(rx)
}
```

**Step 2: Redis adapter — leave as unimplemented**

```rust
async fn consume_function_queue(
    &self,
    _queue_name: &str,
    _prefetch: u32,
) -> anyhow::Result<tokio::sync::mpsc::Receiver<QueueMessage>> {
    anyhow::bail!("Redis function queue consumer not yet implemented")
}
```

**Step 3: Run tests**

Run: `cargo test -p iii-engine --lib -- queue`
Expected: All pass

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: update bridge and redis adapters with function queue transport stubs"
```

---

### Task 10: Clean up and verify

**Files:**
- Modify: `engine/src/modules/queue/adapters/builtin/adapter.rs` (remove old DynamicFunctionHandler if not done)
- Modify: `engine/src/modules/queue/adapters/rabbitmq/worker.rs` (verify old function_id-from-envelope pattern is cleaned up)

**Step 1: Remove any dead code from old pattern**

Check for:
- `DynamicFunctionHandler` in builtin adapter (should be removed — consumer loop replaces it)
- Old envelope wrapping in RabbitMQ `enqueue_to_queue` (the `function_id` + `data` JSON envelope is replaced by headers + raw body)
- Subscription keys with `named:` prefix in builtin adapter (no longer needed)

**Step 2: Run full test suite**

Run: `cargo test -p iii-engine`
Expected: All tests pass

**Step 3: Run clippy**

Run: `cargo clippy -p iii-engine -- -D warnings`
Expected: No warnings

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: clean up dead code from old named queue pattern"
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `engine/src/modules/queue/config.rs` | Rename `NamedQueueConfig` → `FunctionQueueConfig` |
| `engine/src/modules/queue/message.rs` | New file: `QueueMessage` struct |
| `engine/src/modules/queue/mod.rs` | Updated trait with transport methods, rename re-exports |
| `engine/src/modules/queue/queue.rs` | Consumer loop in `initialize()`, renamed methods |
| `engine/src/modules/queue/adapters/builtin/adapter.rs` | Implement consume/ack/nack, remove DynamicFunctionHandler |
| `engine/src/modules/queue/adapters/rabbitmq/adapter.rs` | Implement consume/ack/nack, new publish format |
| `engine/src/modules/queue/adapters/rabbitmq/naming.rs` | Add `FnQueueNames` |
| `engine/src/modules/queue/adapters/rabbitmq/topology.rs` | Add `setup_function_queue` with retry + DLQ topology |
| `engine/src/modules/queue/adapters/bridge.rs` | No-op stubs, renamed methods |
| `engine/src/modules/queue/adapters/redis_adapter.rs` | Unimplemented stubs, renamed methods |
| `engine/src/engine/mod.rs` | Rename `QueueEnqueuer::enqueue_to_named_queue` → `enqueue_to_function_queue` |
