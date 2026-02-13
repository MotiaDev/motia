# CI/CD Workflows

This document describes all GitHub Actions workflows, their triggers, and how they connect to form the Motia release pipeline.

## Overview

```
Pull Request                          Manual Dispatch                    Tag Push (v*)
     │                                  │         │         │                  │
     ├─► ci-node.yml (JS changes)      │         │         │                  │
     ├─► ci-python.yml (Py changes)    │         │         │                  │
     ├─► pr-validation.yml             │         │         │                  │
     └─► dependency-review.yml         │         │         │                  │
                                       │         │         │                  │
                             create-tag.yml      │         │            deploy.yml
                                  │          wip-release   wip-release        │
                                  │           -npm.yml      -pypi.yml         │
                                  │              │              │             │
                                  └─ pushes tag ─┼──────────────┼────────────►│
                                                 │              │    ┌────────┼──────────┐
                                                 ▼              ▼    │        │          │
                                                NPM           PyPI  │  ┌─────┼─────┐    │
                                                                    │  │     │     │    │
                                                                  Test  Test  │  Create  │
                                                                  Node  Py   │  Release │
                                                                    │     │  │     │    │
                                                                    └─────┘──┘     │    │
                                                                         │    Publish  Publish
                                                                         │     NPM     PyPI
                                                                         │       │       │
                                                                         └───────┴───────┘
                                                                                     │
                                                                               notify-complete
```

## Security Hardening

All workflows follow these security practices:

- **SHA-pinned actions**: All third-party GitHub Actions are pinned to exact commit SHAs with version comments (e.g., `actions/checkout@11bd719...  # v4.2.2`)
- **Least-privilege permissions**: Top-level `permissions: {}` with per-job scoping where needed
- **Script injection prevention**: All `${{ }}` interpolations in `run:` scripts are passed through `env:` blocks instead of inline substitution
- **Scoped app tokens**: GitHub App tokens request only the permissions they need via the `permissions` parameter
- **OIDC trusted publishing**: PyPI publishing uses OpenID Connect instead of stored API tokens (where configured)
- **Concurrency controls**: Deploy pipeline prevents parallel releases; CI cancels superseded PR runs
- **Job timeouts**: All jobs have `timeout-minutes` to prevent hung workflows

## Workflows

### `ci-node.yml` — Node.js CI (Path-Filtered)

**Trigger**: Pull requests and pushes to `main` that modify `motia-js/**`, the workflow file itself, or `.github/actions/setup/**`

Runs Node.js quality checks only when JavaScript/TypeScript code changes.

**Jobs**:

| Job | What it runs | Working directory |
|-----|-------------|-------------------|
| `quality-node` | `pnpm lint:ci` (Biome) + `pnpm test:ci` (Jest) | `motia-js/` |

- Concurrency: cancels in-progress runs on new PR pushes
- Job timeout: 15 minutes

---

### `ci-python.yml` — Python CI (Path-Filtered)

**Trigger**: Pull requests and pushes to `main` that modify `motia-py/**` or the workflow file itself

Runs Python quality checks only when Python code changes.

**Jobs**:

| Job | What it runs | Working directory |
|-----|-------------|-------------------|
| `quality-python` | `ruff check src` + `mypy src` + `pytest` | `motia-py/packages/motia/` |

- Python runs on a matrix: **3.10, 3.11, 3.12**
- Concurrency: cancels in-progress runs on new PR pushes
- Job timeout: 15 minutes

---

### `motia.yml` — Full CI (Reusable Workflow)

**Trigger**: `workflow_call` (called by `deploy.yml`) or `workflow_dispatch` (manual fallback)

Runs both Node.js and Python quality checks. No longer triggered directly by PR/push — use `ci-node.yml` and `ci-python.yml` for that. This workflow exists as a reusable workflow for the release pipeline and as a manual fallback to run all checks.

**Jobs**:

| Job | What it runs | Working directory |
|-----|-------------|-------------------|
| `quality-node` | `pnpm lint:ci` (Biome) + `pnpm test:ci` (Jest) | `motia-js/` |
| `quality-python` | `ruff check src` + `mypy src` + `pytest` | `motia-py/packages/motia/` |

