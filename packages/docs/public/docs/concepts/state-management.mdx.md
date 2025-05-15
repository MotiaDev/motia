---
title: State Management
description: Learn how to manage state within your Motia.dev workflows for persistent data and cross-step communication.
---

State management is fundamental to building robust and dynamic workflows in Motia.dev. Our system is designed to be powerful yet simple, providing you with everything you need to maintain state across your flows and steps:

✨ **Zero Configuration (Default):** In-memory storage out of the box for quick setup. <br />
🔌 **Flexible Storage Options:** Choose from Memory, File, and Redis adapters to suit your persistence needs. <br />
🧹 **Automatic State Cleanup:** Optional Time-To-Live (TTL) support for automatic state expiration (Redis). <br />
🔒 **Built-in Isolation:** Each flow execution can use its own isolated state, ensuring data separation and security. <br />

## Core Concepts: State Manager Methods

The `state` object, accessible within your step handlers via the `ctx` context, provides the following methods for state management:

| Method    | Parameters                             | Return Type          | Description                                                                                                                                                                                   |
| --------- | -------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`     | `scope: string, key: string`           | `Promise<T \| null>` | Retrieves a value associated with the given `key` and `scope` from the state store. Returns `null` if the key is not found. The type `T` is inferred based on how you use the returned value. |
| `set`     | `scope: string, key: string, value: T` | `Promise<void>`      | Stores a `value` associated with the given `key` and `scope` in the state store. The type `T` can be any serializable JavaScript/JSON value.                                                  |
| `delete`  | `scope: string, key: string`           | `Promise<void>`      | Removes the key-value pair associated with the given `key` and `scope` from the state store.                                                                                                  |
| `clear`   | `scope: string`                        | `Promise<void>`      | Removes **all** state data associated with the provided `scope`. This is useful for cleaning up state for a specific scope.                                                                   |
| `cleanup` | _(None)_                               | `Promise<void>`      | Performs periodic maintenance tasks, such as removing expired state data (TTL cleanup). The actual implementation depends on the configured state adapter.                                    |

**Important:** State manager methods (`get`, `set`, `delete`, `clear`) **require a `scope` string as the first parameter.** While in most cases, you will use the `traceId` (automatically provided in `ctx.traceId`) as the scope to ensure flow-level isolation, **you can technically use any string value as the scope** to group and manage state data as needed. Using `traceId` is the recommended and most common practice for flow-isolated state.

### State Scope and Isolation

Each flow execution in Motia.dev is assigned a unique `traceId` (a UUID). Using this `traceId` as the **scope** for state management provides automatic isolation, ensuring: _(Revised to clarify `traceId` as scope)_

| Feature        | Description                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Isolation**  | Each flow execution operates within its own isolated state space when using `traceId` as the scope.                 |
| **Boundaries** | Clear separation of state data between different flow executions when scoped by `traceId`, preventing interference. |
| **Cleanup**    | State data scoped by `traceId` can be easily cleared using `state.clear(traceId)`.                                  |

### State Structure Example

State data is stored as key-value pairs, namespaced under a scope string. When using `traceId` as the scope, the internal structure might look like this:

```typescript
// Example state structure (internal representation) - using traceId as scope
{
  "motia:state:{traceId-123}": {  // State for flow execution with traceId 'traceId-123' (scope)
    "booking": {                 // Namespaced key 'booking'
      "customer": { ... },
      "venue": { ... }
    },
    "payment": {                 // Namespaced key 'payment'
      "status": "pending",
      "amount": 100
    }
  },
  "motia:state:{traceId-456}": {  // State for another flow execution with traceId 'traceId-456' (different scope)
    // ... different state data for this flow ...
  }
}
```

> **Info:** You can access the `state` manager within any step through the `ctx` (context) argument, which is automatically injected into your [step handler](/docs/concepts/steps/defining-steps#handler). While **`traceId` from `ctx.traceId` is the recommended scope for flow isolation**, remember that **you can use any string as the scope** parameter in `state` methods for more advanced state management scenarios.

## Using State in Steps

<Tabs items={['TypeScript', 'JavaScript', 'Python', 'Ruby']}>
  <Tab label="TypeScript">
    ```typescript
    import { StepHandler } from 'motia'

    interface BookingData {
      customer: { name: string; email: string };
      venue: { id: string; name: string };
    }

    export const handler: StepHandler<typeof config> = async (input, { state, traceId }) => { // Get traceId from context
      // Store state (using traceId as scope)
      await state.set<BookingData>(traceId, 'booking', {
        customer: input.customer,
        venue: input.venue,
      });

      // Retrieve state (using traceId as scope)
      const booking = await state.get<BookingData>(traceId, 'booking');

      // Delete specific state (using traceId as scope)
      await state.delete(traceId, 'booking');

      // Clear all state for this flow (using traceId as scope)
      await state.clear(traceId);
    }
    ```

  </Tab>

  <Tab label="JavaScript">
    ```javascript
    import { StepHandler } from 'motia'

    export const handler = async (input, { state, traceId }) => { // Get traceId from context
      // Store state (using traceId as scope)
      await state.set(traceId, 'booking', {
        customer: input.customer,
        venue: input.venue,
      });

      // Retrieve state (using traceId as scope)
      const booking = await state.get(traceId, 'booking');

      // Delete specific state (using traceId as scope)
      await state.delete(traceId, 'booking');

      // Clear all state for this flow (using traceId as scope)
      await state.clear(traceId);
    }
    ```

  </Tab>

  <Tab label="Python">
    ```python
    async def handler(input, ctx): # ctx is the context object
        trace_id = ctx.trace_id # Access traceId from context

        # Store state (using traceId as scope)
        await ctx.state.set(trace_id, 'booking', {
            'customer': input.get("customer"),
            'venue': input.get("venue")
        })

        # Retrieve state (using traceId as scope)
        booking = await ctx.state.get(trace_id, 'booking')

        # Delete specific state (using traceId as scope)
        await ctx.state.delete(trace_id, 'booking')

        # Clear all state (using traceId as scope)
        await ctx.state.clear(trace_id)
    ```

  </Tab>

  <Tab label="Ruby">
    ```ruby
    def handler(input, context) # context is the context object
      trace_id = context.trace_id # Access traceId from context

      # Store state (using traceId as scope)
      context.state.set(trace_id, 'booking', {
        customer: input.customer,
        venue: input.venue
      })

      # Retrieve state (using traceId as scope)
      booking = context.state.get(trace_id, 'booking')

      # Delete specific state
      context.state.delete(trace_id, 'booking')

      # Clear all state (using traceId as scope)
      context.state.clear(trace_id)
    end
    ```

  </Tab>
</Tabs>

## Debugging

### Inspecting State

<Tabs items={['Memory', 'File', 'Redis']}>
  <Tab label="Memory">
    > State is only available during runtime in the Node.js process memory. You cannot inspect memory state directly outside of a running step execution. Use logging within your steps to output state values for debugging purposes.
  </Tab>
  <Tab label="File">
    To inspect state stored in the **File Adapter**, you can directly view the contents of the state file using the Motia CLI:

    ```bash
    # View state file contents
    motia state list
    ```

    This command will output the entire state file (motia.state.json) content in JSON format to your console, allowing you to examine the stored state data.

  </Tab>
  <Tab label="Redis">
    To inspect state stored in **Redis Adapter**, you can use the `redis-cli` command-line tool to interact with your Redis server:

    ```bash
    # List all state keys (under the motia:state prefix)
    redis-cli KEYS "motia:state:*"

    # Get specific state for a given traceId and key
    redis-cli GET "motia:state:{traceId}:booking"
    ```
    **Note:** Replace `{traceId}` in the `redis-cli GET` command with the actual `traceId` of the flow execution you are debugging. Replace `booking` with the specific `key` you want to inspect.

  </Tab>
</Tabs>

## Best Practices

### Namespacing

Use dot notation to organize related state data hierarchically:

<Tabs items={['TypeScript', 'JavaScript', 'Python', 'Ruby']}>
  <Tab label="TypeScript">
    ```typescript
    // Good - Organized hierarchically (using traceId scope)
    await state.set(traceId, 'booking.customer', customerData)
    await state.set(traceId, 'booking.venue', venueData)
    await state.set(traceId, 'payment.status', 'pending')

    // Avoid - Flat structure (using traceId scope)
    await state.set(traceId, 'customer', customerData)
    await state.set(traceId, 'venue', venueData)
    await state.set(traceId, 'paymentStatus', 'pending')
    ```

  </Tab>

  <Tab label="JavaScript">
    ```javascript
    // Good - Organized hierarchically (using traceId scope)
    await state.set(traceId, 'booking.customer', customerData)
    await state.set(traceId, 'booking.venue', venueData)
    await state.set(traceId, 'payment.status', 'pending')

    // Avoid - Flat structure (using traceId scope)
    await state.set(traceId, 'customer', customerData)
    await state.set(traceId, 'venue', venueData)
    await state.set(traceId, 'paymentStatus', 'pending')
    ```

  </Tab>

  <Tab label="Python">
    ```python
    # Good - Organized hierarchically (using traceId scope)
    await ctx.state.set(trace_id, 'booking.customer', customer_data)
    await ctx.state.set(trace_id, 'booking.venue', venue_data)
    await ctx.state.set(trace_id, 'payment.status', 'pending')

    // Avoid - Flat structure (using traceId scope)
    await ctx.state.set(trace_id, 'customer', customer_data)
    await ctx.state.set(trace_id, 'venue', venue_data)
    await ctx.state.set(trace_id, 'payment_status', 'pending')
    ```

  </Tab>

  <Tab label="Ruby">
    ```ruby
    # Good - Organized hierarchically (using traceId scope)
    state.set(trace_id, 'booking.customer', customer_data)
    state.set(trace_id, 'booking.venue', venue_data)
    state.set(trace_id, 'payment.status', 'pending')

    # Avoid - Flat structure
    state.set(trace_id, 'customer', customer_data)
    state.set(trace_id, 'venue', venue_data)
    state.set('payment_status', 'pending')
    ```

  </Tab>
</Tabs>

### Type Safety

Define types for your state data to ensure consistency:

<Tabs items={['TypeScript', 'JavaScript', 'Python', 'Ruby']}>
  <Tab label="TypeScript">
    ```typescript
    interface CustomerData {
      name: string;
      email: string;
    }

    interface VenueData {
      id: string;
      capacity: number;
    }

    type BookingState = {
      customer: CustomerData;
      venue: VenueData;
      status: 'pending' | 'confirmed';
    }

    const booking = await state.get<BookingState>(traceId, 'booking')
    ```

  </Tab>

{' '}
<Tab label="JavaScript">
  ```javascript // Define types or interfaces as needed for documentation clarity (optional in JS) const booking = await
  state.get(traceId, 'booking') // No type casting in JS example ```
