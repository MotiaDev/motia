The structure of the project is as follows:

```
├── engine/                    # iii Engine powered by Rust
├── sdk/                       # SDK to communicate with the Engine
│   └── packages/
│       ├── rust/              # Rust SDK (iii-sdk on crates.io)
│       ├── node/              # Node.js SDK (iii-sdk on npm)
│       └── python/            # Python SDK (iii-sdk on PyPI)
├── motia/                     # Motia Framework
│   ├── motia-js/              # Motia JavaScript Framework
│   │   └── playground/        # Motia TS Examples Playground
│   └── motia-py/              # Motia Python Framework
│       └── playground/        # Motia Python Examples Playground
├── console/                   # iii Console powered by React and Rust
│   └── packages/
│       ├── console-frontend/  # React frontend (embedded in binary)
│       └── console-rust/      # Rust binary (iii-console)
├── docs/                      # iii Documentation powered by Fumadocs/MDX
├── motia-docs/                # Motia Documentation powered by Fumadocs/MDX
├── website/                   # iii Website powered by Vite
├── motia-cloud-api/           # Motia Cloud API powered by Motia Framework
├── chessarena/                # Chess Arena powered by Motia Framework
└── .github/workflows/         # Unified CI/CD pipelines
```

## Monorepo Tooling

This is a unified monorepo with three workspace systems:

- **pnpm workspaces** for all JavaScript/TypeScript packages (see `pnpm-workspace.yaml`)
- **Cargo workspace** for all Rust crates (see root `Cargo.toml`)
- **uv** for Python packages with editable source overrides

**Turborepo** orchestrates JS/TS builds, tests, and linting with dependency-aware task execution and caching (see `turbo.json`).

## Dependency Chain

```
Engine (Rust binary)
  └── depends on → SDK Rust (iii-sdk crate, workspace path reference)

Console (Rust binary + React frontend)
  └── depends on → SDK Rust (iii-sdk crate, workspace path reference)

Motia JS (npm package)
  └── depends on → SDK Node (iii-sdk npm, workspace:^ protocol)

Motia Python (PyPI package)
  └── depends on → SDK Python (iii-sdk PyPI, uv editable source)
```

All SDKs communicate with the Engine over WebSocket at runtime.

## Engine

The core of the project is the Engine. It is a service powered by Rust that provides the core functionality for the project, including the protocol communication.

### Talking to the Engine

The Engine speaks JSON messages over WebSocket.
Key message types defined in: `engine/src/protocol.rs`

## Motia

Motia is a Framework built on top of the iii SDK that provides a higher level of abstraction for building backend services.

The Framework is composed of two languages: JavaScript/TypeScript and Python.

### Motia JavaScript Framework

The Motia JavaScript Framework is built on top of the iii SDK and provides a higher level of abstraction for building backend services.

### Motia Python Framework

The Motia Python Framework is built on top of the iii SDK and provides a higher level of abstraction for building backend services.

### Playground

In both TypeScript and Python languages there is a plethora of examples inside `playground/` folders.

## CI/CD

All CI/CD is managed from `.github/workflows/`:

- **`ci.yml`** - Runs on every push/PR to `main`. Uses path-based change detection to only run affected jobs. Engine changes cascade to all SDK and Motia tests.
- **`release.yml`** - Triggered by `release/v*` tags. Sequentially releases: Engine binaries, SDK packages (npm/PyPI/crates.io), Motia packages, Console binaries.
- Package manager workflows (`publish-engine-homebrew.yml`, `docker-engine.yml`, etc.) are dispatched from the release pipeline.
