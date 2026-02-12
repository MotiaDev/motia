# CI/CD Workflows

This document describes all GitHub Actions workflows, their triggers, and how they connect to form the Motia release pipeline.

## Overview

```
Pull Request                          Manual Dispatch                    Tag Push (v*)
     │                                  │         │         │                  │
     ├─► motia.yml (CI)                 │         │         │                  │
     ├─► pr-validation.yml              │         │         │                  │
     └─► dependency-review.yml          │         │         │                  │
                                        │         │         │                  │
                              create-tag.yml      │         │            deploy.yml
                                   │          wip-release   wip-release        │
                                   │           -npm.yml      -pypi.yml         │
                                   │              │              │             │
                                   └─ pushes tag ─┼──────────────┼────────────►│
                                                  │              │             │
                                                  ▼              ▼    ┌────────┼────────┐
                                                 NPM           PyPI  │        │        │
                                                                  Publish  Publish  GitHub
                                                                   NPM     PyPI   Release
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

### `motia.yml` — CI Quality Gate

**Trigger**: Pull requests to `main`, pushes to `main`, tag pushes (`v*`)

Runs quality checks for both languages in parallel. This is the primary CI pipeline that validates every code change.

**Jobs**:

| Job | What it runs | Working directory |
|-----|-------------|-------------------|
| `quality-node` | `pnpm lint:ci` (Biome) + `pnpm test:ci` (Jest) | `motia-js/` |
| `quality-python` | `ruff check src` + `mypy src` + `pytest` | `motia-py/packages/motia/` |

- Python runs on a matrix: **3.10, 3.11, 3.12**
- Concurrency: cancels in-progress runs on new PR pushes
- Ignores changes to `contributors/` directory
- Job timeout: 15 minutes

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

Creates and pushes a semantic version tag to trigger the release pipeline. Uses pure git tag manipulation — no file changes or commits.

**Inputs**:

| Input | Description | Options |
|-------|-------------|---------|
| `version_type` | Type of version bump | `major`, `minor`, `patch`, `prerelease`, `prerelease-bump` |
| `prerelease_identifier` | Pre-release label (when applicable) | `alpha`, `beta`, `rc` |
| `custom_version` | Override with a specific version | Any semver string |

**Flow**:
1. Reads the latest version tag from git (`git tag --sort=-version:refname`)
2. Computes next version in bash based on semver rules
3. Creates an annotated git tag and pushes it
4. Reports version information to step summary

**Version source of truth**: The git tag is the sole source of truth. No `package.json` or `pyproject.toml` is read or modified.

**Authentication**: Uses GitHub App token (`MOTIA_CI_APP_ID` / `MOTIA_CI_APP_PRIVATE_KEY`) with scoped permissions to push tags that trigger downstream workflows (personal tokens or `GITHUB_TOKEN` cannot trigger other workflows).

---

### `deploy.yml` — Stable Release Pipeline

**Trigger**: Tag push matching `v*`

The main release workflow. Publishes to both NPM and PyPI from a single version tag. Both language CIs must pass before either package publishes. The manual `create-tag.yml` dispatch acts as the intentional release gate.

**Jobs (in order)**:

#### 1. CI Checks (Node.js)
- Extracts version from tag (`v1.2.3` → `1.2.3`)
- Detects pre-release status (beta/alpha/rc)
- Runs Node.js lint (Biome) + tests (Jest)
- Outputs: `version`, `tag_name`, `is_prerelease`

#### 2. CI Checks (Python)
- Runs on matrix: **3.10, 3.11, 3.12**
- Lints with ruff, type-checks with mypy, runs unit tests with pytest
- Skips integration tests that require III engine (`pytest -m "not integration"`)

#### 3. Publish to NPM
- Stamps `packages/motia/package.json` with version from tag (not committed)
- Determines NPM dist-tag:
  - `-beta.*` → `beta`
  - `-alpha.*` → `alpha`
  - `-rc.*` → `rc`
  - otherwise → `latest`
- Publishes with `--provenance` for supply chain security

#### 4. Publish to PyPI
- Stamps `pyproject.toml` with version from tag via `sed` (not committed)
- Builds with `python -m build`
- Publishes via `pypa/gh-action-pypi-publish` using `PYPI_API_TOKEN`

#### 5. Create GitHub Release
- Batch-fetches commit authors via GitHub Compare API (single API call)
- Generates changelog from conventional commit messages between previous tag and current tag
- Categorizes commits: Features, Bug Fixes, Performance, Docs, Dependencies, Refactoring, Tests, Build, CI, Maintenance, Reverts
- Includes installation instructions for NPM/Yarn/PNPM/PyPI
- Only runs if CI passed AND at least one publish succeeded

**Dependency chain**:
```
ci-checks ──────────┐
                     ├──► publish-npm ──► create-github-release
quality-python ─────┘──► publish-pypi ──┘
```

Both CI jobs must succeed before publishing proceeds. No manual approval gate — the intentional act of triggering `create-tag.yml` serves as the release decision.

- Concurrency: prevents parallel deploys for the same tag
- Job timeouts: 15 min (CI/publish), 10 min (release)

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

## Shared Setup Action

### `.github/actions/setup/action.yml`

Composite action used by multiple workflows to set up the Node.js environment:

1. Install **pnpm** (version from `packageManager` field)
2. Setup **Node.js 22.21.1** with pnpm cache
3. Configure NPM authentication (if token provided)
4. Install dependencies: `pnpm --filter=!playground install`
5. Build motia package: `pnpm --filter=motia build`

All actions within the composite are SHA-pinned (pnpm/action-setup v4.1.0, actions/setup-node v4.4.0).

---

## Secrets and Environments

| Secret | Used by | Purpose |
|--------|---------|---------|
| `NPM_TOKEN` | setup action, deploy, wip-release-npm | NPM registry authentication |
| `PYPI_API_TOKEN` | deploy, wip-release-pypi | PyPI publishing |
| `MOTIA_CI_APP_ID` | create-tag, deploy, wip-release-npm | GitHub App for tag pushing |
| `MOTIA_CI_APP_PRIVATE_KEY` | create-tag, deploy, wip-release-npm | GitHub App private key |

---

## Release Lifecycle

### Stable Release
```
1. Maintainer triggers "Create Tag" with version_type=patch (or minor/major)
2. Tag v1.2.3 is created and pushed (no commits, pure tag)
3. deploy.yml picks up the tag
4. CI checks run for BOTH Node.js and Python (must both pass)
5. Publish to NPM (latest) and PyPI simultaneously
6. GitHub Release created with auto-generated changelog
```

### Pre-release
```
1. Maintainer triggers "Create Tag" with version_type=prerelease, identifier=beta
2. Tag v1.2.4-beta.0 is created and pushed
3. deploy.yml picks up the tag
4. CI checks run for both languages
5. Publish to NPM (beta tag) and PyPI simultaneously
6. GitHub Release created (marked as pre-release)
```

### WIP / Testing Release
```
1. Developer triggers "WIP Release - NPM" or "WIP Release - PyPI" from any branch
2. Version computed from latest tag + timestamp: 1.2.1-next.20260211115959
3. Published to NPM or PyPI independently
4. No git changes, no GitHub Release
```
