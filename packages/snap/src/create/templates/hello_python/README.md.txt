# {{PROJECT_NAME}}

This is a **Motia** project bootstrapped with the Motia CLI.

Motia lets you build APIs, background jobs, workflows, and event-driven systems in a single unified backend.

## Quick Start

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

This starts the Motia runtime and **Workbench**. Workbench is a visualizing and debugging your workflows. By default, it's available at [`http://localhost:3000`](http://localhost:3000).

You can start editing the project by making changes to `src/hello/hello_api` as well as produce your own `.step.ts`, `.step.js`, or `_step.py` files within the `src/` directory.

Motia auto-discovers all step files and executes them as defined in each step's configuration. Learn more about the power and simplicity of steps in the [Step Docs](https://motia.dev/docs/concepts/steps).

## Project Config

The `motia.config.ts` file is the central configuration for your Motia application. Here you can customize Express, configure Redis, add security middleware, handle file uploads, set up stream authentication, and more.

## Learn More

- [Docs](https://motia.dev/docs) - Complete guides and API reference
- [Quick Start Tutorial](https://motia.dev/docs/getting-started/quick-start) - Detailed getting started tutorial
- [Core Concepts](https://motia.dev/docs/concepts/overview) - Learn about Steps and Motia's architecture
- [Discord Community](https://discord.gg/motia) - Get help and connect with other developers