</Tab>

  <Tab label="Python">
    ```python
    from dataclasses import dataclass
    from typing import Literal

    @dataclass
    class CustomerData:
        name: str
        email: str

    @dataclass
    class VenueData:
        id: str
        capacity: int

    @dataclass
    class BookingState:
        customer: CustomerData
        venue: VenueData
        status: Literal['pending', 'confirmed']

    booking = await state.get(traceId, 'booking')
    ```

  </Tab>

  <Tab label="Ruby">
    ```ruby
    # Using Sorbet for type checking
    class CustomerData < T::Struct
      const :name, String
      const :email, String
    end

    class VenueData < T::Struct
      const :id, String
      const :capacity, Integer
    end

    class BookingState < T::Struct
      const :customer, CustomerData
      const :venue, VenueData
      const :status, T.enum([:pending, :confirmed])
    end

    booking = state.get(traceId, 'booking')
    ```

  </Tab>
</Tabs>

### Cleanup

Always clean up state when you're done with it:

<Tabs items={['TypeScript', 'JavaScript', 'Python', 'Ruby']}>
    <Tab label="TypeScript">
      ```typescript
      export const handler: StepHandler<typeof config> = async (input, { state, traceId }) => {
        try {
          await processBooking(input)
          // Clean up specific keys
          await state.delete(traceId, 'booking.customer')
          // Or clean everything
          await state.clear(traceId)
        } catch (error) {
          // Handle errors
        }
      }
      ```
    </Tab>

    <Tab label="JavaScript">
      ```javascript
      export const handler = async (input, { state, traceId }) => {
        try {
          await processBooking(input)
          // Clean up specific keys
          await state.delete(traceId, 'booking.customer')
          // Or clean everything
          await state.clear(traceId)
        } catch (error) {
          // Handle errors
        }
      }
      ```
    </Tab>

    <Tab label="Python">
      ```python
      async def handler(input, ctx):
          trace_id = ctx.trace_id
          try:
              await process_booking(input)
              # Clean up specific keys
              await ctx.state.delete(trace_id, 'booking.customer')
              # Or clean everything
              await ctx.state.clear(trace_id)
          except Exception as error:
              # Handle errors
              pass
      ```
    </Tab>

    <Tab label="Ruby">
      ```ruby
      def handler(input, ctx)
        trace_id = ctx.trace_id
        begin
          process_booking(input)
          # Clean up specific keys
          ctx.state.delete(trace_id, 'booking.customer')
          # Or clean everything
          ctx.state.clear(trace_id)
        rescue => error
          # Handle errors
        end
      end
      ```
      </Tab>

