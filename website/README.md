# iii - Intelligent Invocation Interface

The context-aware execution layer for distributed systems.

## Overview

**iii** is not a dumb pipe. It passes **Context**, **State**, and **Logic** between your systems.

- **I**ntelligent → The Daemon. Discovery, routing, load balancing, context injection.
- **I**nvocation → The Trigger. HTTP, events, streams, state changes—all unified.
- **I**nterface → The SDK. The surface your logic plugs into.

One binary. Infinite systems.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── App.tsx              # Main application component
├── index.tsx            # Entry point
├── index.html           # HTML template
├── types.ts             # TypeScript types
├── components/
│   ├── FeatureBento.tsx # Feature grid component
│   ├── GridBackground.tsx # Animated background
│   ├── LicenseModal.tsx # License modal
│   ├── Logo.tsx         # iii logo
│   ├── ProtocolModal.tsx # Protocol info modal
│   ├── Terminal.tsx     # Easter egg terminal
│   └── VisualArrow.tsx  # Arrow component
```

## Easter Eggs

### Terminal Access
- **Click the logo 3 times** - Opens the debug terminal
- **Type "iii" anywhere** - Opens the debug terminal

### God Mode 🔴
Activate with the **Konami code**: `↑ ↑ ↓ ↓ ← → ← → B A`

**God Mode unlocks exclusive early access documentation:**

| Command | Description |
|---------|-------------|
| `protocol` | WebSocket IPC Protocol Specification - message formats, handshake, execution loop |
| `internals` | Engine architecture - Hub-and-Spoke model, Rust benefits, registries |
| `wake` | Universal Wake-Up mechanism - how iii handles serverless/long-living workers |
| `registry` | Core modules config - API, Cron, Event, Streams modules |
| `roadmap` | Internal development roadmap - active PRs, planned improvements |
| `kill-switch` | BSL enforcement protocol demo |

### Terminal Commands
Once in the terminal, type `help` to see all available commands:
- `status` - Engine status dashboard
- `arch` - ASCII architecture diagram
- `invoke` - Code samples
- `compare` - iii vs alternatives
- `durable` - Durable execution explained
- `credits` - Team credits

## License

- **Protocol Spec**: CC-BY-ND 4.0
- **Engine**: BSL 1.1
- **SDKs & Adapters**: Apache 2.0

---

© 2025 III, Inc. All rights reserved.

