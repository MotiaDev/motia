# Agents

## Cursor Cloud specific instructions

### Architecture Overview

Motia is a unified backend framework built around "Steps" (files with `config` + `handler`). The iii engine (Rust-based, runs in Docker) provides the runtime for queues, state, streams, cron, API routing, and observability. JS/TS and Python SDKs connect to it via WebSocket.

- **motia-js/**: JS/TS SDK monorepo (pnpm workspace). Packages: `motia` (SDK+CLI), `stream-client*`, `playground`.
- **motia-py/**: Python SDK with its own playground.

### Node.js & pnpm

- Node.js v22 is used in CI. Install via `nvm install 22`.
- pnpm v10.11.0 is pinned in the root `package.json`. Use `corepack enable && corepack prepare pnpm@10.11.0 --activate`.
- After `pnpm install`, run `pnpm rebuild esbuild protobufjs unrs-resolver` to compile native addons (build scripts are blocked by default; do NOT run the interactive `pnpm approve-builds`).

### Python SDK

- Python 3.12+ with `uv` package manager.
- The SDK venv is at `motia-py/packages/motia/.venv`. Create with `uv venv`, install with `uv pip install -e ".[dev]"`.
- The playground venv is at `motia-py/playground/.venv`.

### iii Engine (Docker)

Docker is required. The iii engine runs via `iiidev/iii:build-amd64`. In this cloud VM environment:
- Docker port mapping via `-p` works but `--network=host` does not.
- For the **test** config: `sudo docker run -d --name iii-engine -p 49199:49199 -p 3199:3199 -p 3112:3112 -v /workspace/.github/actions/iii-engine/config-test.yaml:/app/config.yaml:ro -e RUST_LOG=info iiidev/iii:build-amd64`
- For the **playground** (dev): use `motia-js/playground/config-docker.yaml` (binds to `0.0.0.0` instead of `127.0.0.1`) with ports 49134, 3111, 3112, 3113.
- The original `config.yaml` binds to `127.0.0.1`, which is unreachable from outside the container. `config-docker.yaml` fixes this.

### Running the Dev Environment

1. Start the iii engine Docker container (see above).
2. Build: `cd motia-js && pnpm --filter='!@iii/motia-example' -r build`
3. Build playground: `cd motia-js/playground && node ../packages/motia/dist/new/cli.mjs dev`
4. Run playground worker: `cd motia-js/playground && node --enable-source-maps dist/index-dev.js`
5. API is available at `http://localhost:3111/hello`.

### Lint / Test / Build Commands

See `motia-js/MONOREPO-README.md` for full script reference. Key commands from `motia-js/`:
- **Lint**: `pnpm lint` (Biome). CI uses `pnpm lint:ci` (changed files only). Pre-existing warnings in playground code are expected.
- **Test (JS)**: `pnpm test` (unit only), `pnpm test:ci` (unit + integration, requires iii engine). Set `III_URL=ws://localhost:49199` for integration tests.
- **Test (Python)**: `cd motia-py/packages/motia && source .venv/bin/activate && pytest tests/ -m "not integration"`
- **Build**: `pnpm --filter='!@iii/motia-example' -r build` (all SDK packages).
- **Python lint**: `cd motia-py/packages/motia && source .venv/bin/activate && ruff check src/`

### Gotchas

- The `motia dev` CLI command only builds `dist/index-dev.js`; it does not start a dev server. To connect to the engine, run `node dist/index-dev.js` separately.
- When running `npx motia` from the playground, ensure no Python venv is active, or the Python `motia` CLI will shadow the JS one. Use `node ../packages/motia/dist/new/cli.mjs` directly.
- Docker daemon startup in this VM: `sudo dockerd &>/dev/null &` (wait ~5s).
- Use `sudo docker` for Docker commands (user may not be in docker group in a fresh session).
