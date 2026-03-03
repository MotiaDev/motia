---
title: Command Line Interface (CLI)
description: Learn how to use the Motia CLI for project creation and deployment
---

# Command Line Interface (CLI)

The Motia CLI handles project scaffolding and deployment. It is installed with the `motia` package.

<Callout type="info">
During development, `npm run dev` starts the [iii](https://iii.dev) runtime which orchestrates building and running your Motia application. The commands below are either run directly by you or internally by iii's Shell Exec module.
</Callout>

## Project Creation

### `npx motia@latest create`

Scaffold a new Motia project.

```bash
npx motia@latest create [project-name] [options]
```

**Arguments:**

- `[project-name]` (optional): The name for your project folder. Use `.` or `./` for the current directory.

**Options:**

- `--template <template-name>` (optional): Template to use. If not provided, you'll be prompted interactively.

**Available Templates:**

| Template | Description | Use Case |
|----------|-------------|----------|
| `motia-tutorial-typescript` | Tutorial (TypeScript only) | Interactive tutorial project in TypeScript |
| `motia-tutorial-python` | Tutorial (Python only) | Interactive tutorial project in Python |
| `starter-multilang` | Starter (All languages; TS/JS + Python) | Polyglot project with TypeScript API, Python event processing, and JavaScript logging |
| `starter-typescript` | Starter (TypeScript only) | Minimal TypeScript project with basic examples |
| `starter-javascript` | Starter (JavaScript only) | Minimal JavaScript project with basic examples |
| `starter-python` | Starter (Python only) | Minimal Python project with basic examples |

**Examples:**

```bash
npx motia@latest create my-app --template starter-typescript
npx motia@latest create my-tutorial --template motia-tutorial-python
npx motia@latest create
```

---

## Build

### `motia build`

Build your project, compiling all Steps and generating deployment artifacts.

```bash
npx motia build
```

<Callout type="info">
During development, iii's Shell Exec module runs this automatically when your Step files change. You typically only run this manually for deployment.
</Callout>

---

## Deployment

### `motia cloud deploy`

Deploy to Motia Cloud.

```bash
npx motia cloud deploy --api-key <api-key> --version-name <version> [options]
```

**Options:**

- `-k, --api-key <key>` (required): Your API key for authentication
- `-v, --version-name <version>` (required): The version to deploy
- `-n, --project-name <name>`: Project name (used when creating a new project)
- `-s, --environment-id <id>`: Environment ID (can also be set via `MOTIA_ENVIRONMENT_ID` env var)
- `--environment-name <name>`: Environment name (used when creating a new environment)
- `-d, --version-description <description>`: The description of the version
- `-e, --env-file <path>`: Path to environment file

### Docker

Tools for containerizing your Motia project.

```bash
npx motia docker setup       # Generate Dockerfile and .dockerignore
npx motia docker build        # Build Docker image
npx motia docker run          # Build and run in a container
```

---

## Utility Commands

### `motia generate step`

Create a new Step with interactive prompts.

```bash
npx motia generate step [--dir <path>]
```

### `motia enqueue`

Manually enqueue a message for testing.

```bash
npx motia enqueue --topic user.created --message '{"userId":"123"}'
```

### `motia state list`

List current file state.

```bash
npx motia state list
```

---

## Next Steps

- Explore the [Core Concepts](/docs/concepts) to learn more about Steps, Flows, and Topics.
- Check out the [Examples](/docs/examples) for common patterns and use cases.
