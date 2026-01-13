# iii - Interoperable Invocation Interface

ONE BINARY. INFINITE SYSTEMS.

The universal execution kernel for distributed systems.

## Overview

**iii** is a Rust-based runtime that orchestrates distributed systems through a unified protocol.

- **Infrastructure** → Workers, Core Modules living inside the iii Engine
- **Implementation** → Remote Functions that can be executed anywhere
- **Invocation** → Trigger Types and Triggers linking events to functions

Workers self-assemble via Bridge SDK. Functions call remote services like local imports. The entire control plane in a single daemon configured by one YAML file.

## Features

- **Self-Assembling Mesh** - Workers auto-register on boot, no manual service discovery
- **Universal Causality** - Normalize HTTP, DB mutations, hardware interrupts into uniform triggers
- **Stateful Serverless** - Tethers stateless functions to persistent daemon maintaining context
- **Language Agnostic** - Node.js, Python SDKs (Rust coming soon)
- **Protocol Agnostic** - HTTP, WebSocket, gRPC, custom protocols
- **Built-in Observability** - Aggregated logs, traces, metrics
- **WCAG AA Compliant** - Accessible color contrast in both light and dark modes

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling with iii brand colors
- **Responsive Design** - Mobile-first, optimized for all screen sizes

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
├── index.html           # HTML template with Tailwind config
├── types.ts             # TypeScript type definitions
├── globals.css          # Global CSS with color variables
├── components/
│   ├── FeatureBento.tsx           # Feature bento grid
│   ├── GridBackground.tsx         # Animated grid background
│   ├── Terminal.tsx               # Debug terminal (Easter egg)
│   ├── MachineView.tsx            # Machine-readable markdown view
│   ├── Logo.tsx                   # iii logo component
│   ├── ModeToggle.tsx             # Human/Machine mode toggle
│   ├── TechLogos.tsx              # Technology stack logos
│   ├── CodeComparison.tsx         # Before/after code examples
│   ├── Features.tsx               # Feature showcase
│   ├── PersonaValueProps.tsx      # Role-specific value props
│   ├── ValueProps.tsx             # General value propositions
│   └── ...                        # Additional components
└── lib/
    └── cssVariables.ts            # CSS variable utilities
```

## Easter Eggs

### Terminal Access
Three ways to open the debug terminal:
1. **Click the logo 3 times** - Triple-click activation
2. **Type "iii"** - Type anywhere on the page
3. **Press 'T'** - Keyboard shortcut

### God Mode 🔴
Activate with the **Konami code**: `↑ ↑ ↓ ↓ ← → ← → B A`

**God Mode unlocks privileged commands:**

| Command | Description |
|---------|-------------|
| `internals` | Engine internals & architecture - registries, Rust benefits, hub-and-spoke model |
| `roadmap` | Internal development roadmap - active PRs, planned improvements, target users |
| `wake` | Universal wake-up mechanism - how iii handles worker lifecycle |
| `registry` | Internal registries state - WorkerRegistry, FunctionsRegistry, TriggerRegistry |
| `perf` | Performance metrics & bottlenecks - serialization, latency, memory profile |
| `debug` | Debug mode & tracing config - tracing infrastructure, log levels, debugging tips |
| `unsafe` | Unsafe operations & memory stats - Rust safety, thread model, potential issues |
| `kill-switch` | BSL enforcement protocol demo (theatrical) |

### Terminal Commands
Once in the terminal, type `help` to see all available commands:

**Getting Started:**
- `install` - Installation instructions
- `quickstart` - Get started guide
- `version` - Engine version info

**Engine:**
- `status` - Check engine status
- `modules` - List active modules
- `config` - Configuration example
- `ports` - Show active ports

**Development:**
- `sdk` - SDK installation & usage
- `register` - Function registration example
- `triggers` - Trigger types (api, event, cron)
- `protocol` - WebSocket protocol messages

**Architecture:**
- `arch` - System architecture diagram
- `adapters` - Adapter ecosystem
- `workers` - Worker connection info
- `redis` - Redis integration

**System:**
- `clear` - Clear console
- `exit` - Close terminal

## View Modes

### Human Mode (Default)
Beautiful, interactive UI with:
- Bento grid feature showcase
- Code comparison examples
- Role-specific value propositions
- Animated backgrounds
- Responsive design

### Machine Mode
Toggle to Machine Mode for AI-friendly content:
- Comprehensive markdown documentation
- Code examples with before/after comparisons
- Use cases and problem statements
- Protocol specifications
- Comparison tables with alternatives
- Complete API reference

## Accessibility

- **WCAG 2.1 AA Compliant** - All color combinations meet contrast standards
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Touch-friendly** - Enhanced tap targets for mobile devices
- **Keyboard Navigation** - Full keyboard support

## License

- **Protocol Spec**: CC-BY-ND 4.0
- **Engine**: BSL 1.1
- **SDKs & Adapters**: Apache 2.0

---

© 2025 III, Inc. All rights reserved.
