---
id: iii-install-scripts-sync
trigger: "when modifying install.sh scripts"
confidence: 0.9
domain: ci-cd
source: local-repo-analysis
---

# Keep Install Scripts in Sync

## Action
Install scripts exist per binary and must be updated together:
- `cli/install.sh`
- `console/install.sh`
- `engine/install.sh`

Changes to asset selection, tag format, or download logic affect all three.

## Evidence
- These three files changed together in multiple commits
- Recent fixes (v-prefixed tags, multi-binary asset selection) required updating all three
