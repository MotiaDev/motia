# PRD: Infrastructure Config in Steps

## Introduction/Overview

This feature enables developers to configure infrastructure requirements directly in their Step definitions, making Steps the single source of truth for both code and infrastructure. Currently, Event Steps automatically get queue infrastructure, but developers cannot customize queue behavior, handler resources, or retry strategies. This proposal adds an optional `infrastructure` field to Step configs that allows fine-grained control over handler compute resources and queue configurations.

**Problem Solved**: Developers need to control how their steps execute (RAM, CPU, timeouts) and how messages are processed (FIFO ordering, retry behavior, visibility timeouts) without leaving their step definition files.

**Goal**: Make infrastructure configuration declarative, type-safe, and validated at build time, ensuring developers catch configuration errors before deployment.

## Goals

1. Enable developers to configure handler compute resources (RAM, CPU, timeout, machine type) for all Step types
2. Allow Event Step developers to configure queue behavior (FIFO vs Standard, retry strategies, message ordering)
3. Validate infrastructure configuration at build time with clear error messages
4. Maintain backward compatibility - existing steps without infrastructure config continue to work with Motia Cloud defaults
5. Enforce AWS Lambda and SQS constraints to prevent invalid configurations
6. Provide clear, actionable error messages when constraints are violated

## User Stories

### Story 1: GPU-Accelerated Event Step
**As a** developer building an ML inference pipeline,  
**I want to** configure my Event Step to run on GPU-enabled infrastructure,  
**So that** I can process image classification requests efficiently.

### Story 2: FIFO Queue for Ordered Processing
**As a** developer building a financial transaction processor,  
**I want to** ensure all transactions for the same user are processed in order,  
**So that** account balances remain consistent.

### Story 3: High-Memory API Handler
**As a** developer building a data transformation API,  
**I want to** allocate 4GB of RAM to my API handler,  
**So that** I can process large CSV files in memory.

### Story 4: Exponential Backoff Retry
**As a** developer integrating with unreliable third-party APIs,  
**I want to** configure exponential backoff retries for my Event Step,  
**So that** temporary failures don't immediately exhaust retry attempts.

### Story 5: Validation at Build Time
**As a** developer deploying to production,  
**I want to** receive clear error messages during build if my infrastructure config is invalid,  
**So that** I catch configuration errors before deployment.

## Functional Requirements

### FR1: Infrastructure Config Type Definition
The system must define an `InfrastructureConfig` type with two main sections: `handler` and `queue`.

**Handler Config (applies to all step types)**:
- `ram`: number (in MB, AWS Lambda range: 128-10240)
- `cpu`: number (in vCPU, range: 0.5-6, must align with RAM)
- `machineType`: 'cpu' | 'memory' | 'gpu' (AWS machine type)
- `timeout`: number (in seconds, range: 1-900)

**Queue Config (applies only to Event steps)**:
- `type`: 'fifo' | 'standard'
- `messageGroupId`: string (simple key from input data, required for FIFO, e.g., "userId", "traceId")
- `maxRetries`: number (range: 0-10)
- `retryStrategy`: 'none' | 'exponential' | 'jitter'
- `visibilityTimeout`: number (in seconds, must be > handler timeout, range: 0-43200)

### FR2: Type Integration in Core Package
The system must extend `EventConfig`, `ApiRouteConfig`, and `CronConfig` types in `packages/core/src/types.ts` to include an optional `infrastructure` field.

```typescript
infrastructure?: InfrastructureConfig
```

### FR3: Zod Schema Validation
The system must add Zod schemas in `packages/core/src/step-validator.ts` to validate infrastructure config structure, including:
- Type constraints (strings, numbers, enums)
- Required field validation (e.g., messageGroupId required when queue.type is 'fifo')

### FR4: Build-Time Constraint Validation
The system must validate AWS Lambda and SQS constraints in `packages/snap/src/cloud/build/build-validation.ts`:

**AWS Lambda Constraints**:
- RAM: 128MB to 10,240MB (in 1MB increments)
- CPU: Must align with RAM (e.g., 128-1769MB → 0.5-1 vCPU)
- Timeout: 1 to 900 seconds
- Machine type 'gpu' requires minimum RAM (to be determined by Motia Cloud)

