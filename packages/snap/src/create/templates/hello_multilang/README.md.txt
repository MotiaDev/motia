# {{PROJECT_NAME}}

A Motia project created with the **multi-language** starter template (TypeScript + Python).

## What is Motia?

Motia is an open-source, unified backend framework that eliminates runtime fragmentation by bringing **APIs, background jobs, queueing, streaming, state, workflows, AI agents, observability, scaling, and deployment** into one unified system using a single core primitive, the **Step**.

## Polyglot Architecture

This template demonstrates Motia's polyglot capabilities by combining:

- **TypeScript**: API endpoint (`hello-api.step.ts`) - handles HTTP requests
- **Python**: Event processor (`process_greeting_step.py`) - handles background processing
- **JavaScript**: Logger (`log-greeting.step.js`) - handles workflow completion

This shows how you can use the best language for each task while keeping everything in a single unified system.

## Quick Start

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

This starts the Motia runtime and the **Workbench** - a powerful UI for developing and debugging your workflows. By default, it's available at [`http://localhost:3000`](http://localhost:3000).

```bash
# Test your first endpoint
curl http://localhost:3000/hello
```

## How It Works

1. **TypeScript API Step** receives the HTTP request at `/hello`
2. It emits a `process-greeting` event with the request data
3. **Python Event Step** picks up the event, processes it, and stores the result in state
4. Python emits a `greeting-processed` event
5. **JavaScript Event Step** logs the completed workflow

## Step Types

Every Step has a `type` that defines how it triggers:

| Type | When it runs | Use case |
|------|--------------|----------|
| **`api`** | HTTP request | REST APIs, webhooks |
| **`event`** | Event emitted | Background jobs, workflows |
| **`cron`** | Schedule | Cleanup, reports, reminders |

## Development Commands

```bash
# Start Workbench and development server
npm run dev
# or
yarn dev
# or
pnpm dev

# Start production server (without hot reload)
npm run start
# or
yarn start
# or
pnpm start

# Generate TypeScript types from Step configs
npm run generate-types
# or
yarn generate-types
# or
pnpm generate-types

# Build project for deployment
npm run build
# or
yarn build
# or
pnpm build
```

## Project Structure

```
steps/                           # Your Step definitions
├── hello/
│   ├── hello-api.step.ts       # TypeScript API endpoint
│   ├── process_greeting_step.py # Python event processor
│   └── log-greeting.step.js    # JavaScript logger
motia.config.ts                  # Motia configuration
requirements.txt                 # Python dependencies
```

Steps are auto-discovered from your `steps/` or `src/` directories - no manual registration required.

## Learn More

- [Documentation](https://motia.dev/docs) - Complete guides and API reference
- [Quick Start Guide](https://motia.dev/docs/getting-started/quick-start) - Detailed getting started tutorial
- [Core Concepts](https://motia.dev/docs/concepts/overview) - Learn about Steps and Motia architecture
- [Discord Community](https://discord.gg/motia) - Get help and connect with other developers