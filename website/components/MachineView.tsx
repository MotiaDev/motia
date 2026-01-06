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

No service mesh. No config files. No load balancers. Workers self-assemble. Functions call remote GPUs like local imports. The entire control plane in a single daemon.`}</pre>

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

iii (Intelligent Invocation Interface) is a universal execution kernel that unifies:
- APIs
- Jobs  
- Queues
- Streams
- Workflows
- AI Agents

Into a single durable execution model.`}</pre>

        {/* Core Concepts */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Core Concepts

| Concept              | Description                                      |
|----------------------|--------------------------------------------------|
| Kernel               | Persistent daemon with WAL-backed state          |
| Adapters             | Protocol bridges (Postgres, Redis, Kafka, etc.)  |
| Workers              | Auto-discovery via WebSocket handshake           |
| Triggers             | HTTP, WS, DB mutations, Cron, Events             |
| Context              | Distributed state injection                      |`}</pre>

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
| polyglot_workers          | ✓      | Node.js, Python, Go, Rust             |
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
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Client SDKs

Optional client libraries for interacting with the iii daemon:

| Language   | Package           | Install Command                       |
|------------|-------------------|---------------------------------------|
| JavaScript | @iii/client       | npm install @iii/client               |
| Python     | iii-py            | pip install iii-py                    |
| Go         | iii-go            | go get github.com/MotiaDev/iii-go     |
| Rust       | iii-rs            | cargo add iii-rs                      |`}</pre>

        {/* Usage Example */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Usage Example

\`\`\`typescript
import { iii } from '@iii/client';

// Define a capability
const resizeImage = iii.capability('image.resize', async (ctx, { url, width }) => {
  const image = await ctx.fetch(url);
  return ctx.gpu.resize(image, { width });
});

// Invoke from anywhere
const result = await ctx.invoke('image.resize', { 
  url: 'https://example.com/photo.jpg', 
  width: 800 
});
\`\`\``}</pre>

        {/* Architecture */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Architecture

\`\`\`
                    ┌─────────────────────┐
                    │   TRIGGER SOURCES   │
                    │  HTTP/WS/DB/Cron    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    iii KERNEL       │
                    │  ┌───────────────┐  │
                    │  │ Event Router  │  │
                    │  │ State Store   │  │
                    │  │ Worker Pool   │  │
                    │  └───────────────┘  │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
    │  WORKER   │        │  WORKER   │        │  WORKER   │
    │  Node.js  │        │  Python   │        │   Rust    │
    └───────────┘        └───────────┘        └───────────┘
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

### Dual-Mode Execution Pattern
Workers can run in two modes:
- Ephemeral Mode: Serverless-style, scale-to-zero, triggered on demand
- Managed Mode: Long-running processes with persistent connections

### Worker Deployment Options
Workers can run on:
- Edge Functions (Cloudflare Workers, Vercel Edge, Deno Deploy)
- Container Platforms (Docker, Kubernetes, Railway, Fly.io)
- Bare Metal (Hetzner, home servers, Raspberry Pi)
- Local Development (your laptop)

### WebSocket IPC Protocol
The iii daemon communicates via WebSocket with structured message types:
- REGISTER: Worker announces capabilities to kernel
- INVOKE: Kernel requests capability execution
- RESULT: Worker returns execution result
- HEARTBEAT: Connection health monitoring

### Configuration Schema (YAML)
\`\`\`yaml
kernel:
  port: 8080
  state_dir: ./data
  
adapters:
  postgres:
    connection: postgresql://localhost:5432/db
  redis:
    connection: redis://localhost:6379
    
workers:
  discovery: auto  # auto | manual
  timeout: 30s
  
triggers:
  - type: http
    path: /api/*
  - type: cron
    schedule: "0 * * * *"
  - type: postgres
    table: events
    event: INSERT
\`\`\`

### Bridge SDK Pattern
\`\`\`typescript
import { Bridge } from '@iii/bridge';

const bridge = new Bridge({ kernel: 'ws://localhost:8080' });

// Register a capability
bridge.register('image.resize', async (ctx, params) => {
  const { url, width } = params;
  // Access heavy resources via context
  const result = await ctx.gpu.resize(url, { width });
  return result;
});

// Start the worker
await bridge.connect();
\`\`\`

### Trigger System
All triggers normalize to a unified event schema:
- HTTP Request → { type: 'http', method, path, body, headers }
- Database Mutation → { type: 'db', table, operation, record }
- Cron Schedule → { type: 'cron', schedule, timestamp }
- WebSocket Message → { type: 'ws', channel, payload }
- Custom Event → { type: 'custom', name, data }

### Comparison with Alternatives

| Feature         | iii | Temporal | AWS Step Functions |
|-----------------|:---:|:--------:|:------------------:|
| Self-hosted     |  ✓  |    ✓     |         ✗          |
| Zero config     |  ✓  |    ✗     |         ✗          |
| Polyglot        |  ✓  |    ✓     |         ✓          |
| Edge-native     |  ✓  |    ✗     |         ✗          |
| Single binary   |  ✓  |    ✗     |         ✗          |
| Auto-discovery  |  ✓  |    ✗     |         ✗          |
`}</pre>

        {/* Links */}
        <pre className="whitespace-pre-wrap break-words overflow-x-auto">{`## Resources

[Documentation](https://iii-docs.vercel.app)
[GitHub Repository](https://github.com/MotiaDev/iii-engine)
[npm Package](https://npmjs.com/package/@iii/client)
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