**AWS SQS Constraints**:
- visibilityTimeout must be greater than handler timeout
- visibilityTimeout range: 0 to 43,200 seconds (12 hours)
- messageGroupId must be a valid key path (no dots or complex expressions, just simple key names)
- maxRetries range: 0 to 10

### FR5: Validation Error Messages
When validation fails, the system must provide clear, colored error messages following the existing pattern:
```
Infrastructure configuration error in step 'stepName':
  ➜ handler.ram must be between 128 and 10240 MB
  ➜ queue.visibilityTimeout (25s) must be greater than handler.timeout (30s)
```

### FR6: MessageGroupId Resolution
For Event Steps with FIFO queues, the system must:
- Extract the `messageGroupId` value from the input data at runtime
- Throw a build error if the specified key doesn't exist in the input schema (when using Zod schemas)
- Throw a runtime error if the key doesn't exist in the actual input data

### FR7: Backward Compatibility
The system must:
- Make the `infrastructure` field optional in all step configs
- Allow existing steps without infrastructure config to continue working
- Use Motia Cloud defaults when infrastructure config is not provided
- Not generate warnings for steps without infrastructure config

### FR8: Queue Config Restriction
The system must:
- Only validate `queue` configuration for Event Steps
- Ignore `queue` configuration in API and Cron steps (optionally show a warning)
- Allow `handler` configuration for all step types

### FR9: Retry Strategy Calculation
The system must document (but not implement) how retry strategies calculate backoff times:

**Exponential**: `visibilityTimeout * 2^tryCount`
**Jitter**: `visibilityTimeout * (1 + random(0, 0.5))`

Implementation happens in Motia Cloud infrastructure, not in the build system.

## Non-Goals (Out of Scope)

1. **Cost Estimation**: Calculating or displaying infrastructure costs during build
2. **Resource Quotas**: Enforcing project-wide resource limits or quotas
3. **DLQ Configuration**: Configuring dead letter queues or DLQ behavior
4. **Runtime Auto-scaling**: Dynamic resource adjustment based on workload
5. **Multi-region Configuration**: Specifying regions or availability zones
6. **Custom Alerting**: Setting up alerts for DLQ or failure conditions
7. **Cloud Provider Abstraction**: Supporting GCP or Azure (AWS-only for now)

## Design Considerations

### Type Safety
All infrastructure configuration should be fully type-safe using TypeScript and Zod schemas. The `messageGroupId` field should be validated against the step's input schema when possible.

### Error Messages
Follow the existing error message pattern used for cron expressions and endpoint conflicts:
- Use colors for emphasis (red for errors, magenta for values, cyan for suggestions)
- Use arrow bullets (➜) for consistent formatting
- Show file path relative to project root
- Group related errors together

### Developer Experience
Developers should get immediate feedback during build, not at deployment time. All validation should happen before artifacts are uploaded.

## Technical Considerations

### Implementation Phases

**Phase 1: Type Definitions**
1. Add `InfrastructureConfig` types to `packages/core/src/types.ts`
2. Extend `EventConfig`, `ApiRouteConfig`, `CronConfig` with optional infrastructure field
3. Create Zod schemas for infrastructure validation

**Phase 2: Build Validation**
1. Add infrastructure validation function to `packages/snap/src/cloud/build/build-validation.ts`
2. Validate AWS constraints (RAM, CPU, timeout, visibilityTimeout)
3. Validate queue config for Event steps only
4. Generate clear error messages

**Phase 3: MessageGroupId Validation**
1. For steps with Zod input schemas, validate that messageGroupId key exists in schema
2. Add validation logic to check key existence at build time
3. Document runtime validation expectations

**Phase 4: Deployment Integration**
1. Include infrastructure config in the serialized steps config JSON
2. Pass infrastructure config to Motia Cloud API during deployment
3. Ensure backward compatibility with steps that don't have infrastructure config

