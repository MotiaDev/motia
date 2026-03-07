---
name: iii-patterns
description: Coding patterns extracted from the iii monorepo
version: 1.0.0
source: local-git-analysis
analyzed_commits: 200
---

# iii Monorepo Patterns

## Commit Conventions

This project uses **conventional commits** consistently (93%+ compliance):

| Type | Usage | Count |
|------|-------|-------|
| `chore:` | Version bumps, CI tweaks, dependency updates | 40% |
| `feat:` | New features, new modules, API additions | 23% |
| `fix:` | Bug fixes, build fixes, compatibility fixes | 21% |
| `refactor:` | Renames, API changes, code cleanup | 4% |
| `docs:` | README, migration guides, documentation | 4% |

### Scopes

Scopes are used selectively for targeted changes:
- `feat(console):` — Console UI changes
- `fix(motia-js):` — Motia JS framework fixes
- `fix(create):` — `motia create` command fixes
- `feat(telemetry):` — Observability/telemetry changes
- `refactor(state):` — State module changes
- `refactor(runtime):` — Runtime/engine changes

### PR References

Most commits include PR numbers: `feat: add X (#1234)`

## File Co-Change Patterns

### Cross-Language SDK Sync

When SDK APIs change, **both language packages update together**:
- `motia-js/packages/motia/package.json` + `motia-py/packages/motia/pyproject.toml` (changed together 27 times)

### Install Scripts

Install scripts are maintained per binary and change together:
- `cli/install.sh` + `console/install.sh` + `engine/install.sh`

### CI Workflows

CI workflows are frequently iterated on in isolation (deploy.yml changed 22 times).

## Architecture Patterns

### SDK ↔ Engine Protocol

All SDKs communicate with the engine via **WebSocket JSON messages** defined in `engine/src/protocol.rs`. When adding new engine capabilities:
1. Define message type in `protocol.rs`
2. Add handler in the relevant engine module (`engine/src/modules/`)
3. Implement client-side support in each SDK (Node, Python, Rust)

### Module System

Engine features are organized as modules in `engine/src/modules/`:
- Each module registers its own routes/handlers
- Modules are composed in `engine/src/main.rs`
- New capabilities should be added as new modules rather than extending existing ones

### Trigger-Based Architecture

The system uses a trigger pattern where:
- Steps/Functions declare triggers (HTTP, queue, cron, state, stream, pub/sub)
- The engine routes invocations based on trigger type
- Helper functions like `http()`, `queue()`, `cron()` create typed trigger configs

### Version Bumping

Versions are bumped across all packages simultaneously during releases. The commit pattern is:
```
chore: bump versions for release -- iii(iii/v0.X.0)
```

## Testing Patterns

### Node.js (Vitest)
- Tests in `tests/` directories adjacent to source
- Integration tests require a running engine instance
- Engine started with custom config at port 49199 for tests

### Python (pytest + uv)
- Tests in `tests/` directories
- Dev dependencies via `uv sync --extra dev`
- Type checking with mypy, linting with ruff

### Rust (cargo test)
- Tests in `tests/` directories or inline `#[cfg(test)]` modules
- Async tests use `#[tokio::test]`
- Clippy with `-D warnings` (warnings are errors)

## Development Workflows

### Adding a New Engine Module
1. Create module in `engine/src/modules/`
2. Register in engine startup
3. Add WebSocket message types in `protocol.rs`
4. Add SDK support in all three languages
5. Add tests

### Motia Step Development
1. Create step file with trigger config
2. Export handler function
3. Engine auto-discovers via file watcher
4. Test with playground examples

### Release Workflow
1. All tests pass on `main`
2. Push `release/v{version}` tag
3. CI publishes: engine binaries → SDKs (npm/PyPI/crates.io) → Motia → Console → Homebrew/Docker
