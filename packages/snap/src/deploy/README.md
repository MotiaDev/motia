# Motia Deployment

This module provides functionality to deploy Motia steps to the Motia deployment service. It retrieves the zip files generated during the build process and sends them to the deployment service.

## Configuration

### API Key

An API key is **required** for deployment. You must provide it when deploying:

```bash
motia deploy --api-key your-api-key-here
```

## Usage

### 1. Build your project

```bash
motia build
```

This will generate zip files for each step in your project and create a `motia.steps.json` file in the `dist` directory.

### 2. Deploy your project

```bash
motia deploy --api-key your-api-key-here
```

By default, this will deploy to the `dev` environment with version `latest`.

You can specify the environment and version:

```bash
motia deploy --api-key your-api-key-here --env production --version 1.0.0
```

The deployment process will:
1. Retrieve all zip files generated during the build process
2. Group steps by flow for better organization
3. Send each zip file to the Motia deployment service with detailed metadata
4. Write the deployment results to `dist/motia.deployments.json`
5. Generate a human-readable summary in `dist/motia.deployments.summary.json`

## Deployment Parameters

| Parameter | CLI Option | Default | Description |
|-----------|------------|---------|-------------|
| API Key | `--api-key` | - | Your API key for authentication (required) |
| Environment | `--env` | `dev` | The environment to deploy to (e.g., dev, staging, production) |
| Version | `--version` | `latest` | The version of the deployment |

## API Endpoint

The deployment service is hosted at a fixed endpoint. You don't need to configure the API URL.

## Deployment Payload

The deployment service receives a multipart/form-data POST request with the following fields:

### Common Fields
- `file`: The zip file
- `type`: The step type (node or python)
- `entrypointPath`: The path to the entrypoint file
- `bundlePath`: The path to the bundle
- `stepName`: The name of the step
- `flows`: JSON array of flow names this step belongs to
- `config`: The step configuration as a JSON string
- `environment`: The deployment environment
- `version`: The deployment version

### Type-Specific Fields
Depending on the step type, additional fields are included:

#### API Steps
- `apiPath`: The API endpoint path
- `apiMethod`: The HTTP method (GET, POST, etc.)

#### Event Steps
- `subscribes`: JSON array of event topics this step subscribes to
- `emits`: JSON array of event topics this step emits

#### Cron Steps
- `cronExpression`: The cron expression for scheduled execution

## Deployment Results

After deployment, two files are generated:

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

## Programmatic Usage

```typescript
import { deploy, uploadStepZip, retrieveZipFiles, groupStepsByFlow } from 'motia';

// Deploy all steps to the dev environment with latest version
await deploy('your-api-key', process.cwd(), 'dev', 'latest');

// Or use the individual functions
const zipFiles = retrieveZipFiles();
const deploymentConfig = { 
  apiKey: 'your-api-key', // Required
  environment: 'staging',
  version: '1.2.3'
};

// Group steps by flow
const flowGroups = groupStepsByFlow(zipFiles);

// Deploy each flow
for (const [flowName, flowSteps] of Object.entries(flowGroups)) {
  console.log(`Deploying flow: ${flowName}`);
  
  for (const zipFile of flowSteps) {
    const deploymentId = await uploadStepZip(zipFile, deploymentConfig);
    console.log(`Deployed ${zipFile.stepName} with ID ${deploymentId}`);
  }
}
``` 