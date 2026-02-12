# Motia Monorepo

This repository hosts the development of **Motia**, a unified backend framework that combines APIs, background jobs, queues, workflows, and AI agents with built-in state management, streaming, and observability. The repository is structured to facilitate the iterative development and testing of the core framework and includes a playground environment for real-world use cases.

## Overview

**Build production-grade backends with a single primitive.**

Modern backends shouldn't require juggling frameworks, queues, and services. Motia is a unified framework with a single core primitive: **the Step**.

Motia provides:

- **APIs** - RESTful endpoints with validation and routing
- **Background Jobs** - Async processing with built-in queues
- **Durable Workflows** - Complex multi-step orchestration
- **Agentic AI** - AI agent workflows with streaming support
- **State Management** - Built-in persistent storage across steps
- **Streaming** - Real-time data updates to clients
- **Logging & Observability** - End-to-end tracing and monitoring
- **Multi-language Support** - Write steps in TypeScript, Python, JavaScript, and more

### Aspirational Vision

Motia strives to be:

- **Developer-Friendly**: Easy to adopt and extend with a single primitive.
- **Production-Ready**: Scales gracefully from prototypes to enterprise-grade systems.
- **Unified**: One runtime for all backend patterns - no more juggling frameworks.

## Repository Structure

```
.
├── packages/                   # Core framework and supporting tools
│   ├── motia/                  # The Motia.js framework
│   │   ├── src/                # Source code
│   │   ├── dist/               # Compiled output
│   │   ├── package.json        # Package metadata
│   │   └── README.md           # Framework-specific documentation
│   └── other-packages/         # Placeholder for future packages
├── playground/                 # Sandbox environment for testing
│   ├── src/                    # Source code for testing and examples
│   │   ├── flows/              # Flow implementations
│   │   ├── traffic/            # Traffic definitions (inbound/outbound)
│   │   ├── ui/                 # Custom UI components
│   │   └── index.js            # Playground entry point
│   ├── .env.example            # Environment variable template
│   └── README.md               # Playground-specific documentation
├── pnpm-workspace.yaml         # Monorepo configuration
├── package.json                # Top-level package metadata
├── README.md                   # Monorepo overview (this file)
└── CONTRIBUTING.md             # Guidelines for contributing
```

## Getting Started

### Prerequisites

- **Node.js** (v16+ recommended)
- **Python** (LTS recommended)
- **pnpm** (for managing the monorepo)

### Setup

1. Clone the repository:

   ```bash
   git clone <repository_url>
   cd motia-monorepo
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

4. Set up Motia in the playground:

   ```bash
   cd playground
   npx motia install
   ```

5. Set up environment variables:
   - Copy the example `.env` file:
     ```bash
     cp playground/.env.example playground/.env
     ```
   - Update the `.env` file with your credentials and API keys.

### Running the Playground

The playground allows you to test and refine flows built using Motia.js.

```bash
pnpm run dev
```

This command starts the following services:

- **MotiaCore**: The flow orchestrator.
- **MotiaServer**: Provides HTTP endpoints for triggering flows.
- **Playground UI**: A React-based visualization tool for flows.

The workbench runs locally at **[http://localhost:3000](http://localhost:3000)**.

## How to Contribute

### Development Flow

1. Create a new branch for your changes:

   ```bash
   git checkout -b feature/<your-feature-name>
   ```

2. Make changes to the codebase.

   - Framework changes: Update `packages/core`.
   - Flow examples: Update `playground/src/flows`.

3. Run tests:

   ```bash
   pnpm run test
   ```

4. Commit and push your changes:

   ```bash
   git commit -m "Add <your-feature-description>"
   git push origin feature/<your-feature-name>
   ```

5. Open a pull request on GitHub.

### Code Guidelines

- Follow the existing code style (Prettier and ESLint are configured).
- Write unit tests for new features and components.
- Keep commits focused and descriptive.

📘 **For detailed contribution guidelines, setup steps, and best practices, see the [CONTRIBUTING.md](https://github.com/MotiaDev/motia/blob/main/CONTRIBUTING.md) file.**

## Roadmap

- Expand the set of example flows.
- Enhance the visualization capabilities of the playground.
- Improve documentation for public release.
- Publish `motia` to npm with comprehensive guides and examples.

## License

This project is licensed under the [Apache License 2.0](https://github.com/MotiaDev/motia/blob/main/LICENSE).

---

For any questions or feedback, feel free to open an issue on GitHub!