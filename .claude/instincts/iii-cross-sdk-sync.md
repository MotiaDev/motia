---
id: iii-cross-sdk-sync
trigger: "when modifying SDK API surface or adding new engine features"
confidence: 0.85
domain: architecture
source: local-repo-analysis
---

# Keep SDKs in Sync Across Languages

## Action
When changing SDK APIs or adding engine capabilities, update all three SDKs (Node.js, Python, Rust) together. The JS and Python packages changed together 27 times in the last 200 commits.

Key sync points:
- `sdk/packages/node/iii/` (TypeScript)
- `sdk/packages/python/iii/` (Python)
- `sdk/packages/rust/iii/` (Rust)
- `frameworks/motia/motia-js/` (Motia JS, depends on SDK Node)
- `frameworks/motia/motia-py/` (Motia Python, depends on SDK Python)

## Evidence
- motia-js/package.json and motia-py/pyproject.toml changed together 27/200 commits
- Protocol changes in engine/src/protocol.rs cascade to all SDKs