</Tabs>

### Performance Considerations

| Consideration    | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| Batch Operations | Group related state updates and use atomic operations when possible  |
| State Size       | Keep state data minimal and consider access patterns                 |
| TTL Management   | Set appropriate TTLs based on flow duration and error recovery needs |

### Custom State Adapters

```typescript title="Custom State Adapter Example"
import { StateAdapter } from 'motia'

class CustomStateAdapter extends StateAdapter {
  async get<T>(traceId: string, key: string): Promise<T | null> {
    // Implementation
    return null
  }

  async set<T>(traceId: string, key: string, value: T): Promise<void> {
    // Implementation
  }

  async delete(traceId: string, key: string): Promise<void> {
    // Implementation
  }

  async clear(traceId: string): Promise<void> {
    // Implementation
  }

  async cleanup(): Promise<void> {
    // Implementation
  }
}
```

### Storage Adapters

Motia.dev offers three built-in storage adapters:

- 📁 **File (Default):** Persists state to a JSON file in your project (`.motia/motia.state.json`). No configuration needed for basic use.
- 💾 **Memory:** Stores state in-memory. Fastest option, but state is not persistent across server restarts. Useful for development and non-critical data.
- ⚡ **Redis:** Leverages Redis for persistent and scalable state storage. Ideal for production environments and flows requiring high availability and data durability.

