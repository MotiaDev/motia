# Deployment Stream API Documentation

## Overview
The deployment system uses **two separate APIs** with Motia Streams for real-time updates:
- **Motia Cloud API**: Manages deployments (create, authenticate)
- **Motia Framework**: Executes deployments with real-time streaming

## Stream Configuration

### Stream Name
`deployment-status`

### Stream Structure
- **Group ID**: `deployments` (always use this value)
- **Item ID**: The unique `deploymentId` for each deployment

## Data Structure

```typescript
interface DeploymentData {
  id: string                    // Matches deploymentId
  status: 'idle' | 'building' | 'uploading' | 'deploying' | 'completed' | 'failed'
  phase: 'build' | 'upload' | 'deploy' | null
  progress: number              // 0-100
  message: string               // Current status message
  build: BuildOutput[]          // Build phase details per step
  upload: UploadOutput[]        // Upload phase details per step
  buildLogs: string[]           // Logs from build phase
  uploadLogs: string[]          // Logs from upload phase  
  deployLogs: string[]          // Logs from deploy phase
  error?: string                // Error message if failed
  startedAt?: number            // Unix timestamp
  completedAt?: number          // Unix timestamp
  metadata?: {
    totalSteps: number
    completedSteps: number
    environment?: string
  }
}

interface BuildOutput {
  packagePath: string
  language: string
  status: 'building' | 'built' | 'error'
  size?: number                 // bytes
  type: 'event' | 'api' | 'cron'
  errorMessage?: string
}

interface UploadOutput {
  packagePath: string
  language: string
  status: 'uploading' | 'uploaded' | 'error'
  size?: number                 // bytes
  progress?: number             // 0-100
  type: 'event' | 'api' | 'cron'
  errorMessage?: string
}
```

## Deployment Flow (2 Steps)

### Step 1: Create Deployment (Motia Cloud API)
**Who calls it:** Motia Hub Web Interface or CLI  
**Purpose:** Creates deployment record and generates authentication token

```http
POST https://motia-hub-api.motiahub.com/v1/deployments
Content-Type: application/json

{
  "environmentId": "env-123", 
  "versionName": "v1.0.0"
}
```

**Response:**
```json
{
  "deploymentId": "deploy-456",
  "deploymentToken": "token-789",
  "environmentName": "production",
  "projectName": "my-project",
  "versionName": "v1.0.0"
}
```

### Step 2: Execute Deployment (Motia Framework)
**Who calls it:** Motia CLI or custom deployment scripts  
**Purpose:** Starts the actual deployment process with real-time streaming

```http
POST http://localhost:3000/cloud/deploy/start
Content-Type: application/json

{
  "deploymentToken": "token-789",
  "deploymentId": "deploy-456",
  "envs": {
    "NODE_ENV": "production"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deployment started",
  "deploymentId": "deploy-456",
  "streamName": "deployment-status",
  "groupId": "deployments",
  "itemId": "deploy-456"
}
```

### Optional: Get Deployment Status (Motia Framework)
**Who calls it:** Any client needing current deployment state  
**Purpose:** Get deployment status without streaming (one-time fetch)

```http
GET http://localhost:3000/cloud/deploy/status/deploy-456
```

**Response:**
```json
{
  "success": true,
  "deployment": {
    "id": "deploy-456",
    "status": "building",
    "phase": "build",
    "progress": 45,
    "message": "Building step: api-handler",
    "build": [...],
    "upload": [],
    "buildLogs": ["Step 1 building...", "Step 2 built"],
    "uploadLogs": [],
    "deployLogs": []
  }
}
```

## Frontend Integration

### Real-time Updates with React Hook
```typescript
import { useStreamItem } from '@motiadev/stream-client-react'

const DeploymentStatus = ({ deploymentId }: { deploymentId: string }) => {
  const { data: deployment } = useStreamItem<DeploymentData>({
    streamName: 'deployment-status',
    groupId: 'deployments',
    itemId: deploymentId
  })

  if (!deployment) return <div>Loading...</div>
  
  return (
    <div>
      <p>Status: {deployment.status}</p>
      <progress value={deployment.progress} max="100" />
      <p>{deployment.message}</p>
      {deployment.error && <div className="error">{deployment.error}</div>}
    </div>
  )
}
```

### Direct Stream Connection
```typescript
import { Stream } from '@motiadev/stream-client-browser'

const client = new Stream('ws://localhost:3000')
const subscription = client.subscribeItem<DeploymentData>(
  'deployment-status', 'deployments', deploymentId
)

subscription.addChangeListener((deployment) => {
  console.log('Status:', deployment.status, deployment.progress + '%')
})
```

## Deployment Phases

1. **Build** (`status: 'building'`): Compile and bundle steps (0-33%)
2. **Upload** (`status: 'uploading'`): Upload artifacts to cloud (34-66%)  
3. **Deploy** (`status: 'deploying'`): Provision cloud resources (67-99%)
4. **Complete** (`status: 'completed'|'failed'`): Final result (100%)

**Status Flow:** `idle → building → uploading → deploying → completed/failed`

## Key Points

- **Two APIs**: Motia Cloud API creates deployments, Motia Framework executes them
- **Real-time**: Use streams for live updates, status endpoint for one-time checks
- **Detailed tracking**: `build` and `upload` arrays track individual step progress
- **Error handling**: Check `deployment.error` when `status === 'failed'`
- **Persistence**: All deployment states survive page refreshes