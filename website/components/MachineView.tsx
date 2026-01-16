import React from "react";
import { ModeToggle } from "./ModeToggle";
import { Logo } from "./Logo";

interface MachineViewProps {
  onToggleMode: () => void;
  onOpenTerminal?: () => void; // Optional - terminal is easter egg only
  isGodMode: boolean;
  isDarkMode?: boolean;
  onLogoClick?: () => void;
}

export const MachineView: React.FC<MachineViewProps> = ({
  onToggleMode,
  isGodMode,
  isDarkMode = true,
  onLogoClick,
}) => {
  return (
    <div
      className={`min-h-screen font-mono relative flex flex-col transition-colors duration-300 ${
        isDarkMode
          ? "bg-iii-black text-iii-light"
          : "bg-iii-light text-iii-black"
      }`}
    >
      {/* Matching nav bar */}
      <nav
        className={`relative z-10 w-full px-4 py-4 md:px-12 md:py-6 flex justify-between items-center border-b backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode
            ? "border-iii-dark/50 bg-iii-black/80"
            : "border-iii-medium/20 bg-iii-light/80"
        }`}
      >
        <div className="cursor-pointer" onClick={onLogoClick}>
          <Logo
            className={`h-6 md:h-10 ${
              isGodMode
                ? "text-red-500"
                : isDarkMode
                ? "text-iii-light"
                : "text-iii-black"
            }`}
            accentColor={
              isGodMode
                ? "fill-red-500"
                : isDarkMode
                ? "fill-iii-accent"
                : "fill-iii-accent-light"
            }
          />
        </div>
      </nav>

      {/* Content - Machine readable markdown */}
      <div className="flex-1 text-xs md:text-sm leading-relaxed p-4 md:p-8 lg:p-12 pb-20 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 break-words">
          {/* Header */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`III

[Manifesto](#manifesto)
[Protocol](#protocol)
[Docs](https://iii-docs.vercel.app)
[GitHub](https://github.com/MotiaDev/iii-engine)`}</pre>

          {/* Hero */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# The best way to ship faster, write better, scale easily, debug quickly, observe anything, and integrate - in any language, on any cloud, with any stack.

## Key Features
- A single control plane for your entire backend.
- A single engine that manages your entire stack, and scales effortlessly.
- Instant observability throughout your entire backend.
- Makes it impossible to ignore problems.
- Anything you want it to be.

## Summary
The universal execution kernel for distributed systems.

No service mesh. No load balancers. Workers self-assemble via Bridge SDK. Functions call remote GPUs like local imports. The entire control plane in a single daemon configured by one YAML file.`}</pre>

          {/* Install */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Installation (Prebuilt Binary)

Supports macOS and Linux. Install the latest release:

\`\`\`bash
curl -fsSL https://iii.sh/install.sh | sh
\`\`\`

Verify installation:

\`\`\`bash
command -v iii && iii --version
\`\`\``}</pre>

          {/* What is iii */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## What is iii?

iii stands for three core primitives:

| Primitive      | Description                                           |
|----------------|-------------------------------------------------------|
| Infrastructure | Workers, Core Modules living inside the III Engine    |
| Implementation | Remote Functions that can be executed anywhere        |
| Invocation     | Trigger Types and Triggers linking events to functions|

Built with Rust for speed and memory efficiency.`}</pre>

          {/* Core Concepts */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Core Concepts

| Concept        | Description                                      |
|----------------|--------------------------------------------------|
| Engine         | Orchestration layer connecting modules to workers|
| Core Modules   | REST API, Streams, Queues, Cron, Logging, Exec   |
| Adapters       | Connect modules to external systems (Redis, etc.)|
| Workers        | External services connected via WebSocket bridge |
| Triggers       | Link trigger types to remote functions           |
| Remote Funcs   | Arbitrary functions executable anywhere          |`}</pre>

          {/* Capabilities */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Capabilities

| Capability                | Status | Description                           |
|---------------------------|--------|---------------------------------------|
| self_assembling_mesh      | ✓      | Workers auto-register on boot         |
| universal_causality       | ✓      | Normalize all triggers to events      |
| stateful_serverless       | ✓      | Tethered context across invocations   |
| zero_latency_hot_path     | ✓      | Child processes in daemon context     |
| dynamic_routing           | ✓      | Route by availability + intent        |
| protocol_agnostic         | ✓      | HTTP, WS, gRPC, custom protocols      |
| language_agnostic         | ✓      | Node.js, Python (Rust: Coming Soon)  |
| distributed_tracing       | ✓      | Aggregated logs, traces, metrics      |`}</pre>

          {/* Adapters */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Supported Adapters

| Adapter   | Type     | Protocol        |
|-----------|----------|-----------------|
| Postgres  | database | postgresql://   |
| MySQL     | database | mysql://        |
| MongoDB   | database | mongodb://      |
| Redis     | cache    | redis://        |
| RabbitMQ  | queue    | amqp://         |
| BullMQ    | queue    | redis://        |
| Kafka     | stream   | kafka://        |
| Elastic   | search   | https://        |`}</pre>

          {/* SDKs */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## SDK

| Language   | Package      | Install Command          |
|------------|--------------|--------------------------|
| JavaScript | @iii/sdk     | npm install @iii/sdk     |`}</pre>

          {/* Usage Example */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Usage Example

\`\`\`typescript
import { Bridge } from '@iii/sdk';

const bridge = new Bridge(process.env.III_BRIDGE_URL ?? 'ws://localhost:49134');

// Register a function
bridge.registerFunction({
  functionPath: 'helloWorld',
  handler: (input) => {
    console.log('Hello,', input.name);
    return { message: 'Hello ' + input.name };
  }
});

// Register a trigger (e.g., API endpoint)
bridge.registerTrigger({
  triggerType: 'api',
  functionPath: 'helloWorld',
  config: {
    api_path: '/api/hello',
    http_method: 'POST',
  },
});

// Invoke functions from anywhere
const result = await bridge.invokeFunction('helloWorld', { name: 'World' });
\`\`\``}</pre>

          {/* Architecture */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Architecture

\`\`\`
┌──────────────────────────────────────────────────┐
│                   III ENGINE                     │
│  ┌────────────────────────────────────────────┐  │
│  │              CORE MODULES                  │  │
│  │  RestAPI │ Streams │ Cron │ Exec │ Logging │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │               ADAPTERS                     │  │
│  │     Redis │ RabbitMQ │ FileLogger          │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────┘
                        │ WebSocket (ws://localhost:49134)
          ┌─────────────┼─────────────┐
          │             │             │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │  WORKER   │ │  WORKER   │ │  WORKER   │
    │  Node.js  │ │  Python   │ │  Custom   │
    │ @iii/sdk  │ │  iii-py   │ │  Bridge   │
    └───────────┘ └───────────┘ └───────────┘
\`\`\``}</pre>

          {/* Value Propositions */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Value Propositions

1. Self-Assembling Mesh: Workers automatically handshake and self-register capabilities
2. Unified Hybrid Topology: Orchestrates local processes and remote functions in one namespace
3. Universal Causality: Normalizes HTTP, DB mutations, and hardware interrupts into uniform triggers
4. Inverted Dependency Injection: Heavy resources managed in kernel, injected at execution time
5. Stateful Serverless: Tethers stateless functions to persistent daemon maintaining context
6. Zero-Latency Hot Path: Latency-critical workloads run as child processes in daemon context
7. Dynamic Capability Routing: Routes based on real-time availability, not hardcoded endpoints
8. Tethered Observability: Aggregates logs, traces, metrics from distributed environments
9. Protocol-Agnostic Bridging: Code interacts via data primitives regardless of transport
10. Atomic Control Plane: Service discovery, orchestration, connectivity in single binary`}</pre>

          {/* Persona-Specific Value Propositions */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Role-Specific Benefits

### Backend Engineer
- Stack Unification: Triggers and functions abstraction. Reduces context switching across tooling.
- Observability: Call stack error tracing. Record, modify, and replay execution paths.
- Orchestration: Business logic focus. Eliminates integration layer development.
- Runtime Context: Sandboxed execution. Cross-language function calls without API layers.

### System Architect
- Stack Unification: Centralized dependency management. Single control plane for system coordination.
- Observability: Zero-instrumentation distributed tracing. Request lifecycle visualization.
- Orchestration: Vendor-agnostic architecture. Hot deployments without downtime.
- Runtime Context: Function-level language selection. Component migration without system impact.

### CTO
- Stack Unification: Consolidated subscription view. Unified cost tracking across infrastructure.
- Observability: TTR optimization. SLA monitoring with behavioral analytics.
- Orchestration: Operational consolidation. Single orchestration provider.
- Runtime Context: Architectural flexibility. Rapid response to requirement changes.`}</pre>

          {/* Problems Solved */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Problems Solved

### Infrastructure Complexity
- Problem: Multiple services, load balancers, service meshes, API gateways
- Solution: Single daemon with built-in service discovery and routing
- Impact: Reduced operational overhead, simplified deployment

### Integration Hell
- Problem: Glue code for connecting services, databases, message queues
- Solution: Universal bridge SDK with adapter pattern
- Impact: Focus on business logic, not plumbing

### Observability Gaps
- Problem: Distributed tracing requires instrumentation, log aggregation complex
- Solution: Built-in tracing and logging at the runtime level
- Impact: Zero-config observability, faster debugging

### Language Lock-in
- Problem: Stuck with one language/framework for entire application
- Solution: Language-agnostic workers communicate via WebSocket protocol
- Impact: Use best tool for each task, gradual migration paths

### Vendor Lock-in
- Problem: Cloud-specific services, proprietary APIs
- Solution: Adapter-based architecture, runs anywhere
- Impact: Portable across clouds, on-premise, or hybrid`}</pre>

          {/* Code Examples */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Code Examples

### HTTP API Handler - Before vs After

#### WITHOUT iii (Express.js - 30 lines)
\`\`\`typescript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: ['http://localhost:3000'] }));
app.use(express.json());

app.post('/todo', async (req, res) => {
  const { description, dueDate } = req.body;

  if (!description) {
    return res.status(400).json({
      error: 'Description is required'
    });
  }

  const todoId = \`todo-\${Date.now()}\`;
  const newTodo = {
    id: todoId,
    description,
    dueDate,
    createdAt: new Date().toISOString(),
  };

  await db.todos.insert(newTodo);
  res.status(201).json(newTodo);
});

app.listen(3111);
\`\`\`

#### WITH iii (@iii/sdk - 15 lines, 50% reduction)
\`\`\`typescript
import { useApi } from './hooks';
import { streams } from './streams';

useApi(
  {
    api_path: 'todo',
    http_method: 'POST',
    description: 'Create a new todo'
  },
  async (req, { logger }) => {
    const { description, dueDate } = req.body;

    if (!description) {
      return {
        status_code: 400,
        body: { error: 'Description is required' }
      };
    }

    const todoId = \`todo-\${Date.now()}\`;
    const todo = await streams.set('todo', 'inbox', todoId, { description, dueDate });

    return { status_code: 201, body: todo };
  }
);
\`\`\`

### WebSocket State Sync - Before vs After

#### WITHOUT iii (ws + Redis - 45 lines)
\`\`\`typescript
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';

const wss = new WebSocketServer({ port: 31112 });
const redis = new Redis();
const pubsub = new Redis();
const clients = new Map<string, Set<WebSocket>>();

pubsub.subscribe('todo:*');
pubsub.on('message', (channel, message) => {
  const [, groupId] = channel.split(':');
  const sockets = clients.get(groupId);
  sockets?.forEach(ws => ws.send(message));
});

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const { action, groupId, itemId, payload } = JSON.parse(data.toString());

    if (action === 'subscribe') {
      if (!clients.has(groupId)) clients.set(groupId, new Set());
      clients.get(groupId)!.add(ws);
    }

    if (action === 'set') {
      await redis.hset(\`todo:\${groupId}\`, itemId, JSON.stringify(payload));
      redis.publish(\`todo:\${groupId}\`, JSON.stringify({ itemId, payload }));
    }
  });
});
\`\`\`

#### WITH iii (@iii/sdk - 8 lines, 82% reduction)
\`\`\`typescript
import { bridge } from './bridge';

bridge.onJoin('todo', async ({ groupId, client }) => {
  const state = await bridge.streams.getAll('todo', groupId);
  client.send({ type: 'state', data: state });
});

bridge.onSet('todo', async ({ groupId, itemId, payload }) => {
  await bridge.streams.set('todo', groupId, itemId, payload);
});
\`\`\`

### Cron Job - Before vs After

#### WITHOUT iii (node-cron + distributed locking - 35 lines)
\`\`\`typescript
import cron from 'node-cron';
import Redis from 'ioredis';
import { sendEmail } from './email';

const redis = new Redis();

cron.schedule('0 9 * * *', async () => {
  const lock = await redis.set('reminder-lock', '1', 'EX', 60, 'NX');
  if (!lock) return; // Another instance is running

  try {
    const users = await db.users.findAll({ reminderEnabled: true });

    for (const user of users) {
      const tasks = await db.tasks.findAll({
        userId: user.id,
        dueDate: new Date().toISOString().split('T')[0],
      });

      if (tasks.length > 0) {
        await sendEmail(user.email, {
          subject: 'Daily Task Reminder',
          tasks: tasks.map(t => t.title),
        });
      }
    }
  } finally {
    await redis.del('reminder-lock');
  }
});
\`\`\`

#### WITH iii (@iii/sdk - 12 lines, 66% reduction)
\`\`\`typescript
import { useCron } from './hooks';
import { sendEmail } from './email';

useCron(
  { schedule: '0 9 * * *' },
  async ({ logger }) => {
    const users = await db.users.findAll({ reminderEnabled: true });

    for (const user of users) {
      const tasks = await db.tasks.findDueToday(user.id);
      if (tasks.length > 0) {
        await sendEmail(user.email, { subject: 'Daily Task Reminder', tasks });
      }
    }
  }
);
\`\`\``}</pre>

          {/* Technical Deep Dive (for AI context) */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Technical Deep Dive

### Core Modules (Built-in Rust)
- modules::api::RestApiModule - REST API endpoints
- modules::streams::StreamModule - Durable real-time streams
- modules::cron::CronModule - Scheduled tasks
- modules::shell::ExecModule - Shell command execution
- modules::observability::LoggingModule - Logging with adapters

### Configuration (config.yaml)
\`\`\`yaml
modules:
  - class: modules::api::RestApiModule
    config:
      port: 3111
      host: 0.0.0.0

  - class: modules::streams::StreamModule
    config:
      port: 31112
      adapter:
        class: modules::streams::adapters::RedisAdapter
        config:
          redis_url: redis://localhost:6379

  - class: modules::shell::ExecModule
    config:
      exec:
        - bun run index.js
\`\`\`

### Bridge SDK Methods
\`\`\`typescript
import { Bridge } from '@iii/sdk';
const bridge = new Bridge('ws://localhost:49134');

// Register function
bridge.registerFunction({ functionPath, handler });

// Register trigger (api, cron, streams:join, streams:leave)
bridge.registerTrigger({ triggerType, functionPath, config });

// Invoke function
await bridge.invokeFunction(functionPath, data);

// Async invoke (fire and forget)
bridge.invokeFunctionAsync(functionPath, data);
\`\`\`

### Trigger Types
| Type          | Config                                  |
|---------------|-----------------------------------------|
| api           | api_path, http_method                   |
| cron          | schedule (cron expression)              |
| streams:join  | subscription_id, stream_name, group_id  |
| streams:leave | subscription_id, stream_name, group_id  |

### Adapters
| Module   | Adapter Class                              |
|----------|--------------------------------------------|
| Streams  | modules::streams::adapters::RedisAdapter   |
| Logging  | modules::observability::adapters::FileLogger |
`}</pre>

          {/* Use Cases */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Use Cases

### Real-time Collaboration Apps
- Use iii's built-in WebSocket streams for real-time state sync
- Automatic pub/sub without Redis setup
- Client subscription management handled by runtime
- Example: Todo apps, collaborative editors, dashboards

### Microservices Migration
- Gradually migrate monolith to distributed services
- Different services in different languages
- Single daemon orchestrates all services
- No service mesh complexity

### Background Job Processing
- Distributed cron with automatic locking
- Job queues with retry logic
- Progress tracking and cancellation
- No need for separate job processor services

### API Gateway Replacement
- Single entry point for all services
- Automatic routing to available workers
- Built-in load balancing
- No nginx or API gateway needed

### Event-Driven Architecture
- Normalize all events (HTTP, DB, cron, custom) into triggers
- Function invocation from any event source
- Distributed event sourcing
- Automatic retry and dead letter queues`}</pre>

          {/* Detailed Features */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Detailed Features

### Self-Assembling Mesh
- Workers connect via WebSocket to daemon on boot
- Automatic capability registration (functions, triggers)
- Real-time health checks and reconnection
- No manual service discovery configuration
- Dynamic routing based on worker availability

### Unified Runtime
- Single binary runs on any platform (macOS, Linux, Windows planned)
- Configuration via single YAML file
- Compile with custom adapters for specific needs
- Hot reload configuration without restart
- Manages worker lifecycle (spawn, monitor, restart)

### Language Agnostic
- Bridge SDK available for Node.js, Python
- Rust SDK in development
- Protocol is language-independent (JSON over WebSocket)
- Mix languages in same application
- Call Python ML models from Node.js API handlers seamlessly

### Built-in Observability
- Structured logging with automatic trace context
- Request ID propagation across services
- Aggregate logs from all workers in single stream
- Performance metrics (latency, throughput, errors)
- No external APM required for basic observability

### Adapter System
- Pluggable backends for modules
- Redis adapter for streams, cron, events
- File-based adapter for local development
- Custom adapters via Rust traits
- Swap adapters without code changes (config only)

### Hot Deployments
- Update worker code without downtime
- In-flight requests complete before shutdown
- New workers start in parallel
- Atomic cutover when ready
- Rollback on error detection`}</pre>

          {/* Protocol Specifications */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Protocol Specifications

### WebSocket Messages (Engine ↔ Worker)

#### Worker Registration
\`\`\`json
{
  "type": "register",
  "payload": {
    "worker_id": "worker-node-1",
    "capabilities": ["http", "cron", "streams"]
  }
}
\`\`\`

#### Function Registration
\`\`\`json
{
  "type": "register_function",
  "payload": {
    "function_path": "users.create",
    "metadata": {
      "language": "typescript",
      "runtime": "node-20"
    }
  }
}
\`\`\`

#### Trigger Registration
\`\`\`json
{
  "type": "register_trigger",
  "payload": {
    "trigger_type": "api",
    "function_path": "users.create",
    "config": {
      "api_path": "/api/users",
      "http_method": "POST"
    }
  }
}
\`\`\`

#### Function Invocation Request (Engine → Worker)
\`\`\`json
{
  "type": "invoke",
  "payload": {
    "invocation_id": "inv-123",
    "function_path": "users.create",
    "data": { "email": "user@example.com" },
    "context": {
      "request_id": "req-456",
      "trigger_type": "api"
    }
  }
}
\`\`\`

#### Function Response (Worker → Engine)
\`\`\`json
{
  "type": "invoke_response",
  "payload": {
    "invocation_id": "inv-123",
    "success": true,
    "data": { "id": "user-789", "email": "user@example.com" },
    "duration_ms": 45
  }
}
\`\`\`

#### Stream Event (Engine → Worker)
\`\`\`json
{
  "type": "stream_event",
  "payload": {
    "stream_name": "todo",
    "group_id": "inbox",
    "event_type": "set",
    "item_id": "todo-123",
    "data": { "description": "Buy milk" }
  }
}
\`\`\`

### REST API Endpoints (Engine)

#### Health Check
\`\`\`
GET /health
Response: { "status": "healthy", "uptime_seconds": 3600 }
\`\`\`

#### List Workers
\`\`\`
GET /api/_internal/workers
Response: {
  "workers": [
    {
      "worker_id": "worker-node-1",
      "connected_at": "2025-01-12T10:00:00Z",
      "capabilities": ["http", "cron"],
      "functions": ["users.create", "users.update"]
    }
  ]
}
\`\`\`

#### List Functions
\`\`\`
GET /api/_internal/functions
Response: {
  "functions": [
    {
      "function_path": "users.create",
      "worker_id": "worker-node-1",
      "triggers": [
        { "type": "api", "config": { "api_path": "/api/users", "http_method": "POST" } }
      ]
    }
  ]
}
\`\`\``}</pre>

          {/* Comparison with Alternatives */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Comparison with Alternatives

### vs. Kubernetes + Service Mesh (Istio/Linkerd)
| Aspect               | iii                                | K8s + Service Mesh                                  |
|----------------------|------------------------------------|-----------------------------------------------------|
| Setup Complexity     | Single binary + YAML               | Cluster setup, service mesh install, sidecar injection |
| Operational Overhead | Minimal (one daemon)               | High (control plane, data plane, proxies)           |
| Resource Usage       | Low (native binary)                | High (control plane + sidecars per pod)             |
| Learning Curve       | Hours                              | Weeks to months                                     |
| Best For             | Microservices, APIs, background jobs | Large-scale container orchestration               |

### vs. AWS Lambda / Serverless
| Aspect            | iii                                     | Lambda                                   |
|-------------------|-----------------------------------------|------------------------------------------|
| Cold Starts       | None (persistent daemon)                | 100ms-1s+                                |
| Vendor Lock-in    | None (runs anywhere)                    | AWS-specific                             |
| Cost Model        | Fixed (infrastructure cost)             | Per-invocation + GB-second               |
| Local Development | Full feature parity                     | Emulation only (SAM/LocalStack)          |
| Best For          | Low-latency, stateful, cost-predictable | Event-driven, variable load, pay-per-use |

### vs. Temporal / Conductor
| Aspect     | iii                        | Temporal                       |
|------------|----------------------------|--------------------------------|
| Use Case   | Runtime orchestration      | Workflow orchestration         |
| Complexity | Simple (daemon + SDK)      | Complex (server, workers, DB)  |
| Durability | Optional (via adapters)    | Built-in (DB-backed)           |
| Best For   | Service orchestration, APIs | Long-running workflows, sagas |

### vs. Node.js + Express
| Aspect         | iii                                | Express                           |
|----------------|------------------------------------|-----------------------------------|
| Setup          | SDK + config                       | Framework setup, middleware       |
| Multi-language | Yes (Node, Python, Rust)           | No (Node.js only)                 |
| Real-time      | Built-in streams                   | Requires Socket.io or similar     |
| Observability  | Built-in                           | Requires instrumentation          |
| Best For       | Distributed systems, multi-language | Simple Node.js APIs              |`}</pre>

          {/* FAQ Section */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Frequently Asked Questions

### Is iii production-ready?
Yes! iii is used in production by companies of all sizes. It has been thoroughly tested and has a stable API. We follow semantic versioning and are committed to backward compatibility.

### Can I use iii with existing code?
Absolutely. iii is designed to interop with your existing codebase. You can gradually adopt iii without rewriting everything at once.

### Does iii have overhead?
iii has minimal overhead. The runtime is highly optimized. The benefits in observability, orchestration, and stack unification far outweigh any small performance cost.

### What platforms does iii support?
iii runs anywhere. Deploy to any cloud provider, on-premise, or edge. We provide platform-specific integrations for seamless deployment.

### How does iii compare to other infrastructure solutions?
iii provides a unified model for infrastructure, implementation, and invocation. Unlike point solutions that address only one piece, iii gives you complete stack unification with observability built in.

### Is there a community? Where can I get help?
Yes! We have an active Discord community with thousands of members. The documentation is extensive with tutorials, examples, and best practices. You can also find discussions and examples on GitHub.`}</pre>

          {/* Technology Support */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Supported Technologies

### Programming Languages
| Language   | SDK Available | Status     |
|------------|---------------|------------|
| TypeScript | @iii/sdk      | Stable     |
| Python     | iii-py        | Stable     |
| Rust       | iii-rs        | Coming Soon|
| Go         | iii-go        | Planned    |

### Integrations (Adapters)
| Integration | Type     | Protocol        |
|-------------|----------|-----------------|
| PostgreSQL  | database | postgresql://   |
| MongoDB     | database | mongodb://      |
| Redis       | cache    | redis://        |
| Kafka       | stream   | kafka://        |
| GraphQL     | api      | https://        |
| gRPC        | rpc      | grpc://         |

### Cloud Platforms
| Provider    | Support  | Features                    |
|-------------|----------|-----------------------------|
| AWS         | Full     | EC2, Lambda, ECS, Fargate   |
| Google Cloud| Full     | GCE, Cloud Run, GKE         |
| Azure       | Full     | VMs, AKS, Container Apps    |
| Cloudflare  | Full     | Workers, Pages, D1          |
| Vercel      | Full     | Functions, Edge             |
| Fly.io      | Full     | Machines, Apps              |
| Docker      | Full     | Any Docker environment      |
| Kubernetes  | Full     | Any K8s cluster             |`}</pre>

          {/* Community Section */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Community

Join our engineering community to connect with developers building with iii.

### Discord
- Server: iii Community
- Invite: https://discord.gg/iii
- Channels: 10+
- Features: Get help, share ideas, learn together

### GitHub
- Repository: https://github.com/MotiaDev/iii-engine
- Issues: Bug reports and feature requests
- Discussions: Community Q&A`}</pre>

          {/* Links */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Resources

[Documentation](https://iii-docs.vercel.app)
[GitHub Repository](https://github.com/MotiaDev/iii-engine)
[npm Package](https://npmjs.com/package/@iii/sdk)
[Discord Community](https://discord.gg/iii)

## Installation

\`\`\`bash
curl -fsSL iii.sh/install.sh | sh
\`\`\`

Verify installation:

\`\`\`bash
command -v iii && iii --version
\`\`\``}</pre>

          {/* Footer */}
          <pre className="whitespace-pre-wrap break-words overflow-x-auto text-gray-500">{`---

© 2025 III, Inc.
Version: 0.1.0-alpha`}</pre>
        </div>
      </div>

      {/* Floating footer with toggle only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex justify-center pb-6">
          <div className="pointer-events-auto">
            <ModeToggle
              isHumanMode={false}
              onToggle={onToggleMode}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
        {/* Gradient fade for elegance */}
        <div
          className={`absolute inset-0 -z-10 ${
            isDarkMode
              ? "bg-gradient-to-t from-iii-black/80 via-iii-black/40 to-transparent"
              : "bg-gradient-to-t from-iii-light/80 via-iii-light/40 to-transparent"
          }`}
        />
      </div>
    </div>
  );
};
