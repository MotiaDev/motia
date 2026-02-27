import React, { useState } from "react";
import { Navbar } from "./Navbar";

interface MachineViewProps {
  onToggleMode: () => void;
  onToggleTheme: () => void;
  onOpenTerminal?: () => void; // Optional - terminal is easter egg only
  isGodMode: boolean;
  isDarkMode?: boolean;
  isSubmitted?: boolean;
  onLogoClick?: () => void;
}

export const MachineView: React.FC<MachineViewProps> = ({
  onToggleMode,
  onToggleTheme,
  isGodMode,
  isDarkMode = true,
  isSubmitted = false,
  onLogoClick,
}) => {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <div
      className={`min-h-screen font-mono relative flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "bg-iii-black text-iii-light"
          : "bg-iii-light text-iii-black"
      }`}
    >
      <Navbar
        isDarkMode={isDarkMode}
        isGodMode={isGodMode}
        isHumanMode={false}
        isSubmitted={isSubmitted}
        onToggleTheme={onToggleTheme}
        onToggleMode={onToggleMode}
        onLogoClick={onLogoClick}
        onLogoMouseEnter={() => setIsLogoHovered(true)}
        onLogoMouseLeave={() => setIsLogoHovered(false)}
      />

      {/* Content - Machine readable markdown */}
      <div className="flex-1 text-xs md:text-sm leading-relaxed px-4 md:px-8 lg:px-12 pt-24 md:pt-32 lg:pt-32 pb-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 break-words">
          {/* Header */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`iii — The Centralized Orchestration Runtime for Distributed Polyglot Function Execution

[Manifesto](/manifesto) | [Architecture](/architecture) | [Docs](https://iii-docs.vercel.app) | [GitHub](https://github.com/MotiaDev/iii-engine)

## Install
curl -fsSL install.iii.dev | sh`}</pre>

          {/* What is iii */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# What is iii

One Engine. Orchestrate, trigger, register, discover, scale, observe — any language, any location, any runtime.

Three primitives. Infinite compositions.

| Primitive | Role                                                        |
|-----------|-------------------------------------------------------------|
| Worker    | External service connected via WebSocket SDK                |
| Function  | Globally addressable handler — local module or remote worker|
| Trigger   | Binds external events (HTTP, cron, events, webhooks, AI intents) to function invocations |

Key properties:
- Polyglot execution — any language participates through one universal protocol
- Complete observability — logs and traces auto-injected into every invocation
- Self-hosting / BYOC — connect existing domains and services without lock-in
- Shared capabilities — State, Streaming, Observability accessible to every function

Languages: TypeScript, Python, Go, Rust, Node.js, Bun
Integrations: PostgreSQL, MongoDB, Redis, Kafka, GraphQL, gRPC
Platforms: AWS, Google Cloud, Azure, Cloudflare, Vercel, Fly.io, Docker, Kubernetes`}</pre>

          {/* Hello World — Polyglot Code Examples */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# Hello World — One Protocol, Any Language

Simply register functions and trigger them.
The Engine handles serialization, routing, and request-response correlation transparently.

## Python Worker — ML Inference
\`\`\`python
from iii import III
import torch

iii = III("ws://localhost:49134")
await iii.connect()

async def predict(input: dict) -> dict:
    tensor = torch.tensor(input["data"])
    result = model(tensor)
    return {"predictions": result.tolist()}

iii.register_function("ml::predict", predict)
\`\`\`

## Rust Worker — Data Transform
\`\`\`rust
use iii_sdk::{III, Value, IIIError};
use serde_json::json;

async fn transform(input: Value) -> Result<Value, IIIError> {
    let nums: Vec<f64> = serde_json::from_value(input)?;
    let doubled: Vec<f64> = nums.iter().map(|x| x * 2.0).collect();
    Ok(json!(doubled))
}

#[tokio::main]
async fn main() -> Result<(), IIIError> {
    let iii = III::new("ws://localhost:49134");
    iii.connect().await?;

    iii.register_function("data::transform", transform);

    Ok(())
}
\`\`\`

## Node.js Consumer
\`\`\`typescript
import { init } from "iii-sdk";

const iii = init("ws://localhost:49134");

const transformed = await iii.trigger(
  "data::transform",
  [1.0, 2.0, 3.0]
);

const prediction = await iii.trigger(
  "ml::predict",
  { data: transformed }
);
\`\`\``}</pre>

          {/* Architecture */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# Architecture — Your Stack, Instantly Unified

## Three Registries

### Function Registry
Maps globally addressable function paths to executable handlers — local modules or remote workers.
- Unique function paths (e.g., user::create, orders::process)
- Overwrite semantics for updates without caller changes
- Optional metadata and schema definitions
- Automatic cleanup on worker disconnect

### Trigger Registry
Two-tier structure binding external events to function invocations.
- Trigger Types: Categories (HTTP, cron, events, webhooks, AI intents)
- Trigger Instances: Concrete configs mapped to function paths
- Runtime extensibility — workers define new trigger types
- Domain-specific triggers without engine modification

### Worker Registry
Tracks connected workers with bidirectional communication channels and lifecycle state.
- Unique worker IDs for routing and coordination
- Bidirectional message channels (WebSocket)
- Active invocation tracking
- Graceful disconnect handling

## Eight Capabilities

| Capability        | Description              |
|-------------------|--------------------------|
| HTTP + Webhooks   | API triggers             |
| Cron + Schedules  | Timed execution          |
| Queues + Events   | Pub/Sub and topics       |
| State + Cache     | Shared context           |
| Streaming         | Realtime pipes           |
| Observability     | Logs + traces            |
| Workflows         | Multi-step orchestration |
| AI Agents         | Tool discovery           |

## Core Engine Properties
- Unified Invocation: Local in-process and remote worker functions use the same invocation interface
- Request-Response Correlation: Unique invocation IDs enable synchronous-style semantics across async network boundaries
- Lifecycle Management: Automatic cleanup of functions, triggers, and pending invocations on worker disconnect
- Recursive Orchestration: An engine can operate as a worker of another engine for federated architectures`}</pre>

          {/* What it Replaces */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# What iii Replaces — 50+ Tools, Three Primitives

## Infrastructure it replaces

| Category        | Traditional Tools                         | iii Primitive    |
|-----------------|-------------------------------------------|------------------|
| API Frameworks  | Express, Flask, FastAPI, Koa, Hono        | Function + Trigger (api) |
| Background Jobs | Bull, Celery, Sidekiq, Agenda, Dramatiq   | Function + async trigger  |
| Message Queues  | Redis Pub/Sub, RabbitMQ, Kafka, NATS      | Function + Trigger (event) |
| Real-time       | Socket.io, Pusher, Ably, Liveblocks       | Streaming        |
| State & Cache   | Redis, Memcached, DynamoDB                | State            |
| Scheduled Tasks | node-cron, Agenda, Cloud Scheduler        | Trigger (cron)   |
| Observability   | Winston, Pino, OpenTelemetry, Datadog SDK | Built-in tracing |
| Workflows       | Temporal, Cadence, Step Functions          | State + Events   |

## Platforms it enables

| Platform              | iii Pattern                                                  |
|-----------------------|--------------------------------------------------------------|
| AI Agent Runtime      | Functions = Tools, State = Memory, Streams = Responses       |
| Feature Flag System   | State + Streams = Real-time Toggles                          |
| Multiplayer Games     | Streams = Game State, Events = Actions                       |
| ETL Pipelines         | Events = Data Flow, State = Checkpoints                      |
| Reactive Backend      | Triggers + Events + State                                    |`}</pre>

          {/* Built-in Capabilities */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# Built-in Capabilities — Zero Configuration

No separate Redis, Logger, or Message Queue needed.
The Engine provides these primitives as callable functions accessible to every worker.

## Shared State — Cross-language state access
Python worker sets a value, Node.js worker reads it instantly — no Redis required.
  Python:  state.set("user:123", data)
  Node.js: const data = await state.get("user:123")

## Real-time Streaming — Bidirectional data flows
Stream data between workers in real-time. Process infinite sequences without buffering.
  Producer: stream.emit("data.chunk", chunk)
  Consumer: stream.on("data.chunk", process)

## Complete Observability — Auto-injected tracing
Every invocation carries a trace ID. Logs and metrics flow automatically to your preferred backend.
  Any Worker: log.info("Processing", { traceId })
  Engine:     Auto-correlated across all workers

## Event Bus — Pub/sub between workers
Publish events from any worker, subscribe from any other. No message queue configuration needed.
  Publisher:  events.emit("order.created", order)
  Subscriber: events.on("order.created", notify)`}</pre>

          {/* AI Agent Support */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# AI Agents — First-Class Citizens

The engine operates as a universal tool discovery and invocation layer where intelligent agents
participate as first-class execution entities — not an afterthought.

## Capabilities
- Universal Tool Discovery: Agents dynamically discover available functions without pre-programmed knowledge
- Self-Describing Schemas: Functions include input/output schemas enabling autonomous payload construction
- Semantic Metadata: Natural-language descriptions and annotations for intelligent tool selection
- Real-Time Capability Updates: Agents notified when functions are added, removed, or modified
- Multi-Step Composition: Compose workflows by chaining function invocations across the distributed system
- First-Class Registration: Agents can register their own callable functions, becoming active participants

## Use Cases
- Autonomous Operations: AI agents that monitor, diagnose, and remediate issues across your distributed system
- Dynamic Workflows: LLM orchestrators that compose multi-step workflows based on discovered capabilities
- Intelligent Routing: Agents that make routing decisions based on real-time function availability and metadata

No separate tool definition files. No manual integration.
The engine's dynamic registration and discovery mechanisms make agent integration inherent, not bolted on.`}</pre>

          {/* FAQ */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# FAQ

## How is iii different from gRPC?
gRPC requires compile-time IDL files and code generation. iii uses runtime protocol-based registration — no compilation needed. Functions become available immediately when workers register them.

## How is iii different from a service mesh?
Service meshes require sidecar configuration and complex networking. iii is a single engine binary — workers connect directly via WebSocket, no sidecars needed.

## Can I use iii with my existing Express/Flask/Spring app?
Yes. Drop in the SDK, register your routes as functions, and they become part of the distributed architecture immediately. No rewrite required.

## What about AI agents and LLMs?
Agent-ready by design. Functions self-describe with schemas. Agents dynamically discover functions and trigger them with autonomous payload construction. No tool definition files needed.

## Is iii production-ready?
The engine is in active development. Join our Discord to get early access, provide feedback, and shape the future of distributed systems.`}</pre>

          {/* Manifesto Summary */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# Manifesto — 10 Paradigm Shifts

The future of backend engineering demands a new foundation. Not another framework. Not another protocol.
A universal execution kernel built on primitives that compose infinitely.

 1. POLYGLOT — Language agnostic by design. Node.js, Python, Rust, Go, browser, edge, embedded — all connect via the same protocol.
 2. SMALL SURFACE AREA — A small set of core primitives that compose infinitely. One kernel replaces domain-specific frameworks.
 3. UNIVERSAL ACCESSIBILITY — Every dependency and integration accessible to every service. Legacy servers, edge functions, serverless, embedded devices — all first-class participants.
 4. SECURE BIDIRECTIONAL COMMUNICATION — Every service can push and pull. Every connection is encrypted. Trust is built into the protocol.
 5. DYNAMIC REGISTRATION — Workers connect, register functions, and they're immediately available. No compilation, no code generation, no spec files.
 6. SELF DISCOVERABLE — The mesh knows what exists and how to reach it. No external discovery layer required.
 7. OBSERVABLE BY DEFAULT — Tracing, metrics, and logging built into the protocol. Every invocation is observable. Every transaction is traceable.
 8. POLYMORPHIC TRIGGERS — HTTP, state updates, gRPC, cron, events, hardware interrupts — all normalize to the same invocation model. One function, infinite triggers.
 9. AGENT-FIRST — Maximize the surface area for agent success. Functions self-describe with schemas and semantic metadata. The system adapts to agent behavior, not vice versa.
10. REVERSIBLE TRANSACTIONS — Every transaction chain is replayable, modifiable, and reversible. Debug by replaying. Recover by rewinding.

One Binary. Infinite Systems.`}</pre>

          {/* Resources */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# Resources

[Documentation](https://iii-docs.vercel.app)
[GitHub](https://github.com/MotiaDev/iii-engine)
[npm](https://npmjs.com/package/iii-sdk)
[Discord](https://discord.gg/iii)

Install: curl -fsSL install.iii.dev | sh`}</pre>

          {/* Footer */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto text-gray-500">{`---
iii, inc.`}</pre>
        </div>
      </div>
    </div>
  );
};
