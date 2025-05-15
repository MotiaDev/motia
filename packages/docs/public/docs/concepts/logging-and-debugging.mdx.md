---
title: Logging & Debugging
---

## Overview

Motia provides an out of the box logging and debugging system that works across different runtime environments. The system offers:

- Real-time log streaming in both terminal and Motia Workbench
- Multiple log levels with contextual information
- Local development debugging tools
- Integrated flow monitoring

## Log Levels and Usage

Motia supports four standard log levels:

| Log Type | Description |
| -------- | ----------- |
| info     | General information about step execution, flow progress, and successful operations |
| error    | Critical issues, exceptions, failed operations, and system errors |
| debug    | Detailed debugging information and diagnostic data for troubleshooting |
| warn     | Potential issues, edge cases, or situations requiring attention |

### Example Usage

<Tabs items={['TS', 'JS', 'Python', 'Ruby']}>
  <Tab value='TS'>
    ```typescript
    export const handler: StepHandler<typeof config> = async (input, { logger }) => {
      // Basic logging
      logger.info('Starting process')

      // Logging with context
      logger.info('Operation completed', {
        operationId: input.id,
        duration: 1500
      })

      // Error handling
      try {
        await riskyOperation()
      } catch (error) {
        logger.error('Operation failed', {
          error: error.message,
          stack: error.stack
        })
      }

      // Debug logging
      logger.debug('Operation details', {
        rawInput: input,
        timestamp: Date.now()
      })

      // Warning logging
      if (input.amount > 1000) {
        logger.warn('Large operation detected', {
          amount: input.amount,
          threshold: 1000
        })
      }
    }
    ```
  </Tab>
  <Tab value='JS'>
    ```javascript
    export const handler = async (input, { logger }) => {
      // Basic logging
      logger.info('Starting process')

      // Logging with context
      logger.info('Operation completed', {
        operationId: input.id,
        duration: 1500
      })

      // Error handling
      try {
        await riskyOperation()
      } catch (error) {
        logger.error('Operation failed', {
          error: error.message,
          stack: error.stack
        })
      }

      // Debug logging
      logger.debug('Operation details', {
        rawInput: input,
        timestamp: Date.now()
      })

      // Warning logging
      if (input.amount > 1000) {
        logger.warn('Large operation detected', {
          amount: input.amount,
          threshold: 1000
        })
      }
    }
    ```
  </Tab>
  <Tab value='Python'>
    ```python
    async def handler(input, ctx):
        # Basic logging
        ctx.logger.info('Starting process')

        # Logging with context
        ctx.logger.info('Operation completed', {
            'operation_id': input.get("id"),
            'duration': 1500
        })

        # Error handling
        try:
            await risky_operation()
        except Exception as error:
            ctx.logger.error('Operation failed', {
                'error': str(error),
                'stack': traceback.format_exc()
            })

        # Debug logging
        ctx.logger.debug('Operation details', {
            'raw_input': input.__dict__,
            'timestamp': time.time()
        })

        # Warning logging
        if input.amount > 1000:
            ctx.logger.warn('Large operation detected', {
                'amount': input.get("amount"),
                'threshold': 1000
            })
    ```
  </Tab>
  <Tab value='Ruby'>
    ```ruby
    def handler(input, ctx)
      # Basic logging
      ctx.logger.info('Starting process')

      # Logging with context
      ctx.logger.info('Operation completed', {
        operation_id: input.id,
        duration: 1500
      })

      # Error handling
      begin
        risky_operation()
      rescue StandardError => error
        ctx.logger.error('Operation failed', {
          error: error.message,
          stack: error.backtrace.join("\n")
        })
      end

      # Debug logging
      ctx.logger.debug('Operation details', {
        raw_input: input.to_h,
        timestamp: Time.now.to_i
      })

      # Warning logging
      if input.amount > 1000
        ctx.logger.warn('Large operation detected', {
          amount: input.amount,
          threshold: 1000
        })
      end
    end
    ```
  </Tab>
</Tabs>

## Running and Debugging

<Steps>
  <Step>
    ### Start the Dev Server

    1. Navigate to your Motia project root folder
    2. Start the development server:

    <Tabs items={['pnpm', 'yarn', 'npm', 'bun']}>
      <Tab value='pnpm'>
      ```bash
      pnpm run dev
      ```
      </Tab>
      <Tab value='yarn'>
      ```bash
      yarn run dev
      ```
      </Tab>
      <Tab value='npm'>
      ```bash
      npm run dev
      ```
      </Tab>
      <Tab value='bun'>
      ```bash
      bun run dev
      ```
      </Tab>
    </Tabs>

    3. You can monitor logs in two ways:
      - Open [Motia Workbench](http://localhost:3000), select your flow, and expand the logs container
      - View logs directly in the terminal where you ran the dev command
  </Step>
  <Step>
  ### Trigger and Monitor Flows

    You can trigger flows using either the CLI or an [API step](/docs/concepts/steps/api):

    <Tabs items={['cli', 'api']}>
      <Tab value='cli'>
      ```bash
      npx motia emit --topic <topic> --message '{}'
      ```
      </Tab>
      <Tab value='api'>
      ```bash
      curl -X POST http://localhost:3000/<api-step-path> \
      -H "Content-Type: application/json" \
      -d '{}'
      ```
      </Tab>
    </Tabs>
  </Step>
  <Step>
  ### Debug Using Logs

  Each log entry automatically includes:

  - `timestamp`: When the log was generated
  - `traceId`: Unique identifier for the flow execution
  - `flows`: Array of flow names this step belongs to
  - `file`: Source file generating the log
  - `level`: Log level
  - `msg`: Log message
  </Step>
  <Step>
  ### Stopping the development server

  Press **Ctrl + C** (or **Cmd + C** on macOS) in your terminal. That's it!
  </Step>
</Steps>

## Best Practices

### Structured Logging

```typescript
// Good - Structured and searchable
logger.info('Payment processed', {
  paymentId: '123',
  amount: 100,
  status: 'success'
})

// Avoid - Harder to parse and search
logger.info(`Payment ${paymentId} processed: amount=${amount}`)
```

### Performance Monitoring

```typescript
export const handler: StepHandler<typeof config> = async (input, { logger }) => {
  const startTime = performance.now()
  
  // Process operation
  const result = await processOperation(input)

  logger.info('Operation completed', {
    duration: performance.now() - startTime,
    memoryUsage: process.memoryUsage().heapUsed
  })
}
```

### Debugging Tips

{/* TODO: Add Motia Workbench filter logs guide when the feature is implemented*/}
{/* 1. Use Motia Workbench to filter logs by:
   - Log level
   - Flow
   - Time range
   - Content search */}

1. Add detailed context to error logs:
```typescript
logger.error('Operation failed', {
  error: error.message,
  code: error.code,
  input: JSON.stringify(input),
  stack: error.stack
})
```

2. Use debug logs for detailed troubleshooting:
```typescript
logger.debug('Operation details', {
  rawInput: input,
  timestamp: Date.now(),
  state: currentState
})
```

<Callout>
Remember to stop your development server with Ctrl + C (or Cmd + C on macOS) when you're done debugging.
</Callout>