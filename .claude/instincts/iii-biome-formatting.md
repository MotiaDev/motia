---
id: iii-biome-formatting
trigger: "when writing or formatting JavaScript/TypeScript code"
confidence: 0.95
domain: code-style
source: local-repo-analysis
---

# Follow Biome Formatting Rules

## Action
JS/TS code must follow these Biome settings:
- Indent: 2 spaces
- Line width: 120
- Quotes: single (JSX: double)
- Trailing commas: always
- Semicolons: as needed (omit when possible)
- No `var` (use `const`/`let`)
- LF line endings

Run `pnpm fmt` to auto-format or `pnpm fmt:check` to verify.

## Evidence
- biome.json configured at repo root
- CI enforces formatting via `pnpm fmt:check`
- All 200 analyzed commits follow these conventions