- Python runs on a matrix: **3.10, 3.11, 3.12**
- Job timeout: 15 minutes

**Note**: Branch protection rules should reference `CI - Node.js` and `CI - Python` workflow names (not `Motia CI`).

---

### `pr-validation.yml` — Pull Request Checks

**Trigger**: Pull request opened, edited, or reopened (uses `pull_request_target`)

Two jobs:

**1. Validate PR Title** — Enforces [conventional commits](https://www.conventionalcommits.org/) format in PR titles:
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Scope: optional
- Subject must not start with an uppercase character

**2. Welcome First-Time Contributors** — Automatically comments a welcome message and adds `first-time-contributor` label on first PRs.

- Job timeout: 5 minutes

---

### `create-tag.yml` — Version Tagging

**Trigger**: Manual workflow dispatch

Creates and pushes a semantic version tag to trigger the release pipeline. Now also updates version files (`package.json`, `pyproject.toml`) before tagging for consistency.

**Inputs**:

| Input | Description | Options |
|-------|-------------|---------|
| `bump` | Type of version bump | `patch`, `minor`, `major` |
| `pre_release` | Pre-release label (none = stable) | `none`, `alpha`, `beta`, `rc` |

**Flow**:
1. **Pre-flight checks** — verifies version files exist, on main branch, not behind origin
2. **Get latest stable tag** — filters to `^v[0-9]+\.[0-9]+\.[0-9]+$` only
3. **Calculate new version** — standard semver bump + auto-increment pre-release numbers
4. **PEP 440 conversion** — for pre-releases: `1.2.3-beta.1` → `1.2.3b1` (Python compatible)
5. **Update version files** — `package.json` and `pyproject.toml` (PEP 440 for Python)
6. **Validate versions** — grep both files and confirm they match expected values
7. **Commit version bump** — `chore: bump version to vX.Y.Z`
8. **Generate changelog** — `git log` last 20 non-merge commits since last stable tag
9. **Create and push annotated tag**
10. **Slack notification** — post tag info + changelog preview via webhook

**Version source of truth**: Version files are updated in the repository before tagging. The tag points to a commit with correct version files.

**Authentication**: Uses GitHub App token (`MOTIA_CI_APP_ID` / `MOTIA_CI_APP_PRIVATE_KEY`) to push commits and tags that trigger downstream workflows.

---

### `deploy.yml` — Release Pipeline

**Trigger**: Tag push matching `v*`

The main release workflow with progressive Slack notifications. Publishes to both NPM and PyPI from a single version tag.

**Jobs (in order)**:

#### 1. Initialize Slack Notification (`notify-start`)
- Posts initial Slack message with status indicators
- Saves Slack message timestamp as artifact for cross-workflow access

#### 2. Detect Pre-release (`detect-prerelease`)
- Parses tag for `-beta`, `-alpha`, `-rc` suffixes
- Outputs: `is_prerelease`, `npm_tag`, `version`, `tag_name`

#### 3. Test Node.js (`test-node`)
- Runs Node.js lint (Biome) + tests (Jest)

#### 4. Test Python (`test-python`)
- Single Python 3.12 (no matrix for faster release)
- Lints with ruff, type-checks with mypy, runs unit tests with pytest
- Skips integration tests (`pytest -m "not integration"`)

#### 5. Create GitHub Release (`create-release`)
- Needs: `notify-start`, `detect-prerelease`, `test-node`, `test-python`
- Creates release with auto-generated release notes
- Updates Slack: "Tests passed, release created, publishing..."

#### 6. Publish to NPM (`publish-npm`)
- Needs: `detect-prerelease`, `create-release`
- Stamps `package.json` with version from tag (not committed)
- Publishes with `--provenance` for supply chain security
- NPM dist-tag based on pre-release suffix

#### 7. Publish to PyPI (`publish-pypi`)
- Needs: `detect-prerelease`, `create-release`
- Stamps `pyproject.toml` with version from tag via `sed` (not committed)
- Builds with `python -m build` and publishes via `pypa/gh-action-pypi-publish`

#### 8. Update Release Status (`notify-complete`)
- Needs: `notify-start`, `publish-npm`, `publish-pypi`
- `if: always()` — runs regardless of publish outcomes
- Updates Slack with final status: checkmark/x for each package

**Dependency chain**:
```
notify-start ─────────────────────┐
detect-prerelease ────────────────┤
test-node ────────────────────────┤
test-python ──────────────────────┤
                                  ├──► create-release ──┬──► publish-npm ───┐
                                  │                     └──► publish-pypi ──┤
                                  └────────────────────────────────────────┴──► notify-complete
```

- Concurrency: prevents parallel deploys for the same tag
- Job timeouts: 15 min (test/publish), 10 min (release), 5 min (notifications)

---

### `rollback.yml` — Release Rollback

**Trigger**: Manual workflow dispatch

Rolls back to a previous version by updating version files, committing, and creating a rollback tag.

**Inputs**:

| Input | Description | Default |
|-------|-------------|---------|
| `target_version` | Version to rollback to (e.g., `v0.1.0`) | Required |
| `reason` | Reason for rollback | Required |
| `delete_bad_release` | Delete the problematic release | `true` |

**Flow**:
1. Generate GitHub App token
2. Validate target version format + tag existence
3. Notify Slack — rollback started
4. Delete bad release if requested (`gh release delete`)
5. Update version files: `package.json` and `pyproject.toml`
6. Commit: `chore: rollback to $TARGET_VERSION - $REASON`
7. Push to main
8. Create rollback tag: `${TARGET_VERSION}-rollback`
9. Update Slack with success/failure

- Job timeout: 15 minutes

---

### `wip-release-npm.yml` — Node.js Pre-release

**Trigger**: Manual workflow dispatch

Publishes a pre-release version of the Node.js package for testing from any branch. Bypasses approval gate and CI checks.

**Inputs**:

| Input | Description | Default |
|-------|-------------|---------|
| `tag` | NPM distribution tag | `next` |
| `branch` | Source branch | `main` |

**Flow**:
1. Reads latest git tag, computes timestamped version (e.g., `1.2.1-next.20260211143000`)
2. Stamps `motia-js/packages/motia/package.json` (not committed)
3. Publishes to NPM with chosen dist-tag

- Job timeout: 15 minutes

---

### `wip-release-pypi.yml` — Python Pre-release

**Trigger**: Manual workflow dispatch

Publishes a pre-release version of the Python package for testing from any branch. Bypasses approval gate and CI checks.

**Inputs**:

| Input | Description | Default |
|-------|-------------|---------|
| `tag` | Pre-release label | `next` |
| `branch` | Source branch | `main` |

**Flow**:
1. Reads latest git tag, computes timestamped version (e.g., `1.2.1-next.20260211143000`)
2. Stamps `motia-py/packages/motia/pyproject.toml` (not committed)
3. Builds with `python -m build` and publishes to PyPI via OIDC

- Job timeout: 15 minutes

---

### `dependency-review.yml` — Dependency Scanning

**Trigger**: Pull requests that modify dependency files (`package.json`, `pnpm-lock.yaml`, `pyproject.toml`)

Scans dependency changes for security vulnerabilities and license compliance:
- Fails on moderate or higher severity vulnerabilities
- Denies GPL-3.0, AGPL-3.0, LGPL-3.0, MPL-2.0 licenses
- Posts summary comment on PR

- Job timeout: 10 minutes

---

## Composite Actions

### `.github/actions/setup/action.yml` — Node.js Setup

Composite action used by multiple workflows to set up the Node.js environment:

1. Install **pnpm** (version from `packageManager` field)
2. Setup **Node.js 22.21.1** with pnpm cache
3. Configure NPM authentication (if token provided)
4. Install dependencies: `pnpm --filter=!playground install`
5. Build motia package: `pnpm --filter=motia build`

All actions within the composite are SHA-pinned.

### `.github/actions/setup-iii-engine/action.yml` — III Engine Setup

Composite action to download, cache, and start the III Engine server for integration tests:

1. Resolve engine repository and version (default: latest release)
2. Cache engine binary by platform + version
3. Download and extract if not cached
4. Start engine with config from `.github/engine-config/test-config.yml`
5. Health check on `:3111` (30 attempts, 2s apart)

**Inputs**: `engine-repo`, `engine-version`, `config-path`, `github-token`
**Output**: `engine-available` (boolean string)

### `.github/actions/stop-iii-engine/action.yml` — III Engine Cleanup

Composite action to stop the III Engine and clean up temporary files:

1. Read PID from `/tmp/iii-engine.pid`, send SIGTERM
2. Force kill (SIGKILL) if needed
3. Clean up `/tmp/iii-engine-data`

---

## Engine Configuration

### `.github/engine-config/test-config.yml`

Engine configuration for CI integration tests. Modules:
- **StreamModule** — port 3112, file-based KV store
- **StateModule** — file-based KV store
- **RestApiModule** — port 3111, CORS for localhost:3000/5173
- **OtelModule** — memory exporter (no external collector needed)
- **QueueModule** — builtin adapter
- **PubSubModule** — local adapter
- **CronModule** — KV-backed cron adapter

---

## Secrets and Environments

| Secret | Used by | Purpose |
|--------|---------|---------|
| `NPM_TOKEN` | setup action, deploy, wip-release-npm | NPM registry authentication |
| `PYPI_API_TOKEN` | deploy, wip-release-pypi | PyPI publishing |
| `MOTIA_CI_APP_ID` | create-tag, deploy, rollback, wip-release-npm | GitHub App for tag/commit pushing |
| `MOTIA_CI_APP_PRIVATE_KEY` | create-tag, deploy, rollback, wip-release-npm | GitHub App private key |
| `SLACK_BOT_TOKEN` | deploy, rollback | Slack API for chat.postMessage/update |
| `SLACK_CHANNEL_ID` | deploy, rollback | Target Slack channel |
| `SLACK_WEBHOOK_URL` | create-tag | Slack incoming webhook for tag notifications |

---

## Release Lifecycle

### Stable Release
```
1. Maintainer triggers "Create Tag" with bump=patch (or minor/major)
2. Pre-flight checks validate version files exist and branch is up-to-date
3. Version files updated: package.json + pyproject.toml
4. Version bump committed and pushed to main
5. Tag v1.2.3 is created and pushed
6. deploy.yml picks up the tag
7. Slack notification posted: "Release started"
8. CI checks run for BOTH Node.js and Python (must both pass)
9. GitHub Release created with auto-generated notes
10. Slack updated: "Tests passed, release created, publishing..."
11. Publish to NPM (latest) and PyPI simultaneously
12. Slack updated: final status with checkmarks for each package
```

### Pre-release
```
1. Maintainer triggers "Create Tag" with bump=patch, pre_release=beta
2. Auto-increments pre-release number (e.g., 1.2.4-beta.1, 1.2.4-beta.2)
3. PEP 440 conversion for Python (1.2.4-beta.1 → 1.2.4b1)
4. Version files updated + committed + tag pushed
5. deploy.yml picks up the tag
6. CI checks run for both languages
7. Publish to NPM (beta tag) and PyPI simultaneously
8. GitHub Release created (marked as pre-release)
```

### WIP / Testing Release
```
1. Developer triggers "WIP Release - NPM" or "WIP Release - PyPI" from any branch
2. Version computed from latest tag + timestamp: 1.2.1-next.20260211115959
3. Published to NPM or PyPI independently
4. No git changes, no GitHub Release
```

### Rollback
```
1. Triggered manually
2. Validates target version exists as a tag
3. Optionally deletes the problematic release + tag
4. Updates version files to target version
5. Commits rollback to main
6. Creates rollback tag (e.g., v1.2.3-rollback)
7. Slack notifications throughout the process
```
