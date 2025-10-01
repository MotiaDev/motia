---
title: Command Line Interface (CLI)
description: Learn how to use the Motia CLI to manage your projects and workflows
---

# Command Line Interface (CLI)

Motia provides a powerful Command Line Interface (CLI) to help you manage your projects and workflows. The CLI offers various commands for creating projects, generating steps, managing state, and more.

## Installation

The Motia CLI is automatically installed when you install the `motia` package. You can use it by running `npx motia` followed by the desired command.

## Commands

### `create`

Create a new Motia project.

```bash
npx motia@latest create [options]
```

Options:

- `-n, --name <project name>`: The name for your project, used to create a directory. Use `.` or `./` to create it in the current directory.


### `build`

Build your project, generating zip files for each step and creating a configuration file.

```bash
npx motia build [options]
```

Options:

- `-s, --step-dirs <dirs>`: Comma-separated list of directories to search for steps (overrides MOTIA_STEP_DIRS environment variable).

Example:

```bash
npx motia build --step-dirs "api-steps,worker-steps"
```

This command:

1. Compiles all your steps (both Node.js and Python)
2. Bundles each step into a zip file
3. Generates a `motia.steps.json` configuration file in the `dist` directory
4. Organizes the output in the `dist` directory

### `deploy`

Deploy your built steps to the Motia deployment service.

```bash
motia cloud deploy --api-key <api-key> --version-name <version> [options]
```

Options:

- `-k, --api-key <key>` (required): Your API key for authentication
- `-n, --project-name <name>`: Project name (used when creating a new project)
- `-s, --environment-id <id>`: Environment ID (can also be set via MOTIA_ENVIRONMENT_ID env var)
- `--environment-name <name>`: Environment name (used when creating a new environment)
- `-v, --version-name <version>` (required): The version to deploy
- `-d, --version-description <description>`: The description of the version
- `-e, --env-file <path>`: Path to environment file

Example:

```bash
motia cloud deploy --api-key your-api-key-here --version-name 1.2.3 --environment-id env-uuid
```

The deployment process:

1. Build your project
2. Uploads each zip file individually with its path information
3. Starts the deployment process on the server

### `dev`

Start the development server.

```bash
npx motia dev [options]
```

Options:

- `-p, --port <port>`: The port to run the server on (default: 3000).
- `-H, --host [host]`: The host address for the server (default: localhost).
- `-d, --debug`: Enable debug logging.
- `--step-dirs <directories>`: Comma-separated list of directories to search for steps (overrides MOTIA_STEP_DIRS environment variable).

Example:

```bash
npx motia dev --step-dirs "api-steps,worker-steps"
```

### `start`

Start a server to run your Motia project in production mode.

```bash
npx motia start [options]
```

Options:

- `-p, --port <port>`: The port to run the server on (default: 3000).
- `-H, --host [host]`: The host address for the server (default: localhost).
- `-v, --disable-verbose`: Disable verbose logging.
- `-d, --debug`: Enable debug logging.
- `-s, --step-dirs <dirs>`: Comma-separated list of directories to search for steps (overrides MOTIA_STEP_DIRS environment variable).

Example:

```bash
npx motia start --step-dirs "api-steps,worker-steps"
```

### `get-config`

Get the generated config for your project.

```bash
npx motia get-config [options]
```

Options:

- `-o, --output <path>`: Path to write the generated config file.

### `emit`

Emit an event to the Motia server.

```bash
npx motia emit [options]
```

Options:

- `--topic <topic>` (required): Event topic/type to emit.
- `--message <message>` (required): Event payload as a JSON string.
- `-p, --port <number>`: Port number (default: 3000).

### `generate`

Generate Motia resources.

#### `generate step`

Create a new step with interactive prompts.

```bash
npx motia generate step [options]
```

Options:

- `-d, --dir <step file path>`: The path relative to the steps directory to create the step file.

### `state`

Manage application state.

#### `state list`

List the current file state.

```bash
npx motia state list
```

## Debugging

You can enable debug logging by passing the `-d` or `--debug` flag to the `dev` command:

```bash
npx motia dev --debug
```

This will set the `LOG_LEVEL` environment variable to `'debug'`, providing more detailed logging output.

### `docker`

Tools to help you setup your Motia project with docker and run it inside a container.

#### `docker setup`

Setup your Motia project for Docker

```bash
npx motia docker setup
```

#### `docker build`

Build your Motia project Docker image

```bash
npx motia docker build
```

Options:

- `--project-name <project name>` (required): The name of your project.

#### `docker run`

Run your Motia project inside a container

```bash
npx motia docker run
```

Options:

- `--port <number>`: Port number (default: 3000).
- `--project-name <project name>` (required): The name of your project.
- `--skip-build`: Skip building the Docker image and used the last built image.

## Step Directory Configuration

Motia provides flexible options for configuring where your step files are located. By default, Motia searches for steps in the `steps/` directory, but you can customize this behavior using environment variables or CLI options.

### Using the `MOTIA_STEP_DIRS` Environment Variable

Set the `MOTIA_STEP_DIRS` environment variable to specify custom directories for step discovery.

**Format:** Comma-separated list of directory paths

**Default:** `steps`

**Example - Single directory:**
```bash
export MOTIA_STEP_DIRS=src
npx motia dev
```

**Example - Multiple directories:**
```bash
export MOTIA_STEP_DIRS=api-steps,worker-steps,cron-steps
npx motia dev
```

**Example - In `.env` file:**
```bash title=".env"
MOTIA_STEP_DIRS=api-steps,worker-steps,cron-steps
```

**Example - In `package.json` scripts:**
```json title="package.json"
{
  "scripts": {
    "dev": "MOTIA_STEP_DIRS=src npx motia dev",
    "dev:multi": "MOTIA_STEP_DIRS=api,workers npx motia dev",
    "build": "MOTIA_STEP_DIRS=src npx motia build"
  }
}
```

### Configuration Precedence

Motia follows this precedence order when determining which directories to search:

1. **CLI option** (`--step-dirs` or `-s`) - Highest priority
2. **Environment variable** (`MOTIA_STEP_DIRS`) - Medium priority  
3. **Default** (`steps`) - Lowest priority

Example showing CLI override:
```bash
# Environment variable says "src", but CLI option overrides it
export MOTIA_STEP_DIRS=src
npx motia dev --step-dirs "api-steps,worker-steps"
# Result: Motia will search in "api-steps" and "worker-steps", NOT "src"
```

### Practical Examples

**Monorepo structure:**
```bash
npx motia dev --step-dirs "packages/api/steps,packages/workers/steps"
```

**Feature-based organization:**
```bash
MOTIA_STEP_DIRS=features/auth/steps,features/payments/steps,features/notifications/steps
```

**Environment separation:**
```bash
npx motia dev --step-dirs "src/api-steps,src/background-steps"
```

### Troubleshooting

**Directory not found error:**

If you see an error like `Directory 'my-steps' does not exist`, ensure:
- The directory path is correct and exists in your project
- The path is relative to your project root
- You have the necessary file permissions

**Steps not being discovered:**

If your steps aren't being found:
- Verify files follow the naming pattern (`.step.ts`, `.step.py`, `.step.js`)
- Check that files are in the configured directories
- Ensure your `config` and `handler` exports are correct

## Next Steps

- Explore the [Core Concepts](/docs/concepts) to learn more about Steps, Flows, Events, and Topics.
- Check out the [Examples](/docs/examples) for common patterns and use cases.
- Join our [Community](/community) for help and discussions.
