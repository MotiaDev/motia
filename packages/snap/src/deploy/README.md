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

## Deployment Process

The deployment follows a three-step process:

1. **Upload Files**: Each zip file is uploaded individually with its relative path information
   - The deployment will only proceed if ALL zip files are uploaded successfully
   - If any file upload fails, the entire deployment is aborted
   - Environment and version are included in each request
2. **Upload Configuration**: The `motia.steps.json` configuration is uploaded
   - Environment and version are included in the request body
3. **Start Deployment**: A request is sent to start the deployment process with the uploaded files and configuration
   - Environment and version are included in both the request body and headers

This approach provides several benefits:
- Better tracking of individual file uploads
- Separation of configuration from files
- Ability to retry specific parts of the deployment if needed
- More efficient server-side processing
- Ensures all files are successfully uploaded before proceeding
- Consistent environment and version tracking across all requests

## Deployment Parameters

| Parameter | CLI Option | Default | Description |
|-----------|------------|---------|-------------|
| API Key | `--api-key` | - | Your API key for authentication (required) |
| Environment | `--env` | `dev` | The environment to deploy to (e.g., dev, staging, production) |
| Version | `--version` | `latest` | The version of the deployment |

## API Endpoints

The deployment service exposes three main endpoints:

1. `POST /deploy/files` - Upload individual zip files
   - Includes environment and version as form data
2. `POST /deploy/config` - Upload the steps configuration
   - Includes environment and version in the request body
3. `POST /deploy/start` - Start the deployment process
   - Includes environment and version in both the request body and headers

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
import { 
  deploy, 
  uploadZipFile, 
  uploadStepsConfig, 
  startDeployment, 
  retrieveZipFiles
} from 'motia';
import fs from 'fs';

// Deploy all steps to the dev environment with latest version
await deploy('your-api-key', process.cwd(), 'dev', 'latest');

// Or use the individual functions for a custom deployment process
const apiKey = 'your-api-key';
const environment = 'staging';
const version = '1.2.3';
const zipFiles = retrieveZipFiles();
const stepsConfig = JSON.parse(fs.readFileSync('./dist/motia.steps.json', 'utf-8'));

// Step 1: Upload all zip files (ensuring all uploads succeed)
let allUploadsSuccessful = true;
const uploadIds = [];

for (const zipFile of zipFiles) {
  try {
    const uploadId = await uploadZipFile(
      zipFile.zipPath, 
      zipFile.bundlePath, 
      apiKey,
      environment,
      version
    );
    uploadIds.push(uploadId);
    console.log(`Uploaded ${zipFile.bundlePath}`);
  } catch (error) {
    allUploadsSuccessful = false;
    console.error(`Failed to upload ${zipFile.bundlePath}: ${error}`);
    break; // Stop on first failure
  }
}

// Only proceed if all uploads were successful
if (allUploadsSuccessful) {
  // Step 2: Upload the steps configuration
  const configId = await uploadStepsConfig(stepsConfig, apiKey, environment, version);
  
  // Step 3: Start the deployment
  const deploymentConfig = { 
    apiKey,
    environment,
    version
  };
  const deploymentId = await startDeployment(uploadIds, configId, deploymentConfig);
  console.log(`Deployment started with ID: ${deploymentId}`);
} else {
  console.error('Deployment aborted due to upload failures');
}
``` 