### Dependencies
- **Zod**: Already used for schema validation
- **node-cron**: Already used for cron expression validation (pattern for infrastructure validation)
- **AWS SDK constraints**: Reference AWS documentation for Lambda/SQS limits

### Files to Modify
1. `packages/core/src/types.ts` - Add infrastructure types
2. `packages/core/src/step-validator.ts` - Add Zod schemas
3. `packages/snap/src/cloud/build/build-validation.ts` - Add validation logic
4. `packages/snap/src/cloud/build/builder.ts` - Include infrastructure config in build output

## Success Metrics

1. **Build-Time Error Detection**: 100% of invalid infrastructure configs caught during build
2. **Developer Feedback**: Positive feedback on error message clarity and helpfulness
3. **Adoption Rate**: X% of new Event Steps use custom infrastructure config within 3 months
4. **Deployment Failures**: Reduce infrastructure-related deployment failures by Y%
5. **Documentation Completeness**: All infrastructure options documented with examples

## Open Questions

1. **GPU Minimum RAM**: What is the minimum RAM required for GPU-enabled machine types?
2. **CPU-RAM Alignment**: What is the exact mapping between RAM and CPU for AWS Lambda?
3. **Default Values**: What are the exact default values Motia Cloud will use for each infrastructure parameter?
4. **Validation Timing**: Should we validate messageGroupId against input schemas for both Zod and JSON schemas, or only Zod?
5. **Warning vs Error**: Should queue config on non-Event steps be a warning or an error?
6. **Machine Type Availability**: Are GPU machine types available in all AWS regions where Motia Cloud operates?
7. **Migration Path**: Do we need a migration tool or script to help users add infrastructure config to existing steps?

## Example Usage

### Event Step with FIFO Queue and GPU
```typescript
import { z } from 'zod'
import { EventConfig, Handlers } from 'motia'

export const config: EventConfig = {
  type: 'event',
  name: 'ImageClassifier',
  description: 'Classifies images using ML model',
  subscribes: ['image.uploaded'],
  emits: ['image.classified'],
  input: z.object({ 
    imageId: z.string(),
    userId: z.string(),
  }),
  flows: ['ml-pipeline'],

  infrastructure: {
    handler: {
      ram: 4096,
      cpu: 2,
      machineType: 'gpu',
      timeout: 60,
    },
    queue: {
      type: 'fifo',
      messageGroupId: 'userId',
      maxRetries: 3,
      retryStrategy: 'exponential',
      visibilityTimeout: 120,
    },
  },
}

export const handler: Handlers['ImageClassifier'] = async (input, ctx) => {
  // Process image with GPU acceleration
}
```

### API Step with High Memory
```typescript
import { ApiRouteConfig, ApiRouteHandler } from 'motia'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CsvProcessor',
  description: 'Processes large CSV files',
  method: 'POST',
  path: '/process-csv',
  emits: [],
  flows: ['data-processing'],

  infrastructure: {
    handler: {
      ram: 8192,
      cpu: 4,
      machineType: 'memory',
      timeout: 300,
    },
  },
}

export const handler: ApiRouteHandler = async (req, ctx) => {
  // Process CSV in memory
  return { status: 200, body: { success: true } }
}
```

## Validation Error Examples

### Invalid RAM
```
Infrastructure configuration error in steps/imageClassifier.step.ts:
  ➜ handler.ram must be between 128 and 10240 MB
  ➜ Current value: 15000 MB
```

### Visibility Timeout Too Short
```
Infrastructure configuration error in steps/processor.step.ts:
  ➜ queue.visibilityTimeout (25s) must be greater than handler.timeout (30s)
  ➜ Recommended: Set visibilityTimeout to at least 31s
```

### Missing MessageGroupId for FIFO
```
Infrastructure configuration error in steps/orderedProcessor.step.ts:
  ➜ queue.messageGroupId is required when queue.type is 'fifo'
  ➜ Example: messageGroupId: 'userId' or messageGroupId: 'traceId'
```

### Invalid MessageGroupId Key
```
Infrastructure configuration error in steps/processor.step.ts:
  ➜ queue.messageGroupId 'invalidKey' does not exist in input schema
  ➜ Available keys: userId, traceId, orderId
```

