# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**iii** is a unified backend runtime engine (Rust) with SDKs in Node.js, Python, and Rust. The engine manages Functions and Triggers — workers register functions via WebSocket, and the engine handles routing, retries, and observability. **Motia** is a higher-level framework built on the iii SDKs that introduces Steps as a single primitive for APIs, background jobs, queues, workflows, and streaming.

## Monorepo Structure

Three workspace systems coexist:
- **pnpm workspaces** — JS/TS packages (`pnpm-workspace.yaml`)
- **Cargo workspace** — Rust crates (root `Cargo.toml`)
- **uv** — Python packages with editable source overrides

Key directories:
- `engine/` — Rust engine binary (Tokio, Axum). Protocol defined in `engine/src/protocol.rs`
- `sdk/packages/node/iii/` — Node.js/TypeScript SDK
- `sdk/packages/python/iii/` — Python SDK
- `sdk/packages/rust/iii/` — Rust SDK
- `frameworks/motia/motia-js/` — Motia JS framework (depends on SDK Node via `workspace:^`)
- `frameworks/motia/motia-py/` — Motia Python framework (depends on SDK Python via uv editable)
- `console/packages/console-frontend/` — React frontend (Vite, TailwindCSS, TanStack Router)
- `console/packages/console-rust/` — Console Rust binary (Axum, embeds frontend)
- `cli/` — iii-cli binary manager/dispatcher
- `docs/` — iii documentation (Fumadocs/MDX)
- `frameworks/motia/docs/` — Motia documentation

Dependency chain: Engine → SDK Rust; Console → SDK Rust; Motia JS → SDK Node; Motia Python → SDK Python. All SDKs communicate with the engine over WebSocket at runtime.

## Build & Development Commands

```bash
# Install JS/TS dependencies
pnpm install

# Build all JS/TS packages (via Turborepo)
pnpm build

# Build Rust workspace
cargo build --release
cargo build --release -p iii          # engine only
cargo build --release -p iii-console  # console only

# Build console (frontend + backend)
pnpm build:console
```

## Testing

```bash
# All JS/TS tests
pnpm test

# Targeted
pnpm test:sdk-node          # Node.js SDK (Vitest)
pnpm test:motia-js           # Motia JS (Vitest)
pnpm test:engine             # Engine (cargo test)
pnpm test:rust               # All Rust workspace
pnpm test:sdk-rust           # Rust SDK
cargo test -p iii-sdk --all-features   # Single Rust crate

# Python SDK
cd sdk/packages/python/iii && uv sync --extra dev && uv run pytest

# Motia Python
cd frameworks/motia/motia-py/packages/motia && uv sync --extra dev && uv run pytest
```

Node.js SDK integration tests start the engine with a custom config at port 49199. Env vars: `III_BRIDGE_URL`, `III_HTTP_URL`.

## Linting & Formatting

```bash
pnpm fmt              # Biome format + cargo fmt
pnpm fmt:check        # Check without writing
pnpm lint             # Lint all JS/TS (Biome)
pnpm lint:rust        # cargo clippy with -D warnings
pnpm type-check       # TypeScript type checking
```

Biome config: spaces (2), line width 120, single quotes, trailing commas, semicolons as needed, `noVar` enforced.

## Dev Servers

```bash
pnpm dev:docs          # iii docs
pnpm dev:motia-docs    # Motia docs
pnpm dev:website       # iii website
pnpm dev:console       # Console frontend (Vite, port 5173)
```

## Engine Ports

| Port  | Purpose |
|-------|---------|
| 49134 | WebSocket (worker connections) |
| 3111  | HTTP API |
| 3112  | Stream API |
| 9464  | Prometheus metrics |

## Release Process

Triggered by pushing a `release/v*` tag (e.g., `git tag release/v0.8.0 && git push origin release/v0.8.0`). Pre-releases use suffixes: `-alpha`, `-beta`, `-rc`. The pipeline runs all tests, then publishes: engine binaries (GitHub Releases), SDKs (npm/PyPI/crates.io), Motia packages, console binaries, Homebrew tap, and Docker image.

## Docker

```bash
docker pull iiidev/iii:latest
docker run -p 3111:3111 -p 49134:49134 -v ./config.yaml:/app/config.yaml:ro iiidev/iii:latest
```

Dev stack: `docker compose -f engine/docker-compose.yml up` (engine + Redis + RabbitMQ).

## CI Change Detection

Engine changes cascade to all SDK and Motia tests. SDK changes cascade to their respective Motia tests. Console/docs/website changes trigger only their own builds.

## Conventions

- Commit messages: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci)
- Rust: `cargo clippy` with `-D warnings`, `cargo fmt`
- JS/TS: Biome for linting and formatting
- Python: ruff for linting, mypy for type checking, pytest for tests
