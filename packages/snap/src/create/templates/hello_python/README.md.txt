# {{PROJECT_NAME}}

A Motia project created with the starter template.

## What is Motia?

Motia is a unified backend framework that combines APIs, background jobs, queues, workflows, AI agents, streaming, and observability into one system using a single core primitive: the **Step**.

Just as React simplified frontend development with components, Motia simplifies backend development with Steps - a single primitive that handles everything.

## Quick Start

```bash
# Start the development server
npm run dev
```

This starts the Motia runtime and the **Workbench** - a powerful UI for developing and debugging your workflows. By default, it's available at [`http://localhost:3000`](http://localhost:3000).

```bash
# Test your first endpoint
curl http://localhost:3000/hello
```

## Step Types

Every Step has a `type` that defines how it triggers:

| Type | When it runs | Use case |
|------|--------------|----------|
| **`api`** | HTTP request | REST APIs, webhooks |
| **`event`** | Event emitted | Background jobs, workflows |
| **`cron`** | Schedule | Cleanup, reports, reminders |

## Development Commands

```bash
npm run dev              # Start Workbench and development server
npm run generate-types   # Generate TypeScript types from Step configs
npm run build            # Build project for deployment
```

## Project Structure

```
steps/              # Your Step definitions (or use src/)
motia.config.ts     # Motia configuration
requirements.txt    # Python dependencies
```

Steps are auto-discovered from your `steps/` or `src/` directories - no manual registration required. You can write Steps in Python, TypeScript, or JavaScript, all in the same project.

## Learn More

- [Documentation](https://motia.dev/docs) - Complete guides and API reference
- [Quick Start Guide](https://motia.dev/docs/getting-started/quick-start) - Detailed getting started tutorial
- [Core Concepts](https://motia.dev/docs/concepts/overview) - Learn about Steps and Motia architecture
- [Discord Community](https://discord.gg/motia) - Get help and connect with other developers

