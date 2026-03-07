---
id: iii-commit-convention
trigger: "when writing a commit message"
confidence: 0.95
domain: git
source: local-repo-analysis
---

# Use Conventional Commits with Optional Scope

## Action
Prefix commits with: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `ci:`

Use scopes for targeted changes: `feat(console):`, `fix(motia-js):`, `refactor(state):`

Include PR number when applicable: `feat: add X (#1234)`

## Evidence
- Analyzed 200 commits
- 93%+ follow conventional commit format
- Most common: chore (40%), feat (23%), fix (21%)
