import React from 'react';
import { ModeToggle } from './ModeToggle';
import { Logo } from './Logo';

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
  onLogoClick
}) => {
  return (
    <div className={`min-h-screen font-mono relative flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-iii-black text-iii-light' 
        : 'bg-iii-light text-iii-black'
    }`}>
      {/* Matching nav bar */}
      <nav className={`relative z-10 w-full px-4 py-4 md:px-12 md:py-6 flex justify-between items-center border-b backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode 
            ? 'border-iii-dark/50 bg-iii-black/80' 
            : 'border-iii-medium/20 bg-iii-light/80'
        }`}>
        <div 
          className="cursor-pointer" 
          onClick={onLogoClick}
        >
          <Logo 
            className={`h-6 md:h-10 ${isGodMode ? 'text-red-500' : isDarkMode ? 'text-iii-light' : 'text-iii-black'}`} 
            accentColor={isGodMode ? 'fill-red-500' : isDarkMode ? 'fill-iii-accent' : 'fill-iii-accent-light'}
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
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`# ONE BINARY. INFINITE SYSTEMS.

The universal execution kernel for distributed systems.

No service mesh. No load balancers. Workers self-assemble via config.yaml. Functions call remote GPUs like local imports. The entire control plane in a single daemon.`}</pre>

        {/* Install */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Installation (Prebuilt Binary)

Supports macOS and Linux. Install the latest release:

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/MotiaDev/iii-engine/main/install.sh | sh
\`\`\`

Custom install directory:

\`\`\`bash
BIN_DIR=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/MotiaDev/iii-engine/main/install.sh | sh
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
| language_agnostic         | ✓      | Node.js, Python, Rust (Go: Coming Soon) |
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
| JavaScript | @iii-dev/sdk | npm install @iii-dev/sdk |`}</pre>

        {/* Usage Example */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Usage Example

\`\`\`typescript
import { Bridge } from '@iii-dev/sdk';

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
    │@iii-dev  │ │  iii-py   │ │  Bridge   │
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
import { Bridge } from '@iii-dev/sdk';
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

        {/* Links */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Resources

[Documentation](https://iii-docs.vercel.app)
[GitHub Repository](https://github.com/MotiaDev/iii-engine)
[npm Package](https://npmjs.com/package/@iii-dev/sdk)
[Discord Community](https://discord.gg/iii)`}</pre>

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
            <ModeToggle isHumanMode={false} onToggle={onToggleMode} isDarkMode={isDarkMode} />
          </div>
        </div>
        {/* Gradient fade for elegance */}
        <div className={`absolute inset-0 -z-10 ${
          isDarkMode 
            ? 'bg-gradient-to-t from-iii-black/80 via-iii-black/40 to-transparent' 
            : 'bg-gradient-to-t from-iii-light/80 via-iii-light/40 to-transparent'
        }`} />
      </div>
    </div>
  );
};

