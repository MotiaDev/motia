# Claude Assistant Configuration for Motia

This directory contains AI assistant configuration following the Claude Code directory structure.

## Directory Structure

```
.claude/
├── CLAUDE.md         # Main instructions and overview
├── commands/         # Slash commands for common tasks
│   ├── create-api.md
│   ├── process-events.md
│   ├── multi-language.md
│   └── deploy.md
├── agents/           # Specialized AI agents
│   ├── code-reviewer.md
│   ├── test-runner.md
│   └── debugger.md
├── hooks/            # Lifecycle automation scripts
│   ├── pre-commit.sh
│   └── post-deploy.sh
└── settings.json     # Configuration and preferences
```

## Usage

When working with Claude on Motia projects:

1. Claude will automatically reference `CLAUDE.md` for context
2. Use slash commands like `/create-api` to trigger specific patterns
3. Agents activate automatically based on keywords (e.g., "review", "test", "debug")
4. Hooks can be integrated with your git and deployment workflows

## Customization

Feel free to:
- Add new command patterns in `commands/`
- Create specialized agents in `agents/`
- Modify `settings.json` for your preferences
- Update `CLAUDE.md` with project-specific context

## Learn More

- [Motia Documentation](https://motia.dev/docs)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)