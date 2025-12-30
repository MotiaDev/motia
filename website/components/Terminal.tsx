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
        addLog('═══ COMMANDS ═══', 'system');
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
        if (isGodMode) {
          addLog('', 'info');
          addLog('🔴 ROOT ACCESS COMMANDS:', 'error');
          addLog('  protocol    - WebSocket IPC Protocol Spec', 'error');
          addLog('  internals   - Engine internals & architecture', 'error');
          addLog('  wake        - Universal Wake-Up mechanism', 'error');
          addLog('  registry    - Worker & Function Registry', 'error');
          addLog('  roadmap     - Future development plans', 'error');
          addLog('  kill-switch - BSL enforcement demo', 'error');
        }
        break;
        
      case 'status':
        addLog('═══ ENGINE STATUS ═══', 'system');
        addLog('', 'info');
        addLog('Engine:      ████ ONLINE', 'success');
        addLog('Workers:     0 connected', 'info');
        addLog('Invocations: 0 pending', 'info');
        addLog('Triggers:    READY', 'success');
        addLog('Adapters:    5 loaded', 'info');
        addLog('Version:     v0.1.0-alpha', 'warning');
        break;

      case 'arch':
      case 'architecture':
      case 'diagram':
        addLog('═══ ARCHITECTURE ═══', 'system');
        addLog('', 'info');
        addLog('┌─────────────────┐', 'warning');
        addLog('│  III ENGINE     │ ← Rust Core', 'warning');
        addLog('└───────┬─────────┘', 'warning');
        addLog('        │', 'info');
        addLog('        ▼', 'info');
        addLog('┌─────────────────┐', 'info');
        addLog('│ CORE MODULES    │', 'info');
        addLog('├─────────────────┤', 'info');
        addLog('│ • REST API      │', 'success');
        addLog('│ • Streams       │', 'success');
        addLog('│ • Events        │', 'success');
        addLog('│ • Cron          │', 'success');
        addLog('└───────┬─────────┘', 'info');
        addLog('        │', 'info');
        addLog('        ▼', 'info');
        addLog('┌─────────────────┐', 'info');
        addLog('│ ADAPTERS        │', 'info');
        addLog('│ Redis│Postgres  │', 'info');
        addLog('└───────┬─────────┘', 'info');
        addLog('        │', 'info');
        addLog('        ▼', 'info');
        addLog('┌─────────────────┐', 'success');
        addLog('│ WORKERS         │', 'success');
        addLog('│ Node│Python│Go  │ ← Via Bridge', 'success');
        addLog('└─────────────────┘', 'success');
        addLog('', 'info');
        addLog('Flow: Engine → Modules → Adapters → Workers', 'warning');
        break;

      case 'modules':
        addLog('═══ CORE MODULES ═══', 'system');
        addLog('Built with Rust', 'warning');
        addLog('', 'info');
        addLog('► REST API', 'success');
        addLog('  HTTP triggers & routing', 'info');
        addLog('', 'info');
        addLog('► Streams', 'success');
        addLog('  Real-time durable data', 'info');
        addLog('', 'info');
        addLog('► Events', 'success');
        addLog('  Pub/Sub messaging', 'info');
        addLog('', 'info');
        addLog('► Cron', 'success');
        addLog('  Scheduled tasks', 'info');
        addLog('', 'info');
        addLog('► Exec', 'success');
        addLog('  Shell commands', 'info');
        addLog('', 'info');
        addLog('► Logging', 'success');
        addLog('  Centralized logs', 'info');
        addLog('', 'info');
        addLog('Type "config" for module setup.', 'warning');
        break;

      case 'adapters':
        addLog('═══ ADAPTER ECOSYSTEM ═══', 'system');
        addLog('', 'info');
        addLog('Streams Module:', 'warning');
        addLog('  ✓ Redis (Pub/Sub + KV)', 'success');
        addLog('  ○ Kafka (coming)', 'info');
        addLog('', 'info');
        addLog('Events Module:', 'warning');
        addLog('  ✓ Redis', 'success');
        addLog('  ✓ RabbitMQ', 'success');
        addLog('', 'info');
        addLog('REST API Module:', 'warning');
        addLog('  ✓ Direct HTTP', 'success');
        addLog('', 'info');
        addLog('Database:', 'warning');
        addLog('  ○ Postgres (coming)', 'info');
        addLog('  ○ MySQL (coming)', 'info');
        addLog('      └─► Postgres Adapter', 'info');
        addLog('      └─► MySQL Adapter', 'info');
        addLog('', 'info');
        addLog('License: Apache 2.0 - Community contributions welcome!', 'success');
        break;

      case 'bridge':
        addLog('═══ BRIDGE SDK ═══', 'system');
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
        addLog('═══ TRIGGERS ═══', 'system');
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
        addLog('═══ INVOKE ═══', 'system');
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
        addLog('═══ CONFIG.YAML ═══', 'system');
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
        addLog('═══ III vs OTHERS ═══', 'system');
        addLog('', 'info');
        addLog('vs Temporal:', 'warning');
        addLog('  ✓ Both: Durable execution', 'info');
        addLog('  ✓ iii: Single binary, real-time', 'success');
        addLog('', 'info');
        addLog('vs Dapr:', 'warning');
        addLog('  ✓ Both: Polyglot, modular', 'info');
        addLog('  ✓ iii: Durable exec, Rust core', 'success');
        addLog('', 'info');
        addLog('vs Serverless:', 'warning');
        addLog('  ✓ iii: Self-hosted, polyglot', 'success');
        addLog('  ✓ iii: Real-time streams', 'success');
        addLog('', 'info');
        addLog('iii = Unifies ALL patterns.', 'warning');
        break;

      case 'polyglot':
        addLog('═══ POLYGLOT ═══', 'system');
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
        addLog('═══ DURABLE EXECUTION ═══', 'system');
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
        addLog('═══ DUAL-MODE ═══', 'system');
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
        addLog('═══ FABRIC ACCESS ═══', 'system');
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
        addLog('═══ WHEREIS ═══', 'system');
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
        addLog('═══ WHY RUST? ═══', 'system');
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
        addLog('═══ CREDITS ═══', 'system');
        addLog('', 'info');
        addLog('iii', 'success');
        addLog('Intelligent Invocation Interface', 'success');
        addLog('', 'info');
        addLog('I - Intelligent (The Daemon)', 'info');
        addLog('I - Invocation (The Trigger)', 'info');
        addLog('I - Interface (The SDK)', 'info');
        addLog('', 'info');
        addLog('Built with ❤️ and Rust', 'warning');
        addLog('', 'info');
        addLog('"Context-Aware Execution"', 'success');
        addLog('', 'info');
        addLog('© 2025 III, Inc.', 'info');
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
        addLog('═══ FAQ ═══', 'system');
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

      case 'protocol':
        if (!isGodMode) {
          addLog('ACCESS DENIED. ROOT AUTHORIZATION REQUIRED.', 'error');
          addLog('(Hint: ↑↑↓↓←→←→BA)', 'info');
          break;
        }
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('🔴 IPC PROTOCOL SPECIFICATION', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('', 'info');
        addLog('Workers connect via WebSocket at ws://<engine>/', 'warning');
        addLog('All messages are JSON. Key message types:', 'info');
        addLog('', 'info');
        addLog('► RegisterFunction', 'success');
        addLog('  { "type": "registerfunction",', 'info');
        addLog('    "functionPath": "myService.process",', 'info');
        addLog('    "request_format": {...},', 'info');
        addLog('    "response_format": {...} }', 'info');
        addLog('', 'info');
        addLog('► RegisterTrigger', 'success');
        addLog('  { "type": "registertrigger",', 'info');
        addLog('    "triggerType": "api|cron|event",', 'info');
        addLog('    "functionPath": "...",', 'info');
        addLog('    "config": { api_path, http_method... } }', 'info');
        addLog('', 'info');
        addLog('► InvokeFunction (Engine → Worker)', 'success');
        addLog('  { "type": "invokefunction",', 'info');
        addLog('    "invocationId": "uuid",', 'info');
        addLog('    "data": {...} }', 'info');
        addLog('', 'info');
        addLog('► InvocationResult (Worker → Engine)', 'success');
        addLog('  { "type": "invocationresult",', 'info');
        addLog('    "invocationId": "uuid",', 'info');
        addLog('    "result": {...} }', 'info');
        break;

      case 'internals':
        if (!isGodMode) {
          addLog('ACCESS DENIED. ROOT AUTHORIZATION REQUIRED.', 'error');
          addLog('(Hint: ↑↑↓↓←→←→BA)', 'info');
          break;
        }
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('🔴 ENGINE INTERNALS', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('', 'info');
        addLog('THE CORE IDEA:', 'warning');
        addLog('iii is an engine enabling interoperability between', 'info');
        addLog('different systems regardless of language. It has a', 'info');
        addLog('protocol to communicate with workers.', 'info');
        addLog('', 'info');
        addLog('HUB-AND-SPOKE MODEL:', 'warning');
        addLog('  Hub (Engine): Manages state, triggers, modules', 'info');
        addLog('  Spokes (Workers): Execute business logic', 'info');
        addLog('', 'info');
        addLog('KEY REGISTRIES (Arc<RwLock>):', 'warning');
        addLog('  • WorkerRegistry - Connected workers', 'info');
        addLog('  • FunctionsRegistry - Registered capabilities', 'info');
        addLog('  • TriggerRegistry - Event/Cron/API mappings', 'info');
        addLog('', 'info');
        addLog('RUST BENEFITS:', 'success');
        addLog('  • Memory efficient - no GC pauses', 'info');
        addLog('  • Fast - no bottleneck for Go/Rust workers', 'info');
        addLog('  • Single binary orchestrates everything', 'info');
        addLog('', 'info');
        addLog('CURRENT CONCERNS:', 'warning');
        addLog('  • JSON serialization overhead (perf ok for now)', 'info');
        addLog('  • Redis cron lock TTL (30s, no heartbeat yet)', 'info');
        addLog('  • Considering binary serialization (MsgPack/Proto)', 'info');
        break;

      case 'wake':
        if (!isGodMode) {
          addLog('ACCESS DENIED. ROOT AUTHORIZATION REQUIRED.', 'error');
          addLog('(Hint: ↑↑↓↓←→←→BA)', 'info');
          break;
        }
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('🔴 UNIVERSAL WAKE-UP MECHANISM', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('', 'info');
        addLog('THE INSIGHT:', 'warning');
        addLog('Engine doesn\'t need "Ephemeral" or "Long-Living"', 'info');
        addLog('concepts. Those are human distinctions.', 'info');
        addLog('', 'info');
        addLog('FROM ENGINE\'S PERSPECTIVE:', 'success');
        addLog('  • ONLINE: Active WebSocket connection', 'info');
        addLog('  • OFFLINE: Has a URL to make one appear', 'info');
        addLog('', 'info');
        addLog('THE UNIVERSAL LOOP:', 'warning');
        addLog('  1. Task arrives', 'info');
        addLog('  2. Compatible worker connected? → Dispatch', 'info');
        addLog('  3. No worker? Check registry for Trigger_URL', 'info');
        addLog('     → YES: Poke the URL, wait for connect', 'info');
        addLog('     → NO: Queue task (wait for human)', 'info');
        addLog('', 'info');
        addLog('HANDLES EVERYTHING:', 'success');
        addLog('  • Serverless: Poke → Wake → Run → Die', 'info');
        addLog('  • Local Server: Poke → Boot → Connect', 'info');
        addLog('  • Autoscaling: Poke → Cloud decides how', 'info');
        addLog('', 'info');
        addLog('Bridge decides lifecycle, NOT Engine.', 'warning');
        break;

      case 'registry':
        if (!isGodMode) {
          addLog('ACCESS DENIED. ROOT AUTHORIZATION REQUIRED.', 'error');
          addLog('(Hint: ↑↑↓↓←→←→BA)', 'info');
          break;
        }
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('🔴 WORKER & FUNCTION REGISTRY', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('', 'info');
        addLog('CORE MODULES (config.yaml):', 'warning');
        addLog('', 'info');
        addLog('modules::api::RestApiModule', 'success');
        addLog('  port, cors, default_timeout', 'info');
        addLog('  Enables HTTP triggers and routing', 'info');
        addLog('', 'info');
        addLog('modules::cron::CronModule', 'success');
        addLog('  adapter: Redis for distributed locking', 'info');
        addLog('  Enables scheduled tasks', 'info');
        addLog('', 'info');
        addLog('modules::event::EventModule', 'success');
        addLog('  adapter: Redis for Pub/Sub', 'info');
        addLog('  Enables event-driven messaging', 'info');
        addLog('', 'info');
        addLog('modules::streams::StreamModule', 'success');
        addLog('  Real-time WebSocket sync for clients', 'info');
        addLog('', 'info');
        addLog('BUILT-IN HOST FUNCTIONS:', 'warning');
        addLog('  events.emit - Publish to global bus', 'info');
        addLog('  logger.* - Centralized logging with tracing', 'info');
        addLog('  streams.set/get/delete - Real-time state', 'info');
        break;

      case 'roadmap':
        if (!isGodMode) {
          addLog('ACCESS DENIED. ROOT AUTHORIZATION REQUIRED.', 'error');
          addLog('(Hint: ↑↑↓↓←→←→BA)', 'info');
          break;
        }
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('🔴 INTERNAL ROADMAP', 'error');
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        addLog('', 'info');
        addLog('ACTIVE DEVELOPMENT:', 'success');
        addLog('  ✓ Built-in KV storage (PR #44)', 'info');
        addLog('  ✓ New module registry system (PR #49)', 'info');
        addLog('  ✓ Motia moved to separate repo (PR #50)', 'info');
        addLog('', 'info');
        addLog('PLANNED IMPROVEMENTS:', 'warning');
        addLog('  • Binary serialization (MsgPack/Protobuf)', 'info');
        addLog('  • Heartbeat for long-running cron jobs', 'info');
        addLog('  • Bun Docker image support', 'info');
        addLog('', 'info');
        addLog('ARCHITECTURAL NOTES:', 'warning');
        addLog('  • Engine struct uses Arc refs (watch for cycles)', 'info');
        addLog('  • JSON serialization passed stress tests', 'info');
        addLog('  • Redis SET NX PX for cron locks (30s TTL)', 'info');
        addLog('', 'info');
        addLog('TARGET USERS:', 'success');
        addLog('  Framework developers building on iii', 'info');
        addLog('  Motia users won\'t see iii directly', 'info');
        addLog('  Core contributors only', 'info');
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
      <div className={`w-full max-w-4xl ${theme.bg} border ${theme.border} shadow-2xl overflow-hidden relative transition-all duration-500 rounded-lg`}>
        {/* Header */}
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
        
        {/* Content area */}
        <div className="h-[28rem] overflow-y-auto p-4 font-mono text-xs md:text-sm space-y-1 bg-black">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2 md:gap-3">
              <span className="text-iii-medium/60 shrink-0 text-[10px] md:text-xs">[{log.timestamp}]</span>
              <span className={`break-all whitespace-pre-wrap leading-relaxed
                ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                ${log.type === 'success' ? 'text-iii-accent' : ''}
                ${log.type === 'warning' ? 'text-amber-400' : ''}
                ${log.type === 'system' ? 'text-cyan-400' : ''}
                ${log.type === 'info' ? 'text-gray-300' : ''}
                ${log.type === 'glitch' ? 'text-red-400 animate-glitch font-bold bg-red-900/20' : ''}
              `}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        
        {/* Footer */}
        <div className={`p-3 md:p-4 border-t ${theme.border} bg-iii-dark/80 flex items-center gap-2`}>
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
