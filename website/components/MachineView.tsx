import React from 'react';
import { ModeToggle } from './ModeToggle';
import { Logo } from './Logo';

interface MachineViewProps {
  onToggleMode: () => void;
  onOpenTerminal: () => void;
  isGodMode: boolean;
  isDarkMode?: boolean;
  onLogoClick?: () => void;
}

export const MachineView: React.FC<MachineViewProps> = ({ 
  onToggleMode, 
  onOpenTerminal, 
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
        <div className="flex gap-2 md:gap-4 text-[10px] md:text-sm text-iii-medium font-semibold tracking-tight items-center">
          <ModeToggle isHumanMode={false} onToggle={onToggleMode} isDarkMode={isDarkMode} />
          <div className="hidden md:block w-px h-4 bg-iii-medium/30" />
          <button 
            onClick={onOpenTerminal}
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded transition-colors uppercase text-[10px] md:text-xs font-medium ${
              isGodMode 
                ? 'bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30' 
                : isDarkMode
                  ? 'bg-iii-dark/50 border border-iii-medium/30 text-iii-medium hover:text-iii-light hover:border-iii-medium'
                  : 'bg-iii-medium/10 border border-iii-medium/30 text-iii-medium hover:text-iii-black hover:border-iii-medium'
            }`}
          >
            {isGodMode ? '> TERMINAL' : 'TERMINAL'}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 text-sm leading-relaxed p-6 md:p-12">
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
        </div>
      </div>
    </div>
  );
};

