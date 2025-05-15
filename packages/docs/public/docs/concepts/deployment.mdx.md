---
title: Deployment
description: Learn how to deploy your Motia workflows to production
---

# Deployment

Motia provides a robust deployment system that allows you to deploy your workflows to various environments. This guide explains the deployment architecture, process, and how to use the Motia CLI for deployments.

## Deployment Architecture

The Motia deployment system follows a three-step process:

1. **Upload Files**: Each zip file is uploaded individually with its relative path information
2. **Upload Configuration**: The `motia.steps.json` configuration is uploaded
3. **Start Deployment**: A request is sent to start the deployment process with the uploaded files and configuration

This approach provides several benefits:
- Better tracking of individual file uploads
- Separation of configuration from files
- Ability to retry specific parts of the deployment if needed
- More efficient server-side processing
- Ensures all files are successfully uploaded before proceeding

## Using the Motia CLI for Deployment

The simplest way to deploy your Motia workflows is using the CLI command:

```bash
motia deploy --api-key <api-key> --environment <environment> --version <version>
```

### Command Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--environment` | `-e` | Target environment for deployment | `development` |
| `--version` | `-v` | Version tag for the deployment | Current timestamp |
| `--api-key` | `-k` | API key for authentication (required) | None |

### Examples

Deploy to the development environment with an auto-generated version:

```bash
motia deploy --api-key your-api-key-here
```

Deploy to production with a specific version:

```bash
motia deploy --environment production --version 1.2.3 --api-key your-api-key-here
```

## Deployment Results

After deployment, two files are generated in your project directory:

### 1. motia.deployments.json

Contains detailed information about each deployment attempt, including:
- Bundle path
- Deployment ID
- Step type
- Step name
- Step path
- Flow name
- Environment
- Version
- Success status
- Error message (if any)

### 2. motia.deployments.summary.json

A more human-readable summary organized by flows:
- Total steps deployed
- Successful deployments count
- Failed deployments count
- Deployment timestamp
- Environment
- Version
- List of flows with their steps and deployment status

## Deployment Process

When you run `motia deploy`, the CLI performs the following actions:

1. **Preparation**: Validates your project structure and configuration
2. **File Collection**: Gathers all workflow step zip files from your project
3. **File Upload**: Uploads each zip file to the Motia platform
4. **Configuration Upload**: Uploads your workflow configuration
5. **Deployment Initiation**: Starts the deployment process on the server
6. **Status Reporting**: Provides feedback on deployment progress and results

The CLI will display progress information during deployment and a summary when complete.

## Troubleshooting Deployments

If you encounter issues during deployment, try these steps:

1. Check the generated deployment files for specific error messages
2. Ensure your API key has the correct permissions
3. Verify your project structure follows Motia's requirements
4. Check that all required files are present and correctly formatted

## Next Steps

- Learn about [Environment Variables](/docs/concepts/environment-variables) for configuring your deployments
- Explore [CI/CD Integration](/docs/concepts/ci-cd) for automating your deployment process
- Check out [Deployment Strategies](/docs/concepts/deployment-strategies) for advanced deployment patterns 