import React from 'react';
import { ModeToggle } from './ModeToggle';

interface MachineViewProps {
  onToggleMode: () => void;
  onOpenTerminal: () => void;
  isGodMode: boolean;
}

export const MachineView: React.FC<MachineViewProps> = ({ onToggleMode, onOpenTerminal, isGodMode }) => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] font-mono text-sm leading-relaxed p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <pre className="whitespace-pre-wrap">{`III

[Manifesto](#manifesto)
[Protocol](#protocol)
[Docs](https://iii-docs.vercel.app)
[GitHub](https://github.com/MotiaDev/iii-engine)`}</pre>

        {/* Hero */}
        <pre className="whitespace-pre-wrap">{`# ONE BINARY. INFINITE SYSTEMS.

The universal execution kernel for distributed systems.

No service mesh. No config files. No load balancers. Workers self-assemble. Functions call remote GPUs like local imports. The entire control plane in a single daemon.`}</pre>

        {/* Install */}
        <pre className="whitespace-pre-wrap">{`## Installation (Prebuilt Binary)

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
        <pre className="whitespace-pre-wrap">{`## What is iii?

iii (Intelligent Invocation Interface) is a universal execution kernel that unifies:
- APIs
- Jobs  
- Queues
- Streams
- Workflows
- AI Agents

Into a single durable execution model.`}</pre>

        {/* Core Concepts */}
        <pre className="whitespace-pre-wrap">{`## Core Concepts

| Concept              | Description                                      |
|----------------------|--------------------------------------------------|
| Kernel               | Persistent daemon with WAL-backed state          |
| Adapters             | Protocol bridges (Postgres, Redis, Kafka, etc.)  |
| Workers              | Auto-discovery via WebSocket handshake           |
| Triggers             | HTTP, WS, DB mutations, Cron, Events             |
| Context              | Distributed state injection                      |`}</pre>

        {/* Capabilities */}
        <pre className="whitespace-pre-wrap">{`## Capabilities

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
        <pre className="whitespace-pre-wrap">{`## Supported Adapters

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
        <pre className="whitespace-pre-wrap">{`## Client SDKs

Optional client libraries for interacting with the iii daemon:

| Language   | Package           | Install Command                       |
|------------|-------------------|---------------------------------------|
| JavaScript | @iii/client       | npm install @iii/client               |
| Python     | iii-py            | pip install iii-py                    |
| Go         | iii-go            | go get github.com/MotiaDev/iii-go     |
| Rust       | iii-rs            | cargo add iii-rs                      |`}</pre>

        {/* Usage Example */}
        <pre className="whitespace-pre-wrap">{`## Usage Example

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
        <pre className="whitespace-pre-wrap">{`## Architecture

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
        <pre className="whitespace-pre-wrap">{`## Value Propositions

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

        {/* Links */}
        <pre className="whitespace-pre-wrap">{`## Resources

[Documentation](https://iii-docs.vercel.app)
[GitHub Repository](https://github.com/MotiaDev/iii-engine)
[npm Package](https://npmjs.com/package/@iii/client)
[Discord Community](https://discord.gg/iii)`}</pre>

        {/* Footer */}
        <pre className="whitespace-pre-wrap text-gray-500">{`---

© 2025 III, Inc.
Version: 0.1.0-alpha
License: BSL-1.1 → Apache-2.0 (2028)`}</pre>

        {/* Toggle and Terminal button at bottom */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
          <button
            onClick={onOpenTerminal}
            className={`px-3 py-1.5 bg-black border text-xs font-mono rounded transition-colors ${
              isGodMode 
                ? 'border-red-500 text-red-400 hover:border-red-400 hover:text-red-300' 
                : 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
            }`}
          >
            {isGodMode ? '> TERMINAL' : 'OPEN TERMINAL'}
          </button>
          <ModeToggle isHumanMode={false} onToggle={onToggleMode} isDarkMode={true} />
        </div>
      </div>
    </div>
  );
};

