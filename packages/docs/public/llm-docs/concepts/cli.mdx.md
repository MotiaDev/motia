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
npx motia create [options]
```

Options:

- `-n, --name <project name>`: The name for your project, used to create a directory. Use `.` or `./` to create it in the current directory.
- `-t, --template <template name>`: The Motia template to use for your project. Run `npx motia templates` to see available templates.
- `-c, --cursor`: Enable Cursor IDE integration by adding `.cursor` configuration folder

### `templates`

Print the list of available project templates.

```bash
npx motia templates
```

### `build`

Build your project, generating zip files for each step and creating a configuration file.

```bash
npx motia build
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
- `-v, --version-name <version>` (required): The version to deploy
- `-s, --environment-id <environment>`: The environment ID to deploy to
- `-e, --env-file <file>`: Path to environment file
- `-n, --project-name <name>`: Project name (used when environment-id is not provided)

Example:

```bash
motia cloud deploy --api-key your-api-key-here --version-name 1.2.3 --environment-id env-uuid
```

The deployment process:

1. Uploads each zip file individually with its path information
2. Uploads the steps configuration from `motia.steps.json`
3. Starts the deployment process on the server
4. Generates deployment results in `dist/motia.deployments.json`
5. Creates a human-readable summary in `dist/motia.deployments.summary.json`

### `dev`

Start the development server.

```bash
npx motia dev [options]
```

Options:

- `-p, --port <port>`: The port to run the server on (default: 3000).
- `-H, --host [host]`: The host address for the server (default: localhost).
- `-d, --debug`: Enable debug logging.

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

## Next Steps

- Explore the [Core Concepts](/docs/concepts) to learn more about Steps, Flows, Events, and Topics.
- Check out the [Examples](/docs/examples) for common patterns and use cases.
- Join our [Community](/community) for help and discussions.
