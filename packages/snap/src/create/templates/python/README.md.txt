# {{PROJECT_NAME}}

A Motia tutorial project in Python.

## What is Motia?

Motia is a unified backend framework that combines APIs, background jobs, queues, workflows, AI agents, streaming, and observability into one system using a single core primitive: the **Step**.

Just as React simplified frontend development with components, Motia simplifies backend development with Steps - a single primitive that handles everything.

## Quick Start

```bash
# Start the development server
npm run dev
```

This starts the Motia runtime and the **Workbench** - a powerful UI for developing and debugging your workflows. By default, it's available at [`http://localhost:3000`](http://localhost:3000).

1. **Open the Workbench** in your browser at [`http://localhost:3000`](http://localhost:3000)
2. **Click the `Tutorial`** button on the top right of the workbench
3. **Complete the `Tutorial`** to get an understanding of the basics of Motia and using the Workbench

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
src/                 # Shared services and utilities
motia.config.ts      # Motia configuration
requirements.txt     # Python dependencies
```

Steps are auto-discovered from your `steps/` or `src/` directories - no manual registration required. You can write Steps in Python, TypeScript, or JavaScript, all in the same project.

## Tutorial

This project includes an interactive tutorial that will guide you through:
- Understanding Steps and their types
- Creating API endpoints
- Building event-driven workflows
- Using state management
- Observing your flows in the Workbench

## Learn More

- [Documentation](https://motia.dev/docs) - Complete guides and API reference
- [Quick Start Guide](https://motia.dev/docs/getting-started/quick-start) - Detailed getting started tutorial
- [Core Concepts](https://motia.dev/docs/concepts/overview) - Learn about Steps and Motia architecture
- [Build Your First App](https://motia.dev/docs/getting-started/build-your-first-motia-app) - Step-by-step application guide
- [Discord Community](https://discord.gg/motia) - Get help and connect with other developers