To configure a different state adapter, modify the `config.yml` file in your project root:

```
my-project/
├── config.yml
└── steps/
    ├── step-1.ts
    └── step-2.ts
```

**File Adapter (Default)**

> Default, no configuration required, state is stored into .motia/motia.state.json in your project root

**Memory Adapter**

```yaml title="config.yml"
state:
  adapter: memory
```

> **Warning: Memory Adapter**
> State is stored in-memory and will be lost when the Motia.dev server restarts. Suitable for development and testing.

**Redis Adapter**

```yaml title="config.yml"
state:
  adapter: redis
  host: localhost # Redis server host (e.g., 'localhost' or IP address)
  port: 6379 # Redis server port (default: 6379)
  password: optional # Redis password (if required)
  ttl: 3600 # Optional: State Time-To-Live in seconds (e.g., 3600 seconds = 1 hour)
```

> **Info: Redis Adapter**
> Recommended for production environments. Requires a running Redis server. The `ttl` (Time-To-Live) option is available to automatically expire state data after a specified number of seconds, helping to manage Redis storage.

### Common Issues

| Issue             | Troubleshooting Steps                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| State Not Found   | - Verify state adapter configuration\n- Check TTL expiration (Redis)\n- Ensure file permissions (File adapter)\n- **Ensure correct `traceId` is being used in `state.get(traceId, key)` calls.** |
| Persistence       | - Memory adapter: State is lost on process restart\n- File adapter: Check file write permissions\n- Redis: Verify connection and persistence settings                                            |
| Concurrent Access | - Memory/File: Limited concurrent flow support\n- Redis: Use atomic operations and implement retry logic                                                                                         |
