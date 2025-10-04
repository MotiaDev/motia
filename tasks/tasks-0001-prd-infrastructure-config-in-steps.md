# Task List: Infrastructure Config in Steps

## Relevant Files

### Core Package (Type Definitions & Validation)
- `packages/core/src/types.ts` - Add `InfrastructureConfig`, `HandlerConfig`, `QueueConfig` types and extend step configs
- `packages/core/src/step-validator.ts` - Add Zod schemas, AWS constants, CPU-RAM mapping, and validation functions (NO defaults)
- `packages/core/src/__tests__/infrastructure-config.test.ts` - Unit tests for infrastructure types and Zod schemas

### Build System (Validation & Integration)
- `packages/snap/src/cloud/build/build-validation.ts` - Integrate infrastructure validation into build process with formatted errors
- `packages/snap/src/cloud/build/__tests__/infrastructure-validation.test.ts` - Tests for build-time infrastructure validation
- `packages/snap/src/cloud/build/builder.ts` - Verify infrastructure config flows through (review only, likely no changes)
- `packages/snap/src/cloud/new-deployment/cloud-api/start-deployment.ts` - Verify infrastructure config is passed to API (review only)

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [path/to/test/file]` to run specific tests
- The build validation follows the pattern established in `build-validation.ts` (colored error messages, validation functions)
- Infrastructure config is optional - backward compatibility is critical
- Focus on build-time validation; runtime validation happens in Motia Cloud

## Tasks

- [x] **1.0 Add Infrastructure Config Types to Core Package**
  - [x] 1.1 Define `HandlerConfig` type in `packages/core/src/types.ts` with fields: `ram` (number), `cpu` (number, optional), `machineType` ('cpu' | 'memory' | 'gpu'), `timeout` (number)
  - [x] 1.2 Define `QueueConfig` type in `packages/core/src/types.ts` with fields: `type` ('fifo' | 'standard'), `messageGroupId` (string | null, optional), `maxRetries` (number), `retryStrategy` ('none' | 'exponential' | 'jitter'), `visibilityTimeout` (number)
  - [x] 1.3 Define `InfrastructureConfig` type combining optional `handler` (Partial<HandlerConfig>) and optional `queue` (Partial<QueueConfig>)
  - [x] 1.4 Add optional `infrastructure?: Partial<InfrastructureConfig>` field to `EventConfig` type
  - [x] 1.5 Add optional `infrastructure?: Partial<InfrastructureConfig>` field to `ApiRouteConfig` type
  - [x] 1.6 Add optional `infrastructure?: Partial<InfrastructureConfig>` field to `CronConfig` type
  - [x] 1.7 Export all new infrastructure types from `packages/core/src/types.ts`

- [ ] **2.0 Add Zod Validation Schemas for Infrastructure Config**
  - [x] 2.1 Create `AWS_LAMBDA_LIMITS` constants in `packages/core/src/step-validator.ts`: MIN_RAM_MB (128), MAX_RAM_MB (10240), MIN_TIMEOUT_SECONDS (1), MAX_TIMEOUT_SECONDS (900)
  - [x] 2.2 Create `AWS_LAMBDA_CPU_RATIO` mapping in `packages/core/src/step-validator.ts` with RAM values (128-10240) to CPU (0.0625-5) - use exact values from cloud code
  - [x] 2.3 Create `getProportionalCpu()` helper function that interpolates CPU based on RAM for values not in the mapping
  - [x] 2.4 Create `handlerSchema` using z.object with: `ram` (number with min/max), `timeout` (number with min/max), `cpu` (optional number), `machineType` (enum: 'cpu', 'memory', 'gpu')
  - [x] 2.5 Add `.superRefine()` to `handlerSchema` validating CPU is proportional to RAM (within 0.1 tolerance) when CPU is provided - only validate if both ram and cpu are defined
  - [x] 2.6 Create `queueSchema` with: `type` (enum: 'fifo', 'standard'), `visibilityTimeout` (number), `messageGroupId` (string, nullable, optional), `maxRetries` (number, min 0), `retryStrategy` (enum: 'none', 'exponential', 'jitter')
  - [x] 2.7 Create `infrastructureSchema` combining optional `handler` and optional `queue` (both can be partial/undefined)
  - [x] 2.8 Add `.superRefine()` to `infrastructureSchema` validating: (a) visibilityTimeout > handler.timeout (only when both are provided), (b) FIFO requires messageGroupId (only when queue type is 'fifo')
  - [x] 2.9 Create `createInfrastructureSchema(inputSchema?)` function that returns infrastructureSchema with additional `.superRefine()` for messageGroupId validation
  - [x] 2.10 In messageGroupId validation, check for dots and brackets (nested paths/template expressions) and reject them
  - [x] 2.11 In messageGroupId validation, verify key exists in inputSchema.shape when inputSchema is provided - skip validation if inputSchema is not provided
  - [x] 2.12 Update `eventSchema` to include optional `infrastructure` field (allow any structure, validated separately by build process)
  - [x] 2.13 Update `apiSchema` to include optional `infrastructure` field (allow any structure, validated separately by build process)
  - [x] 2.14 Update `cronSchema` to include optional `infrastructure` field (allow any structure, validated separately by build process)
  - [x] 2.15 Create unit tests in `packages/core/src/__tests__/infrastructure-config.test.ts` testing all validation scenarios without defaults

- [x] **2.0 Add Zod Validation Schemas for Infrastructure Config**

- [ ] **3.0 Implement Build-Time Validation Integration**
  - [x] 3.1 Create `validateInfrastructureConfig()` function in `packages/core/src/step-validator.ts` that validates (but doesn't normalize) infrastructure config
  - [x] 3.2 In `validateInfrastructureConfig()`, call `createInfrastructureSchema(inputSchema)` with the step's input schema (if available and is Zod)
  - [x] 3.3 In `validateInfrastructureConfig()`, catch ZodError and format errors with step name and error paths - return validation errors, not normalized config
  - [x] 3.4 Add infrastructure validation to `packages/snap/src/cloud/build/build-validation.ts` in the `validateStepsConfig()` loop
  - [x] 3.5 For each step with infrastructure config, call `validateInfrastructureConfig()` and collect any validation errors
  - [x] 3.6 Format infrastructure validation errors following existing pattern: colored messages (red for errors, magenta for values), relative file paths, arrow bullets
  - [x] 3.7 Add warning (not error) when queue config is present on non-Event steps with message: "Queue configuration is only applicable to Event steps and will be ignored"
  - [x] 3.8 Ensure validation only runs on steps with infrastructure config defined (skip steps without it)
  - [x] 3.9 Create comprehensive tests in `packages/snap/src/cloud/build/__tests__/infrastructure-validation.test.ts` covering: valid configs, invalid RAM, invalid CPU-RAM ratio, FIFO without messageGroupId, visibilityTimeout < timeout, invalid messageGroupId key, nested messageGroupId paths
  - [x] 3.10 Add integration test verifying full build validation flow with infrastructure config errors

- [x] **3.0 Implement Build-Time Validation Integration**

- [ ] **4.0 Update Build Output and Deployment Integration**
  - [x] 4.1 Verify `BuildStepConfig` type in `packages/snap/src/cloud/build/builder.ts` includes infrastructure config from StepConfig (should be automatic via `config: StepConfig` field)
  - [x] 4.2 Review `StepsConfigFile` JSON serialization in `packages/snap/src/cloud/new-deployment/build.ts` to ensure infrastructure config is included (line 61-66)
  - [x] 4.3 Verify infrastructure config is passed to Motia Cloud API in `packages/snap/src/cloud/new-deployment/cloud-api/start-deployment.ts` via `steps: BuildStepsConfig` parameter
  - [x] 4.4 Create integration test verifying steps with infrastructure config serialize correctly to JSON
  - [x] 4.5 Create integration test verifying steps without infrastructure config (backward compatibility) still work correctly

- [x] **4.0 Update Build Output and Deployment Integration**

- [x] **5.0 Testing (Already Completed)**
  - [x] 5.1-5.5 All covered by 52 unit tests in `packages/core/src/__tests__/infrastructure-config.test.ts`
  - [x] 5.6-5.14 All covered by 27 integration tests in `packages/snap/src/cloud/build/__tests__/infrastructure-validation.test.ts`
  - [x] 5.15 Covered by comprehensive build validation integration tests
  
**Total Test Coverage: 92 tests (52 unit + 27 integration + 13 serialization)**

## Implementation Notes

### AWS Lambda CPU-RAM Proportional Calculation
CPU is optional and auto-calculated based on RAM if not provided. Use the exact mapping from cloud code:

```typescript
const AWS_LAMBDA_CPU_RATIO: Record<number, number> = {
  128: 0.0625, 256: 0.125, 512: 0.25, 1024: 0.5, 1536: 0.75,
  2048: 1, 3008: 1.5, 4096: 2, 5120: 2.5, 6144: 3,
  7168: 3.5, 8192: 4, 9216: 4.5, 10240: 5
}
```

For RAM values not in the map, interpolate proportionally between adjacent values. Validate with 0.1 vCPU tolerance when CPU is explicitly provided.

### No Default Values in Framework
The Framework build-time validation does NOT apply default values - it only validates constraints:
- Validates RAM range, CPU-RAM proportionality, timeout range
- Validates queue configuration when provided
- Validates messageGroupId against input schema

**Default values are applied by Motia Cloud** during deployment using `DEFAULT_INFRASTRUCTURE_CONFIG`. The Framework just validates whatever the developer provides.

### MessageGroupId Validation Strategy
1. Only validate when messageGroupId is provided (non-null)
2. Check for nested paths: reject if contains `.` or `[` characters
3. If step has Zod input schema, extract keys from `inputSchema.shape`
4. Verify messageGroupId exists as a top-level key
5. Provide clear error messages including available keys when validation fails

### Error Message Pattern
Build-time validation errors should follow the existing colored pattern:
```typescript
errors.push({
  relativePath: path.relative(builder.projectDir, step.filePath),
  message: [
    'Infrastructure configuration error:',
    `  ${colors.red('➜')} handler.ram must be between 128 and 10240 MB`,
    `  ${colors.red('➜')} Current value: ${colors.magenta(ram + 'MB')}`,
  ].join('\n'),
  step,
})
```

Convert Zod validation errors (from `validateInfrastructureConfig`) into this format for consistent CLI output.

### Validation Approach: Cloud vs Framework

**Motia Cloud** (deployment runtime):
- Uses `parseInfrastructureConfig()` with full Zod schemas including `.default()` values
- Returns normalized config with all fields populated
- Throws formatted errors if validation fails

**Motia Framework** (build-time validation):
- Uses `validateInfrastructureConfig()` with constraint-only Zod schemas (NO defaults)
- Only checks constraints: ranges, enums, CPU-RAM proportionality, messageGroupId validity
- Returns validation errors for CLI display - does NOT normalize or return config
- Formats errors with colors for terminal output

**Key Difference**: Framework validates structure/constraints only. Cloud normalizes with defaults.

### Backward Compatibility Testing
Ensure existing steps without infrastructure config:
- Still validate successfully without errors or warnings (Framework skips validation when config is absent)
- Build and bundle correctly
- Deploy to Motia Cloud successfully
- Get default infrastructure values applied by Cloud at deployment time

