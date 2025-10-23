# Motia Project Guide for Claude Code & Claude AI

This project uses **Motia** - a framework for building event-driven, type-safe backend systems.

## 📚 Important: Read the Comprehensive Guides

This project has detailed development guides in **`.cursor/rules/`** directory. These markdown files (`.mdc`) contain complete patterns, examples, and type definitions.

**Before writing any Motia code, read the relevant guides from `.cursor/rules/`**

### For Claude Code Users

**A pre-configured subagent is ready!** 

The `motia-developer` subagent in `.claude/agents/` automatically references all 10 cursor rules when coding.

Use it: `/agents` → select `motia-developer`

Learn more: [Claude Code Subagents Docs](https://docs.claude.com/en/docs/claude-code/sub-agents)

### For Claude AI Assistant (Chat)

Explicitly reference cursor rules in your prompts:

```
Read .cursor/rules/motia/api-steps.mdc and create an API endpoint 
for user registration following the patterns shown.
```

## Available Guides (10 Comprehensive Files)

All guides in `.cursor/rules/` with **TypeScript, JavaScript, and Python** examples:

**Step Types** (`.cursor/rules/motia/`):
- `api-steps.mdc`, `event-steps.mdc`, `cron-steps.mdc`

**Features** (`.cursor/rules/motia/`):
- `state-management.mdc`, `middlewares.mdc`, `realtime-streaming.mdc`
- `virtual-steps.mdc`, `ui-steps.mdc`

**Architecture** (`.cursor/architecture/`):
- `architecture.mdc`, `error-handling.mdc`

## Quick Reference

See `AGENTS.md` in this directory for a quick overview and links to specific guides.

## Key Commands

```bash
npm run dev              # Start development server
npx motia generate-types # Regenerate TypeScript types
npx motia workbench      # Open visual workflow designer
```

---

**Remember**: The `.cursor/rules/` directory is your primary reference. Read the relevant guide before implementing any Motia pattern.
