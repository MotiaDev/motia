import React, { useEffect, useRef, useState } from 'react';
import { TerminalLog } from '../types';

interface TerminalProps {
  onClose: () => void;
  isGodMode?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ onClose, isGodMode = false }) => {
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: TerminalLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      type,
      message
    }]);
  };

  useEffect(() => {
    const bootSequence = async () => {
      setLogs([]);
      if (isGodMode) {
        addLog('!!! ROOT ACCESS DETECTED !!!', 'error');
        await new Promise(r => setTimeout(r, 200));
        addLog('OVERRIDING BSL SAFETY LOCKS...', 'glitch');
        await new Promise(r => setTimeout(r, 400));
        addLog('ENGINE KERNEL: UNLOCKED', 'success');
        await new Promise(r => setTimeout(r, 200));
        addLog('Type "help" for available commands.', 'info');
        return;
      }

      addLog('Initializing iii Kernel v0.1.0-alpha...', 'system');
      await new Promise(r => setTimeout(r, 300));
      addLog('Loading durable execution runtime...', 'info');
      await new Promise(r => setTimeout(r, 200));
      addLog('Connecting to universal adapter layer...', 'info');
      await new Promise(r => setTimeout(r, 500));
      addLog('Protocol: CC-BY-ND 4.0 Active.', 'warning');
      await new Promise(r => setTimeout(r, 300));
      addLog('Connection established. Type "help" for commands.', 'success');
    };

    bootSequence();
  }, [isGodMode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    const args = command.split(' ').slice(1);
    const baseCommand = command.split(' ')[0];

    addLog(`> ${cmd}`, 'info');

    switch (baseCommand) {
      case 'help':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('III ENGINE DEBUG CONSOLE - COMMAND REFERENCE', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('GENERAL:', 'warning');
        addLog('  status      - Check engine status', 'info');
        addLog('  arch        - Display architecture diagram', 'info');
        addLog('  modules     - List core modules', 'info');
        addLog('  adapters    - View adapter ecosystem', 'info');
        addLog('', 'info');
        addLog('FOR DEVELOPERS:', 'warning');
        addLog('  bridge      - SDK bridge code sample', 'info');
        addLog('  triggers    - How triggers work', 'info');
        addLog('  invoke      - Function invocation sample', 'info');
        addLog('  config      - YAML configuration example', 'info');
        addLog('', 'info');
        addLog('CONCEPTS:', 'warning');
        addLog('  faq         - Core knowledge base', 'info');
        addLog('  compare     - iii vs alternatives', 'info');
        addLog('  polyglot    - Multi-language support', 'info');
        addLog('  durable     - Durable execution explained', 'info');
        addLog('', 'info');
        addLog('ADVANCED:', 'warning');
        addLog('  dual-mode   - Ephemeral/managed patterns', 'info');
        addLog('  fabric      - Heavy capability access', 'info');
        addLog('  poke <url>  - Universal wake-up signal', 'info');
        addLog('  whereis     - Where workers can run', 'info');
        addLog('', 'info');
        addLog('SYSTEM:', 'warning');
        addLog('  rust        - Why Rust?', 'info');
        addLog('  credits     - Team credits', 'info');
        addLog('  clear       - Clear console', 'info');
        addLog('  exit        - Close terminal', 'info');
        break;
        
      case 'status':
        addLog('┌─────────────────────────────────────┐', 'system');
        addLog('│         III ENGINE STATUS           │', 'system');
        addLog('├─────────────────────────────────────┤', 'system');
        addLog('│ Engine:        ████████████ ONLINE  │', 'success');
        addLog('│ Workers:       0 connected          │', 'info');
        addLog('│ Invocations:   0 pending            │', 'info');
        addLog('│ Triggers:      READY                │', 'success');
        addLog('│ Adapters:      5 loaded             │', 'info');
        addLog('│ License:       BSL 1.1              │', 'warning');
        addLog('└─────────────────────────────────────┘', 'system');
        break;

      case 'arch':
      case 'architecture':
      case 'diagram':
        addLog('Rendering Architecture...', 'system');
        addLog('', 'info');
        addLog('                    ┌─────────────────────────────────────────┐', 'info');
        addLog('                    │             CORE (BSL 1.1)              │', 'info');
        addLog('                    │                                         │', 'info');
        addLog('                    │            ╔═══════════╗                │', 'info');
        addLog('                    │            ║  ENGINE   ║                │', 'info');
        addLog('                    │            ╚═════╦═════╝                │', 'info');
        addLog('                    │                  │                      │', 'info');
        addLog('    ┌───────────────┼──────────────────┼──────────────────────┤', 'info');
        addLog('    │               │                  │                      │', 'info');
        addLog('┌───▼────┐    ┌─────▼─────┐    ┌───────▼───────┐    ┌─────────▼─────────┐', 'info');
        addLog('│Streams │    │ REST API  │    │    Events     │    │      Cron         │', 'info');
        addLog('│ Module │    │  Module   │    │    Module     │    │     Module        │', 'info');
        addLog('└────────┘    └───────────┘    └───────────────┘    └───────────────────┘', 'info');
        addLog('    │               │                  │                      │', 'info');
        addLog('    └───────────────┴──────────────────┴──────────────────────┘', 'info');
        addLog('                    │ ADAPTER LAYER                           │', 'info');
        addLog('         ┌──────────┴──────────┬──────────────────┐', 'info');
        addLog('         ▼                     ▼                  ▼', 'info');
        addLog('    ┌─────────┐          ┌──────────┐       ┌──────────┐', 'info');
        addLog('    │  Redis  │          │ Postgres │       │  Kafka   │', 'info');
        addLog('    └─────────┘          └──────────┘       └──────────┘', 'info');
        addLog('', 'info');
        addLog('                    ═══════════════════════════════', 'system');
        addLog('                          WORKERS (Polyglot)', 'system');
        addLog('                    ═══════════════════════════════', 'system');
        addLog('', 'info');
        addLog('    ┌────────────────────┐        ┌────────────────────┐', 'info');
        addLog('    │      Node.JS       │        │       Python       │', 'info');
        addLog('    │  ┌──────────────┐  │        │  ┌──────────────┐  │', 'info');
        addLog('    │  │ Bridge Layer │◄─┼────────┼─►│ Bridge Layer │  │', 'info');
        addLog('    │  └──────┬───────┘  │        │  └──────┬───────┘  │', 'info');
        addLog('    │         │          │        │         │          │', 'info');
        addLog('    │    ┌────▼────┐     │        │    ┌────▼────┐     │', 'info');
        addLog('    │    │ handler │     │        │    │ handler │     │', 'info');
        addLog('    │    └─────────┘     │        │    └─────────┘     │', 'info');
        addLog('    └────────────────────┘        └────────────────────┘', 'info');
        addLog('', 'info');
        addLog('Key: Engine orchestrates Modules → Adapters → External Systems', 'success');
        addLog('     Workers connect via Bridge SDK (TypeScript, Python, Go, Rust)', 'success');
        break;

      case 'modules':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('CORE MODULES (Built with Rust)', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('┌─────────────────────────────────────────────────────────────┐', 'info');
        addLog('│ Module          │ Description                              │', 'info');
        addLog('├─────────────────┼──────────────────────────────────────────┤', 'info');
        addLog('│ REST API        │ Build REST APIs with automatic routing   │', 'success');
        addLog('│ Streams         │ Durable streams for real-time data       │', 'success');
        addLog('│ Events          │ Pub/Sub event-driven messaging           │', 'success');
        addLog('│ Cron            │ Scheduled tasks with reliability         │', 'success');
        addLog('│ Exec            │ Execute shell commands safely            │', 'success');
        addLog('│ Logging         │ Centralized logging infrastructure       │', 'success');
        addLog('└─────────────────┴──────────────────────────────────────────┘', 'info');
        addLog('', 'info');
        addLog('Each module can have its own Adapter for external integration.', 'warning');
        addLog('Type "config" to see how to configure modules.', 'info');
        break;

      case 'adapters':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('ADAPTER ECOSYSTEM', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('Adapters connect modules to external systems:', 'warning');
        addLog('', 'info');
        addLog('  ┌─ Streams Module', 'info');
        addLog('  │   └─► Redis Adapter (Pub/Sub + Key/Value)', 'success');
        addLog('  │   └─► Kafka Adapter (Coming Soon)', 'info');
        addLog('  │', 'info');
        addLog('  ├─ Events Module', 'info');
        addLog('  │   └─► Redis Adapter', 'success');
        addLog('  │   └─► RabbitMQ Adapter', 'success');
        addLog('  │', 'info');
        addLog('  ├─ REST API Module', 'info');
        addLog('  │   └─► Direct HTTP Handler', 'success');
        addLog('  │', 'info');
        addLog('  └─ Database (Coming)', 'info');
        addLog('      └─► Postgres Adapter', 'info');
        addLog('      └─► MySQL Adapter', 'info');
        addLog('', 'info');
        addLog('License: Apache 2.0 - Community contributions welcome!', 'success');
        break;

      case 'bridge':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('BRIDGE SDK - Connect Workers to Engine', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('// TypeScript Example', 'warning');
        addLog('', 'info');
        addLog('import { Bridge } from "@iii-dev/sdk";', 'success');
        addLog('', 'info');
        addLog('const bridge = new Bridge("ws://localhost:49134");', 'success');
        addLog('', 'info');
        addLog('bridge.registerFunction({', 'success');
        addLog('  functionPath: "myService.greet",', 'success');
        addLog('  handler: async (input) => {', 'success');
        addLog('    return { message: `Hello, ${input.name}!` };', 'success');
        addLog('  }', 'success');
        addLog('});', 'success');
        addLog('', 'info');
        addLog('bridge.registerTrigger({', 'success');
        addLog('  triggerType: "http",', 'success');
        addLog('  functionPath: "myService.greet",', 'success');
        addLog('  config: { path: "/greet", method: "POST" }', 'success');
        addLog('});', 'success');
        addLog('', 'info');
        addLog('Available SDKs: @iii-dev/sdk (TS), iii-py, iii-go, iii-rs', 'warning');
        break;

      case 'triggers':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('TRIGGER TYPES', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('Triggers link EVENTS to FUNCTIONS:', 'warning');
        addLog('', 'info');
        addLog('┌──────────────┬────────────────────────────────────────────┐', 'info');
        addLog('│ Type         │ Description                                │', 'info');
        addLog('├──────────────┼────────────────────────────────────────────┤', 'info');
        addLog('│ http         │ REST API endpoints (GET, POST, PUT, etc.)  │', 'success');
        addLog('│ event        │ Pub/Sub events from other functions        │', 'success');
        addLog('│ cron         │ Scheduled execution (every X minutes)      │', 'success');
        addLog('│ streams:join │ User joins a real-time stream              │', 'success');
        addLog('│ streams:leave│ User leaves a real-time stream             │', 'success');
        addLog('│ queue        │ Message from a queue (async processing)    │', 'success');
        addLog('└──────────────┴────────────────────────────────────────────┘', 'info');
        addLog('', 'info');
        addLog('One function, multiple triggers. That\'s the power of iii.', 'success');
        break;

      case 'invoke':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('INVOKING FUNCTIONS', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('// Synchronous invocation (wait for result)', 'warning');
        addLog('const result = await bridge.invokeFunction(', 'success');
        addLog('  "userService.getProfile",', 'success');
        addLog('  { userId: "123" }', 'success');
        addLog(');', 'success');
        addLog('', 'info');
        addLog('// Async invocation (fire and forget)', 'warning');
        addLog('bridge.invokeFunctionAsync(', 'success');
        addLog('  "emailService.sendWelcome",', 'success');
        addLog('  { email: "user@example.com" }', 'success');
        addLog(');', 'success');
        addLog('', 'info');
        addLog('Functions can call OTHER functions across workers!', 'success');
        addLog('Node.JS worker → Python worker? No problem.', 'warning');
        break;

      case 'config':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('CONFIG.YAML - Engine Configuration', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('# config.yaml', 'warning');
        addLog('modules:', 'success');
        addLog('  - class: modules::streams::StreamModule', 'success');
        addLog('    config:', 'success');
        addLog('      port: 31112', 'success');
        addLog('      host: 0.0.0.0', 'success');
        addLog('      auth_function: myApp.authenticate', 'success');
        addLog('      adapter:', 'success');
        addLog('        class: modules::streams::adapters::RedisAdapter', 'success');
        addLog('        config:', 'success');
        addLog('          redis_url: redis://localhost:6379', 'success');
        addLog('', 'info');
        addLog('  - class: modules::rest::RestApiModule', 'success');
        addLog('    config:', 'success');
        addLog('      port: 8080', 'success');
        addLog('', 'info');
        addLog('Drop this file in your project root. iii auto-loads it!', 'warning');
        break;

      case 'compare':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('III vs ALTERNATIVES', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('┌─────────────────┬───────┬──────────┬────────┬────────────┐', 'info');
        addLog('│ Feature         │  iii  │ Temporal │ Dapr   │ Serverless │', 'info');
        addLog('├─────────────────┼───────┼──────────┼────────┼────────────┤', 'info');
        addLog('│ Durable Exec    │   ✓   │    ✓     │   ✗    │     ✗      │', 'success');
        addLog('│ Polyglot        │   ✓   │    ~     │   ✓    │     ✗      │', 'success');
        addLog('│ Real-time       │   ✓   │    ✗     │   ~    │     ✗      │', 'success');
        addLog('│ Single Binary   │   ✓   │    ✗     │   ~    │     ✗      │', 'success');
        addLog('│ Modular         │   ✓   │    ✗     │   ✓    │     ✗      │', 'success');
        addLog('│ Self-Hosted     │   ✓   │    ✓     │   ✓    │     ✗      │', 'success');
        addLog('│ Built in Rust   │   ✓   │    ✗     │   ✗    │     ✗      │', 'success');
        addLog('└─────────────────┴───────┴──────────┴────────┴────────────┘', 'info');
        addLog('', 'info');
        addLog('iii = The kernel that unifies ALL backend patterns.', 'warning');
        break;

      case 'polyglot':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('POLYGLOT SUPPORT', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('Write workers in ANY language:', 'warning');
        addLog('', 'info');
        addLog('  ┌────────────────┬────────────────────────────────────┐', 'info');
        addLog('  │ Language       │ SDK Package                        │', 'info');
        addLog('  ├────────────────┼────────────────────────────────────┤', 'info');
        addLog('  │ TypeScript/JS  │ npm install @iii-dev/sdk           │', 'success');
        addLog('  │ Python         │ pip install iii-py                 │', 'success');
        addLog('  │ Go             │ go get github.com/iii-dev/iii-go   │', 'success');
        addLog('  │ Rust           │ cargo add iii-rs                   │', 'success');
        addLog('  └────────────────┴────────────────────────────────────┘', 'info');
        addLog('', 'info');
        addLog('A TypeScript worker can invoke a Python function.', 'success');
        addLog('A Go service can trigger a Rust handler.', 'success');
        addLog('', 'info');
        addLog('The engine doesn\'t care. It just orchestrates.', 'warning');
        break;
        
      case 'durable':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('DURABLE EXECUTION MODEL', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('What makes execution "durable"?', 'warning');
        addLog('', 'info');
        addLog('  1. REPLAY: If a worker crashes, execution resumes', 'success');
        addLog('     from the last checkpoint, not from scratch.', 'info');
        addLog('', 'info');
        addLog('  2. HISTORY: Every function call is logged. Debug', 'success');
        addLog('     any failure by replaying the exact sequence.', 'info');
        addLog('', 'info');
        addLog('  3. ORDERING: Events processed in order, guaranteed.', 'success');
        addLog('     No race conditions, no lost messages.', 'info');
        addLog('', 'info');
        addLog('  4. LONG-RUNNING: Functions can run for days/weeks.', 'success');
        addLog('     Wait for human input. Sleep. Resume.', 'info');
        addLog('', 'info');
        addLog('This is what separates iii from "serverless".', 'warning');
        break;

      case 'dual-mode':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('DUAL-MODE API PATTERN', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('Your worker can be triggered TWO ways:', 'warning');
        addLog('', 'info');
        addLog('MODE A: MANAGED (Via Engine)', 'success');
        addLog('  • Engine sends X-III-Action: POKE header', 'info');
        addLog('  • Worker wakes, opens WebSocket to Engine', 'info');
        addLog('  • Receives task, executes, reports result', 'info');
        addLog('  • Use case: Heavy workflows, coordinated tasks', 'info');
        addLog('', 'info');
        addLog('MODE B: DIRECT (Via HTTP)', 'success');
        addLog('  • External service POSTs directly to worker URL', 'info');
        addLog('  • Worker executes immediately, returns response', 'info');
        addLog('  • Can STILL access engine for capabilities', 'info');
        addLog('  • Use case: Webhooks, public APIs, fast endpoints', 'info');
        addLog('', 'info');
        addLog('Same code. Two entry points. Maximum flexibility.', 'warning');
        break;

      case 'fabric':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('FABRIC ACCESS PATTERN', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('Scenario: Cloudflare Worker needs GPU access', 'warning');
        addLog('', 'info');
        addLog('  User → POST /resize → Cloudflare Worker', 'info');
        setTimeout(() => addLog('', 'info'), 300);
        setTimeout(() => addLog('  Worker: "I need GPU capability..."', 'info'), 300);
        setTimeout(() => addLog('  Worker: Opening lazy WebSocket to Engine...', 'system'), 600);
        setTimeout(() => addLog('  Engine: Routing to basement GPU server...', 'system'), 900);
        setTimeout(() => addLog('  GPU Server: Processing image...', 'glitch'), 1200);
        setTimeout(() => addLog('  Worker: Received result, returning to user', 'success'), 1500);
        setTimeout(() => {
          addLog('', 'info');
          addLog('Ephemeral workers can borrow HEAVY infrastructure.', 'warning');
          addLog('Public API powered by private GPU. Seamlessly.', 'success');
        }, 1800);
        break;

      case 'poke':
        if (args.length === 0) {
            addLog('Usage: poke <target_url>', 'warning');
          addLog('', 'info');
          addLog('The "poke" wakes up a sleeping/serverless worker.', 'info');
          addLog('Engine sends HTTP with X-III-Action: POKE header.', 'info');
          addLog('Worker boots, connects WebSocket, awaits tasks.', 'info');
        } else {
            addLog(`Poking ${args[0]}...`, 'info');
            setTimeout(() => addLog('Sending X-III-Action: POKE', 'system'), 300);
          setTimeout(() => addLog('Target awakening...', 'info'), 600);
          setTimeout(() => addLog('WebSocket connection established!', 'success'), 1000);
          setTimeout(() => addLog('Worker is now ONLINE and awaiting tasks.', 'success'), 1300);
        }
        break;

      case 'whereis':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('WHERE CAN WORKERS RUN?', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('ANYWHERE with a network connection:', 'warning');
        addLog('', 'info');
        addLog('  ☁️  Cloud Functions', 'success');
        addLog('      AWS Lambda, Google Cloud Functions, Azure', 'info');
        addLog('', 'info');
        addLog('  ⚡  Edge Platforms', 'success');
        addLog('      Cloudflare Workers, Vercel Edge, Deno Deploy', 'info');
        addLog('', 'info');
        addLog('  🖥️  Traditional Servers', 'success');
        addLog('      EC2, GCE, DigitalOcean, bare metal', 'info');
        addLog('', 'info');
        addLog('  🏠  Your Basement', 'success');
        addLog('      Raspberry Pi, home lab, GPU rig', 'info');
        addLog('', 'info');
        addLog('  🐳  Containers', 'success');
        addLog('      Docker, Kubernetes, ECS, Cloud Run', 'info');
        addLog('', 'info');
        addLog('The engine doesn\'t care where. It just orchestrates.', 'warning');
        break;

      case 'rust':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('WHY RUST?', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('The iii Engine is written in Rust because:', 'warning');
        addLog('', 'info');
        addLog('  🚀 SPEED', 'success');
        addLog('     No garbage collector. Near-C performance.', 'info');
        addLog('     Orchestration layer can\'t be a bottleneck.', 'info');
        addLog('', 'info');
        addLog('  💾 MEMORY EFFICIENCY', 'success');
        addLog('     Single binary, minimal footprint.', 'info');
        addLog('     Run on a Raspberry Pi or a 128-core server.', 'info');
        addLog('', 'info');
        addLog('  🔒 SAFETY', 'success');
        addLog('     No null pointers, no data races.', 'info');
        addLog('     The engine CANNOT crash from memory errors.', 'info');
        addLog('', 'info');
        addLog('  🌐 PORTABILITY', 'success');
        addLog('     Compile once, run anywhere.', 'info');
        addLog('     Linux, macOS, Windows. Native binaries.', 'info');
        addLog('', 'info');
        addLog('"Fast languages shouldn\'t be bottlenecked by slow runtimes."', 'warning');
        break;

      case 'credits':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('III - INTEROPERABLE INVOCATION INTERFACE', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('  ╔═══════════════════════════════════════╗', 'success');
        addLog('  ║                                       ║', 'success');
        addLog('  ║             iii                       ║', 'success');
        addLog('  ║                                       ║', 'success');
        addLog('  ║   The Universal Runtime Engine        ║', 'success');
        addLog('  ║                                       ║', 'success');
        addLog('  ╚═══════════════════════════════════════╝', 'success');
        addLog('', 'info');
        addLog('Built with ❤️ and Rust', 'warning');
        addLog('', 'info');
        addLog('Protocol Spec: CC-BY-ND 4.0', 'info');
        addLog('Engine: BSL 1.1', 'info');
        addLog('SDKs & Adapters: Apache 2.0', 'info');
        addLog('', 'info');
        addLog('"Innovate → Implement → Iterate"', 'success');
        addLog('', 'info');
        addLog('© 2025 III, Inc. All rights reserved.', 'info');
        break;

      case 'motia':
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('ACCESS RESTRICTED', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('', 'info');
        addLog('Motia internal protocol detected.', 'warning');
        setTimeout(() => addLog('Clearance Level 4 required.', 'warning'), 400);
        setTimeout(() => addLog('Contact your administrator.', 'info'), 800);
        break;
        
      case 'faq':
        addLog('═══════════════════════════════════════════', 'system');
        addLog('FREQUENTLY ASKED QUESTIONS', 'system');
        addLog('═══════════════════════════════════════════', 'system');
        addLog('', 'info');
        addLog('Q: What IS iii?', 'warning');
        addLog('A: A universal runtime engine that unifies APIs,', 'info');
        addLog('   background jobs, queues, streams, workflows,', 'info');
        addLog('   and AI agents under ONE programming model.', 'info');
        addLog('', 'info');
        addLog('Q: Who is it for?', 'warning');
        addLog('A: Framework builders, platform teams, and IDP', 'info');
        addLog('   teams building internal developer platforms.', 'info');
        addLog('', 'info');
        addLog('Q: What problem does it solve?', 'warning');
        addLog('A: Backend fragmentation. Instead of 5+ tools', 'info');
        addLog('   (queue service, API gateway, workflow engine,', 'info');
        addLog('   event bus, scheduler), you use ONE engine.', 'info');
        addLog('', 'info');
        addLog('Q: Best analogy?', 'warning');
        addLog('A: "The Kernel of Distributed Systems"', 'success');
        addLog('   "The V8 of Distributed Backends"', 'success');
        addLog('   "LLVM for Cloud Compute"', 'success');
        break;

      case 'kill-switch':
        if (!isGodMode) {
          addLog('ACCESS DENIED. ROOT AUTHORIZATION REQUIRED.', 'error');
          addLog('(Hint: ↑↑↓↓←→←→BA)', 'info');
          break;
        }
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('!!! BSL ENFORCEMENT PROTOCOL !!!', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        setTimeout(() => addLog('Scanning for competing services...', 'glitch'), 500);
        setTimeout(() => addLog('Analyzing license compliance...', 'glitch'), 1000);
        setTimeout(() => addLog('VIOLATION DETECTED.', 'error'), 1500);
        setTimeout(() => addLog('TERMINATING LICENSE.', 'error'), 2000);
        setTimeout(() => addLog('[This is a demo. No actual enforcement occurred.]', 'info'), 2500);
        break;

      case 'clear':
        setLogs([]);
        break;

      case 'exit':
        onClose();
        break;

      default:
        addLog(`Command not found: ${command}`, 'error');
        addLog('Type "help" for available commands.', 'info');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  const theme = isGodMode ? {
    border: 'border-red-600',
    bg: 'bg-red-950/20',
    header: 'bg-red-900/40 border-red-600',
    text: 'text-red-500',
    input: 'text-red-500 placeholder-red-700',
    caret: 'text-red-500'
  } : {
    border: 'border-iii-medium',
    bg: 'bg-black',
    header: 'bg-iii-dark border-iii-medium',
    text: 'text-iii-light',
    input: 'text-white placeholder-iii-medium',
    caret: 'text-iii-accent'
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${isGodMode ? 'animate-pulse-fast' : ''}`}>
      <div className={`w-full max-w-4xl ${theme.bg} border ${theme.border} shadow-2xl overflow-hidden crt relative transition-all duration-500`}>
        <div className={`flex items-center justify-between px-4 py-2 ${theme.header} border-b ${theme.border}`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400 transition-colors" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className={`text-xs ${theme.text} font-mono uppercase tracking-wider`}>
            {isGodMode ? 'ROOT_ACCESS // ENGINE_CORE v0.1.0' : 'iii_engine_debug_console v0.1.0-alpha'}
          </span>
        </div>
        
        <div className="h-[28rem] overflow-y-auto p-4 font-mono text-xs md:text-sm space-y-0.5">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 md:gap-3">
              <span className="text-iii-medium shrink-0 text-[10px] md:text-xs">[{log.timestamp}]</span>
              <span className={`break-all whitespace-pre-wrap
                ${log.type === 'error' ? 'text-red-500 font-bold' : ''}
                ${log.type === 'success' ? 'text-iii-accent' : ''}
                ${log.type === 'warning' ? 'text-orange-400' : ''}
                ${log.type === 'system' ? 'text-blue-400' : ''}
                ${log.type === 'info' ? 'text-gray-300' : ''}
                ${log.type === 'glitch' ? 'text-red-500 animate-glitch font-bold bg-red-900/20' : ''}
              `}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        
        <div className={`p-3 md:p-4 border-t ${theme.border} bg-iii-dark/50 flex items-center gap-2`}>
          <span className={`${theme.caret} font-bold`}>{'>'}</span>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 bg-transparent border-none outline-none ${theme.input} font-mono text-sm`}
            placeholder="Enter command... (try 'help')"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
