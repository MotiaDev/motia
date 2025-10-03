## Improvements to State Management

The current way of working with State and Streams is fine, but we need to add some more features to it.

1. Allow developers to increment/decrement values without fetching first.
2. Allow developers to make multiple updates to State/Streams with a single Transaction and be able to rollback the changes if one of the updates fails.

## Increment/Decrement

```typescript
type StateManager = {
  // Existing methods will continue to work as they do now
  get<T>(groupId: string, key: string): Promise<T | null>
  delete<T>(groupId: string, key: string): Promise<T | null>
  getGroup<T>(groupId: string): Promise<T[]>
  clear(groupId: string): Promise<void>

  set<T>(groupId: string, key: string, value: T): Promise<T>

  // New methods will be added

  incrementNumber<T>(groupId: string, key: string, property: string, value: number): Promise<T>
  decrementNumber<T>(groupId: string, key: string, property: string, value: number): Promise<T>
}
```

### Usage

```typescript
type StateType = {
  name: string
  count: number
}

const groupId = 'my-group'
const key = 'my-key'

await state.set<StateType>(groupId, key, { name: 'John', count: 1 })

await state.incrementNumber<StateType>(groupId, key, 'count', 2)
await state.decrementNumber<StateType>(groupId, key, 'count', 1)
```

This means that there's no need to fetch the state first, and then update it, we can just update it directly.

## Set TTL to Items

```typescript
type Options = {
  /**
   * The time to live in seconds
   */
  ttl?: number
}

type StateManager = {
  /**
   * Sets a single item in the state
   *
   * @param groupId - The group id of the state
   * @param key - The key of the item to set
   * @param value - The value of the item to set
   * @param options - The options for the item
   * @returns The item
   */
  set<T>(groupId: string, key: string, value: T, options?: Options): Promise<T>
}
```

### Usage

```typescript
type StateType = {
  name: string
  count: number
}

const groupId = 'my-group'
const key = 'my-key'
const value = { name: 'John', count: 1 }

// This will set the item with a TTL of 3600 seconds (1 hour)
await state.set<StateType>(groupId, key, value, { ttl: 3600 })
```

## Streams

Same logic should be applied to Streams: increment/decrement, set TTL to items.
