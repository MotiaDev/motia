---
title: Deployment
description: Deploying your project to Motia Cloud
---

There are two ways to deploy your project to Motia Cloud:

1. Using the CLI
2. Using the Web interface

## Using the Motia CLI for Deployment

```bash
motia cloud deploy --api-key <api-key> --version-name <version> [options]
```

#### Required Options

| Option          | Alias | Description                    | Environment Variable |
| --------------- | ----- | ------------------------------ | -------------------- |
| `--api-key`     | `-k`  | API key for authentication     | `MOTIA_API_KEY`      |
| `--version-name`| `-v`  | Version tag for the deployment | None                 |

#### Optional Options

| Option                 | Alias | Description                                                        | Environment Variable     |
| ---------------------- | ----- | ------------------------------------------------------------------ | ------------------------ |
| `--project-name`       | `-p`  | Name of the project to deploy to (creates if doesn't exist)        | `MOTIA_PROJECT_NAME`     |
| `--environment-id`     | `-s`  | Environment ID                                                     | `MOTIA_ENVIRONMENT_ID`   |
| `--version-description`| `-d`  | Version description for the deployment                             | None                     |
| `--env-file`           | `-e`  | Path to environment file                                           | None                     |

> **Note:** Command-line options take precedence over environment variables. If both are provided, the command-line value will be used.

Deploy with a specific version:

```bash
motia cloud deploy --api-key your-api-key-here --version-name 1.2.3
```

Deploy to a specific project and environment with environment variables:

```bash
motia cloud deploy --api-key your-api-key-here \
  --version-name 1.2.3 \
  --project-name my-production-app \
  --environment-id env-id \
  --env-file .env.production
```

## Using Web interface

Through the web interface, you can deploy your project from iii console to a live environment with one click.

![One Click Deployment](../../img/cloud/one-click-deploy.gif)

Steps to deploy from web interface:

1. Have your local project running (make sure your Motia version is 0.6.4 or higher)
2. Go to import from iii console on Motia Cloud
3. Select the port your local project is running on
4. Choose the project and environment name
5. Add any environment variables you need (you can upload from .env file or paste the content to auto-fill)
6. Click Deploy
7. Watch the magic happen


## Adding static files to the bundle

Sometimes we need to use local files when creating our backend logic. For example, creating templates.
Running binary files, etc. To do this, we can add them to steps as static files.

Adding them to Steps as static files, you need to add `includeFiles` to the step config. The path
 should be relative to the step file.

```typescript
import { type StepConfig } from 'motia'

export const config = {
  name: 'Content Outliner',
  description: 'Creates detailed content outline based on the initial idea',
  triggers: [{ type: 'queue', topic: 'build-outline' }],
  enqueues: [{ topic: 'write-content', label: 'Write first content' }],
  virtualEnqueues: ['virtual-write-content'],
  flows: ['Content'],
  input,
  includeFiles: ['./content-outliner.mustache'],
} as const satisfies StepConfig
```

### Adding binary files to the bundle

Binary files are also supported, but the entire bundle size must not exceed 100MB.
The binary architecture should be linux_amd64.

## Troubleshooting Build Outputs

When adding static files, it's important to check the build output to make sure the files are included.

For example, in [this project](https://github.com/MotiaDev/motia-agent-content), there are a few steps that
include static files.

When running `npx motia build`, it will generate the following output in `dist` folder:

```
dist/
└── node/src/content/
    ├── agents
    │   ├── content-outliner.step.zip
    │   ├── content-writer.step.zip
    │   └── ideator.step.zip
    ├── api
    │   ├── generate-content-api.step.zip
    │   └── get-content.step.zip
    ├── motia.steps.json
    └── router-node.zip
```

If you check the content of `content-outliner.step.zip`, it should have this

```
src/
└── content/
    └── agents/
        ├── content-outliner.mustache
        ├── content-outliner.step.js
        └── content-outliner.step.js.map
```

Now you made sure the static file called `content-outliner.mustache` is included in the bundle.