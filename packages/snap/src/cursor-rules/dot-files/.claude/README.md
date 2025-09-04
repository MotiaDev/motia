# Claude Code Project Configuration

This directory contains Claude Code configuration and project memory following the official Claude Code directory structure.

## Memory Hierarchy

Claude Code uses a hierarchical memory system:

1. **Enterprise Policy**: System-wide settings (managed by organization)
2. **Project Memory**: `./CLAUDE.md` - Team-shared instructions (version controlled)
3. **User Memory**: `~/.claude/CLAUDE.md` - Personal preferences across all projects
4. **Project Settings**: `.claude/settings.json` - Project-specific configuration

Files higher in the hierarchy take precedence.

## Directory Structure

```
.claude/
├── CLAUDE.md         # Project memory - main instructions and context
├── settings.json     # Project configuration and permissions
├── settings.local.json # Local overrides (gitignored)
├── commands/         # Slash command definitions
│   ├── add-authentication.md
│   ├── ai-ml-patterns.md
│   ├── authentication.md
│   ├── backend-types.md
│   ├── build-api.md
│   ├── claude-workflows.md
│   ├── complete-backend.md
│   ├── create-api.md
│   ├── data-processing.md
│   ├── integrate-ai.md
│   ├── javascript-patterns.md
│   ├── multi-language.md
│   ├── multi-language-workflow.md
│   ├── process-background-jobs.md
│   └── process-events.md
├── agents/           # Specialized AI agents with YAML frontmatter
│   ├── code-reviewer.md
│   ├── debugger.md
│   └── test-runner.md
├── hooks/            # Custom pre/post tool execution scripts
│   └── pre-commit.sh
└── README.md         # This documentation file
```

## Key Features

### Memory Management

- **Automatic Loading**: Memory files are loaded when Claude Code launches
- **File Imports**: Use `@path/to/import` syntax (max 5 hops deep)
- **Quick Access**: Use `#` shortcut or `/memory` command to add memories

### Configuration

- **Permissions**: Control tool and file access granularly
- **Environment Variables**: Set project-specific environment variables
- **Hooks**: Execute custom scripts before/after tool calls
- **Model Override**: Specify different AI models per project

### Commands & Agents

- **Slash Commands**: Custom workflow patterns triggered by `/command-name`
- **Agents**: Specialized AI behaviors activated by keywords or contexts
- **Hooks Integration**: Integrate with git workflows and CI/CD

## Usage

### Basic Workflow

1. Claude automatically references `CLAUDE.md` for project context
2. Use slash commands like `/create-api` for common patterns
3. Agents activate based on keywords (e.g., "review", "test", "debug")
4. Settings control permissions and behavior

### Configuration Management

```bash
claude config list                    # View all settings
claude config get permissions.allow   # Get specific setting
claude config set model <claude sonnet or opus model name>  # Set model
```

### Best Practices

- **Be Specific**: Write clear, specific instructions in memory files
- **Use Imports**: Organize large memories with `@imports`
- **Review Regularly**: Keep memories updated and relevant
- **Version Control**: Commit shared settings, ignore local overrides

## Learn More

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Memory Management](https://docs.anthropic.com/en/docs/claude-code/memory)
- [Settings Configuration](https://docs.anthropic.com/en/docs/claude-code/settings)
