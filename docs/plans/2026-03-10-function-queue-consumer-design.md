# Function Queue Consumer Design

## Problem

Function queues (previously "named queues") currently work end-to-end only with the builtin adapter. The RabbitMQ and Redis adapters can publish messages but have no consumer — jobs are silently lost. Additionally, the consumer logic (calling `engine.call`) lives inside the builtin adapter, coupling transport and business logic.

## Goals

1. Refactor the `QueueAdapter` trait so adapters are pure transport (publish, consume, ack, nack)
2. Move consumer logic (function invocation, retry decisions) into `QueueCoreModule`
3. Implement RabbitMQ adapter transport (topology + consume + ack/nack)
4. Support both `standard` and `fifo` queue types
5. Swapping adapter in YAML config works with zero changes to consumer logic

## Architecture

```
QueueCoreModule (queue.rs)
├── Owns one consumer loop per function queue
├── Receives messages from adapter via async channel
├── Calls engine.call(function_id, data) with tracing context
├── Decides ack/nack based on result and retry config
└── Adapter-agnostic: same logic for builtin, RabbitMQ, Redis

QueueAdapter trait (transport only)
├── setup_function_queue(name, config) → create topology
├── publish(queue, headers, data) → send message
├── consume(queue, prefetch) → returns async Receiver<QueueMessage>
├── ack(delivery_id)
├── nack(delivery_id, requeue: bool)
└── No engine reference, no function invocation
```

Swapping adapter in config changes only the transport — the consumer loop, function invocation, retry logic, and tracing all stay the same.

## Message Format

- **Body**: raw JSON data payload (the `data` field from the trigger call)
- **Headers**: `function_id`, `traceparent`, `baggage`
- Retry tracking via transport-native mechanisms (RabbitMQ `x-delivery-count`, builtin adapter's internal counter)

No custom envelope. The adapter translates between its native message format and a common `QueueMessage` struct:

```rust
struct QueueMessage {
    delivery_id: u64,           // adapter-specific tag for ack/nack
    function_id: String,
    data: Value,
    attempt: u32,               // derived from transport-native retry count
    traceparent: Option<String>,
    baggage: Option<String>,
}
```

## Queue Types

### Standard

- Prefetch = `config.concurrency`
- Multiple messages processed in parallel (semaphore-bounded)
- On failure: nack → adapter handles retry with backoff
- After `max_retries`: route to DLQ

### FIFO

- Prefetch = 1, single sequential consumer
- Strict ordering guaranteed
- Same retry/DLQ behavior, blocks queue during retry

## Consumer Loop (in QueueCoreModule)

```
for each function queue in config:
    adapter.setup_function_queue(name, config)
    let prefetch = if config.type == "fifo" { 1 } else { config.concurrency }
    let receiver = adapter.consume(name, prefetch)

    spawn tokio task:
        let semaphore = Semaphore::new(prefetch)
        loop:
            msg = receiver.recv()
            permit = semaphore.acquire()
            spawn:
                span = tracing span from msg.traceparent/baggage
                result = engine.call(msg.function_id, msg.data).instrument(span)
                if result.is_ok():
                    adapter.ack(msg.delivery_id)
                else if msg.attempt < config.max_retries:
                    adapter.nack(msg.delivery_id, requeue=false)
                else:
                    adapter.ack(msg.delivery_id)  // exhausted retries → DLQ
                drop(permit)
```

For FIFO (prefetch=1, semaphore=1), this naturally serializes to one message at a time.

## RabbitMQ Transport

### Topology (per function queue)

```
Exchange: __fn_queue::{name}          (direct, durable)
Queue:    __fn_queue::{name}          (durable, x-dead-letter-exchange → retry)

Exchange: __fn_queue::{name}::retry   (direct, durable)
Queue:    __fn_queue::{name}::retry   (durable, x-message-ttl → backoff, x-dead-letter-exchange → main)

Exchange: __fn_queue::{name}::dlq     (direct, durable)
Queue:    __fn_queue::{name}::dlq     (durable)
```

### Retry flow

nack(requeue=false) → dead-letter to retry queue → TTL expires → back to main queue → consumer retries. RabbitMQ tracks `x-delivery-count` natively. After `max_retries`, consumer acks and message routes to DLQ.

### Adapter methods

- `setup_function_queue`: declares exchanges, queues, bindings
- `publish`: `basic_publish` with function_id/tracing in headers
- `consume`: `basic_consume` → spawns task that forwards deliveries into a `tokio::mpsc::Receiver<QueueMessage>`
- `ack`/`nack`: delegate to `basic_ack`/`basic_nack`

## Builtin Transport

Same trait, backed by the existing `BuiltinQueue` KV store:

- `setup_function_queue`: no-op (KV store is schemaless)
- `publish`: creates a Job, pushes to KV store waiting list
- `consume`: spawns polling loop that pops from waiting list, sends into channel
- `ack`: removes job from KV store
- `nack(requeue=false)`: increments attempt count, schedules retry with backoff delay

The existing `DynamicFunctionHandler` and worker loop code in the builtin adapter get removed — replaced by the shared consumer loop in `QueueCoreModule`.

## Naming

Rename throughout:
- `named_queue` → `function_queue` / `fn_queue`
- `NamedQueueConfig` → `FunctionQueueConfig`
- `enqueue_to_named_queue` → `enqueue_to_function_queue`
- `start_named_queue` → `start_function_queue`
- `stop_named_queue` → `stop_function_queue`
- `queue_configs` YAML key stays unchanged
- RabbitMQ prefix: `__named_queue::` → `__fn_queue::`

## Scope

1. Refactor `QueueAdapter` trait to transport-only contract with `QueueMessage` abstraction
2. Move consumer loop from builtin adapter into `QueueCoreModule`
3. Update builtin adapter to implement new trait (publish/consume/ack/nack over KV store)
4. Implement RabbitMQ adapter transport (topology + basic_consume + ack/nack)
5. Redis adapter: leave as unimplemented for now (follows same pattern later)

## Out of Scope

- Group-based FIFO parallelism (concurrency > 1 with ordering per group)
- Redis consumer implementation
- Dynamic queue creation at runtime
