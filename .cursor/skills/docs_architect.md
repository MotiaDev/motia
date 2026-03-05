---
name: docs-architect
description: Creates long-form Reference documentation (architecture guides, technical manuals). Use ONLY for multi-chapter reference material spanning 10+ pages. Do NOT use for single-page docs, tutorials, how-tos, or explanations.
---

# Skill: Long-Form Reference Architecture Documentation

**Goal**: Produce structured, multi-chapter reference material that maps complex systems accurately.

## When to Use This Skill

Use this skill ONLY when:

- The output requires multiple chapters/sections (10+ pages)
- The content is information-oriented (Reference quadrant), not learning-oriented

Do NOT use for:

- Single-page API reference → use `.cursor/skills/doc_reference.md` (or defer to autogeneration as appropriate)
- Conceptual explanations → use `.cursor/skills/doc_explanation.md`
- Step-by-step guides → use `.cursor/skills/doc_howto.md` (problem-solving-oriented) or `.cursor/skills/doc_tutorial.md` (learning-oriented)

When deferring to another skill, strictly adhere to the guidelines in the corresponding `.cursor/skills/` file AND `.cursor/skills/doc_workflow.md`.

## Content Rules

- **Accuracy Over Completeness**: Only document what exists in the codebase. Never invent features, behaviors, or patterns.
- **Austere Style**: Dry, precise, factual. Avoid marketing language, superlatives, or speculative benefits.
- **Code-Grounded**: Every claim must trace to actual code. Cite file paths.
- **No Padding**: Omit sections that have no relevant content. Do not include placeholder text.

## Structure Template

Include only sections that have real content:

1. **Overview**: System boundaries and component inventory (1 paragraph max)
2. **Architecture**: Component relationships, data flow (use diagrams sparingly)
3. **Component Reference**: Per-component technical specifications
4. **Data Models**: Schema definitions, type signatures
5. **API Surface**: Endpoints, function signatures, configuration options
6. **Appendix**: Glossary (only for non-obvious terms)

## Output Format

- Markdown with clear heading hierarchy
- Tables and lists over prose
- Code blocks with syntax highlighting (actual code, not pseudocode)
- Cross-references to related docs using relative links
