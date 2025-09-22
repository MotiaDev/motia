# Atomic State API Implementation Plan

## Overview
This document outlines the complete implementation plan for transitioning Motia's state management to a fully atomic API. The plan includes updating all core interfaces, adapters, RPC handlers, tests, documentation, and example code across the entire repository.

## Core Principle
**All state operations will be atomic by default** - ensuring data consistency and preventing race conditions in concurrent workflow scenarios.

## Phase 1: Core Interface Updates

### 1.1 Update Core Types
**File:** `packages/core/src/types.ts`
- [x] Update `InternalStateManager` interface to include new atomic operations
- [x] Add new operation types for observability
- [x] Add transaction and batch operation types

```typescript
export type InternalStateManager = {
  // Existing operations (all atomic)
  get<T>(traceId: string, key: string): Promise<T | null>
  set<T>(traceId: string, key: string, value: T): Promise<T>
  update<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T>
  delete<T>(traceId: string, key: string): Promise<T | null>
  getGroup<T>(groupId: string): Promise<T[]>
  clear(traceId: string): Promise<void>
  
  // New atomic primitives
  increment(traceId: string, key: string, delta?: number): Promise<number>
  decrement(traceId: string, key: string, delta?: number): Promise<number>
  compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean>
  
  // Atomic array operations
  push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]>
  pop<T>(traceId: string, key: string): Promise<T | null>
  shift<T>(traceId: string, key: string): Promise<T | null>
  unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]>
  
  // Atomic object operations
  setField<T, K extends keyof T>(traceId: string, key: string, field: K, value: T[K]): Promise<T>
  deleteField<T>(traceId: string, key: string, field: string): Promise<T>
  
  // Transaction support
  transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>>
  
  // Batch operations
  batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>>
  
  // Utility operations
  exists(traceId: string, key: string): Promise<boolean>
  
  // Deprecated - will be removed in future version
  atomicUpdate?<T>(traceId: string, key: string, updateFn: (current: T | null) => T): Promise<T>
}

// New types for transactions and batches
export interface StateOperation {
  type: 'get' | 'set' | 'update' | 'delete' | 'increment' | 'decrement' | 'compareAndSwap' | 'push' | 'pop' | 'shift' | 'unshift' | 'setField' | 'deleteField'
  key: string
  value?: any
  updateFn?: (current: any) => any
  expected?: any
  delta?: number
  items?: any[]
  field?: string
}

export interface BatchOperation extends StateOperation {
  id?: string // For result mapping
}

export interface TransactionResult<T> {
  success: boolean
  results: T[]
  error?: string
}

export interface BatchResult<T> {
  results: Array<{ id?: string; value: T; error?: string }>
}
```

### 1.2 Update State Adapter Interface
**File:** `packages/core/src/state/state-adapter.ts`
- [x] Extend `StateAdapter` interface to include all new atomic operations
- [x] Add transaction and batch operation interfaces
- [x] Update method signatures to match new atomic API

### 1.3 Update Observability Types
**File:** `packages/core/src/observability/types.ts`
- [x] Add new operation types: `'increment' | 'decrement' | 'compareAndSwap' | 'push' | 'pop' | 'shift' | 'unshift' | 'setField' | 'deleteField' | 'transaction' | 'batch' | 'exists'`
- [x] Update `StateOperation` type to include new operations

## Phase 2: State Adapter Implementations

### 2.1 Memory State Adapter
**File:** `packages/core/src/state/adapters/memory-state-adapter.ts`
- [x] Implement all new atomic operations with proper locking
- [x] Add transaction support with multi-key locking
- [x] Add batch operation support
- [x] Ensure all operations are atomic (including `get` operations)
- [x] Add comprehensive error handling
- [x] Optimize locking mechanism for better performance
- [x] **NOTE**: No TTL needed - uses manual cleanup via `clear()` and `delete()`

```typescript
export class MemoryStateAdapter implements StateAdapter {
  // Enhanced locking for multi-key operations
  private async withLock<T>(keys: string[], operation: () => Promise<T>): Promise<T>
  private async withMultiKeyLock<T>(keys: string[], operation: () => Promise<T>): Promise<T>
  
  // New atomic primitives
  async increment(traceId: string, key: string, delta = 1): Promise<number>
  async decrement(traceId: string, key: string, delta = 1): Promise<number>
  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean>
  
  // Atomic array operations
  async push<T>(traceId: string, key: string, ...items: T[]): Promise<T[]>
  async pop<T>(traceId: string, key: string): Promise<T | null>
  async shift<T>(traceId: string, key: string): Promise<T | null>
  async unshift<T>(traceId: string, key: string, ...items: T[]): Promise<T[]>
  
  // Atomic object operations
  async setField<T, K extends keyof T>(traceId: string, key: string, field: K, value: T[K]): Promise<T>
  async deleteField<T>(traceId: string, key: string, field: string): Promise<T>
  
  // Transaction support
  async transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>>
  
  // Batch operations
  async batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>>
  
  // Utility operations
  async exists(traceId: string, key: string): Promise<boolean>
}
```

### 2.2 File State Adapter
**File:** `packages/core/src/state/adapters/default-state-adapter.ts`
- [x] Implement all new atomic operations with file locking
- [x] Add transaction support with atomic file operations
- [x] Add batch operation support
- [x] Ensure atomic file writes for all operations
- [x] Add proper error handling and rollback mechanisms
- [x] **NOTE**: No TTL needed - uses manual cleanup via `clear()` and `delete()`

### 2.3 Create Redis State Adapter (Optional)
**File:** `packages/core/src/state/adapters/redis-state-adapter.ts`
- [ ] Create optional Redis adapter with full atomic operation support
- [ ] Use Redis Lua scripts for atomic operations
- [ ] Implement transaction support using Redis MULTI/EXEC
- [ ] Add TTL support for automatic cleanup (Redis-specific feature)
- [ ] Add connection pooling and error handling
- [ ] **IMPORTANT**: Redis is completely optional - all atomic operations work with Memory and File adapters
- [ ] **NOTE**: TTL is only needed for Redis - Memory and File adapters use manual cleanup

```typescript
export class RedisStateAdapter implements StateAdapter {
  constructor(config: RedisAdapterConfig)
  
  // All atomic operations using Redis Lua scripts
  async increment(traceId: string, key: string, delta = 1): Promise<number>
  async compareAndSwap<T>(traceId: string, key: string, expected: T | null, newValue: T): Promise<boolean>
  
  // Transaction support using Redis MULTI/EXEC
  async transaction<T>(traceId: string, operations: StateOperation[]): Promise<TransactionResult<T>>
  
  // Batch operations using Redis pipeline
  async batch<T>(traceId: string, operations: BatchOperation[]): Promise<BatchResult<T>>
}
```

### 2.4 Update State Adapter Factory
**File:** `packages/core/src/state/create-state-adapter.ts`
- [x] Add optional Redis adapter support (defaults to Memory if Redis not available)
- [x] Update factory to handle new adapter types
- [x] Add configuration validation
- [x] **IMPORTANT**: Ensure Memory and File adapters are fully functional without Redis

## Phase 3: RPC Communication Updates

### 3.1 Node.js RPC State Manager
**File:** `packages/core/src/node/rpc-state-manager.ts`
- [x] Add all new atomic operation methods
- [x] Update method signatures to match new API
- [x] Add proper error handling
- [x] Maintain backward compatibility

### 3.2 Python RPC State Manager
**File:** `packages/core/src/python/motia_rpc_state_manager.py`
- [x] Add all new atomic operation methods
- [x] Update method signatures to match new API
- [x] Add proper async/await handling
- [x] Add error handling and type hints

### 3.3 Ruby RPC State Manager
**File:** `packages/core/src/ruby/rpc_state_manager.rb`
- [x] Add all new atomic operation methods
- [x] Update method signatures to match new API
- [x] Add proper error handling
- [x] Maintain hash-like access pattern

### 3.4 Update RPC Handlers
**File:** `packages/core/src/call-step-file.ts`
- [x] Add handlers for all new atomic operations
- [x] Update existing handlers to ensure atomicity
- [x] Add transaction and batch operation handlers
- [x] Add proper error handling and logging
- [x] Update observability tracking for new operations

```typescript
// New RPC handlers to add
processManager.handler('state.increment', async (input) => { ... })
processManager.handler('state.decrement', async (input) => { ... })
processManager.handler('state.compareAndSwap', async (input) => { ... })
processManager.handler('state.push', async (input) => { ... })
processManager.handler('state.pop', async (input) => { ... })
processManager.handler('state.shift', async (input) => { ... })
processManager.handler('state.unshift', async (input) => { ... })
processManager.handler('state.setField', async (input) => { ... })
processManager.handler('state.deleteField', async (input) => { ... })
processManager.handler('state.transaction', async (input) => { ... })
processManager.handler('state.batch', async (input) => { ... })
processManager.handler('state.exists', async (input) => { ... })
```

## Phase 4: State Wrapper Updates

### 4.1 State Wrapper
**File:** `packages/core/src/state-wrapper.ts`
- [x] Add all new atomic operation methods
- [x] Ensure state change callbacks are triggered for all operations
- [x] Add proper error handling
- [x] Maintain backward compatibility

## Phase 5: Testing

### 5.1 Core Tests
**File:** `packages/core/src/__tests__/atomic-update.test.ts`
- [ ] Expand existing tests to cover all new atomic operations
- [ ] Add transaction and batch operation tests
- [ ] Add concurrent operation tests
- [ ] Add error handling tests
- [ ] Add performance tests

### 5.2 State Trigger Tests
**File:** `packages/core/src/__tests__/state-triggers.test.ts`
- [ ] Update tests to use new atomic operations
- [ ] Add tests for state triggers with new operations
- [ ] Ensure backward compatibility

### 5.3 Integration Tests
**File:** `playground/integration-tests/complexStateTriggers.spec.ts`
- [ ] Update to use new atomic operations
- [ ] Add tests for transaction and batch operations
- [ ] Add performance benchmarks

### 5.4 New Test Files
**File:** `packages/core/src/__tests__/atomic-operations.test.ts` (New)
- [x] Comprehensive tests for all atomic operations
- [x] Transaction and batch operation tests
- [x] Multi-adapter tests (Memory, File, optional Redis)
- [x] Error handling and edge case tests
- [x] **IMPORTANT**: All tests must pass with Memory and File adapters only

**File:** `packages/core/src/__tests__/atomic-update-compatibility.test.ts` (New)
- [x] Backward compatibility tests for atomicUpdate
- [x] Migration pattern tests
- [x] Performance comparison tests

**File:** `packages/core/src/__tests__/rpc-atomic-operations.test.ts` (New)
- [x] RPC atomic operations tests
- [x] Mock RPC sender tests
- [x] Error handling tests

**File:** `packages/core/src/__tests__/redis-state-adapter.test.ts` (New)
- [ ] Redis-specific tests (only run if Redis is available)
- [ ] Lua script tests
- [ ] Connection and error handling tests
- [ ] TTL and cleanup tests
- [ ] **IMPORTANT**: Skip tests if Redis is not available

## Phase 6: Documentation Updates

### 6.1 Core Documentation
**File:** `packages/docs/content/docs/concepts/state-management.mdx`
- [x] Update to document all new atomic operations
- [x] Add examples for transaction and batch operations
- [ ] Add performance considerations
- [ ] Add migration guide from old API

### 6.2 API Documentation
**File:** `packages/docs/content/docs/concepts/steps/defining-steps.mdx`
- [ ] Update state management examples
- [ ] Add atomic operation examples
- [ ] Add transaction examples

### 6.3 Example Documentation
**File:** `packages/docs/content/docs/examples/` (Multiple files)
- [ ] Update all examples to use new atomic operations
- [ ] Add new examples for atomic operations
- [ ] Add transaction and batch examples

### 6.4 Cursor Rules
**File:** `packages/snap/src/cursor-rules/dot-files/state-management.mdc`
- [ ] Update rules to reflect new atomic API
- [ ] Add best practices for atomic operations
- [ ] Add transaction and batch operation guidelines

## Phase 7: Example Code Updates

### 7.1 Playground Examples
**Directory:** `playground/steps/`
- [x] Update all state operations in existing steps
- [x] Replace complex update functions with atomic primitives
- [x] Add examples of transaction and batch operations
- [x] Update complex-state-triggers examples

**Files to update:**
- [x] `playground/steps/complex-state-triggers/score-updater.step.ts`
- [x] `playground/steps/complex-state-triggers/auto-tier-promoter.step.ts`
- [x] `playground/steps/complex-state-triggers/score-achievement-monitor.step.ts`
- [x] `playground/steps/complex-state-triggers/notification-cleaner.step.ts`
- [x] `playground/steps/state-trigger-example/update-score.step.ts`
- [x] `playground/steps/basic-tutorial/process-food-order.step.ts`
- [x] `playground/steps/basic-tutorial/state-audit-cron.step.ts`
- [x] All Python and Ruby step files (already using atomic operations)

### 7.2 Template Updates
**Directory:** `packages/snap/src/create/templates/`
- [x] Update all step templates to use new atomic operations
- [x] Add examples of atomic operations in templates
- [x] Update documentation in templates

**Files to update:**
- [x] `packages/snap/src/create/templates/nodejs/steps/state-audit-cron.step.ts.txt`
- [x] `packages/snap/src/create/templates/nodejs/steps/process-food-order.step.ts.txt`
- [x] `packages/snap/src/create/templates/python/steps/state_audit_cron_step.py.txt`
- [x] `packages/snap/src/create/templates/python/steps/process_food_order_step.py.txt`

## Phase 8: Workbench Integration

### 8.1 State Editor
**File:** `packages/workbench/src/components/states/state-editor.tsx`
- [x] Update to support new atomic operations
- [x] Add UI for transaction and batch operations
- [x] Add atomic operation buttons (increment, decrement, etc.)
- [x] Add transaction builder UI

### 8.2 State Management UI
**File:** `packages/workbench/src/App.tsx`
- [x] Update state management interface
- [x] Add atomic operation controls
- [x] Add transaction and batch operation UI

## Phase 9: Configuration Updates

### 9.1 Core Configuration
**File:** `packages/core/src/motia.ts`
- [x] Update state adapter creation to support optional Redis
- [x] Add configuration validation for new adapters
- [x] Add atomic operation configuration options
- [x] **IMPORTANT**: Default to Memory adapter if no Redis configuration provided

### 9.2 Server Configuration
**File:** `packages/core/src/server.ts`
- [x] Update to handle new state operations
- [x] Add optional Redis connection management (graceful fallback to Memory)
- [x] Add atomic operation endpoints

## Phase 10: Migration and Backward Compatibility

### 10.1 Deprecation Strategy
- [x] Mark `atomicUpdate` as deprecated
- [x] Add deprecation warnings
- [x] Provide migration guide
- [x] Plan removal in future version

### 10.2 Migration Tools
**File:** `packages/core/src/migration/state-migration.ts` (New)
- [x] Create migration utilities
- [x] Add code transformation tools
- [x] Add validation tools

## Phase 11: Performance Optimization

### 11.1 Locking Optimization
- [x] Optimize locking mechanism in memory adapter
- [x] Add lock-free operations where possible
- [x] Add performance monitoring

### 11.2 Redis Optimization (Optional)
- [x] Optimize Lua scripts (only if Redis is used)
- [x] Add connection pooling (only if Redis is used)
- [x] Add performance monitoring (only if Redis is used)

## Phase 12: Final Testing and Validation

### 12.1 End-to-End Tests
- [ ] Run all existing tests to ensure backward compatibility
- [ ] Add new tests for all atomic operations
- [ ] Performance testing with concurrent operations
- [ ] Memory leak testing

### 12.2 Integration Testing
- [ ] Test all language bindings (TypeScript, Python, Ruby)
- [ ] Test all adapters (Memory, File, optional Redis)
- [ ] Test transaction and batch operations
- [ ] Test error handling and recovery
- [ ] **IMPORTANT**: All tests must pass without Redis

## Implementation Order

1. **Phase 1-2**: Core interfaces and adapters (Memory, File)
2. **Phase 3**: RPC communication updates
3. **Phase 4**: State wrapper updates
4. **Phase 5**: Core testing
5. **Phase 6**: Documentation updates
6. **Phase 7**: Example code updates
7. **Phase 8**: Workbench integration
8. **Phase 9**: Configuration updates
9. **Phase 10**: Migration and backward compatibility
10. **Phase 11**: Performance optimization
11. **Phase 12**: Final testing and validation

## Success Criteria

- [ ] All existing tests pass
- [ ] All new atomic operations work correctly
- [ ] Transaction and batch operations work correctly
- [ ] All language bindings (TypeScript, Python, Ruby) work correctly
- [ ] All adapters (Memory, File, optional Redis) work correctly
- [ ] **CRITICAL**: All functionality works without Redis dependency
- [ ] Performance is maintained or improved
- [ ] Documentation is complete and accurate
- [ ] Examples are updated and working
- [ ] Backward compatibility is maintained
- [ ] Migration path is clear and documented

## Risk Mitigation

- **Backward Compatibility**: Maintain existing API while adding new features
- **No Redis Dependency**: All atomic operations work with Memory and File adapters
- **Performance**: Benchmark before and after changes
- **Testing**: Comprehensive test coverage for all new features
- **Documentation**: Clear migration guide and examples
- **Rollback Plan**: Ability to revert changes if issues arise

## Timeline Estimate

- **Phase 1-2**: 2-3 days (Core interfaces and adapters)
- **Phase 3**: 2-3 days (RPC communication)
- **Phase 4**: 1 day (State wrapper)
- **Phase 5**: 2-3 days (Testing)
- **Phase 6**: 1-2 days (Documentation)
- **Phase 7**: 2-3 days (Example updates)
- **Phase 8**: 1-2 days (Workbench)
- **Phase 9**: 1 day (Configuration)
- **Phase 10**: 1 day (Migration)
- **Phase 11**: 1-2 days (Performance)
- **Phase 12**: 2-3 days (Final testing)

**Total Estimated Time**: 16-25 days

## Notes

- All changes should maintain backward compatibility
- **Redis is completely optional** - all atomic operations work with Memory and File adapters
- New features should be opt-in initially
- Comprehensive testing is critical
- Documentation should be updated in parallel with code changes
- Performance should be monitored throughout implementation
- **Zero external dependencies** for core atomic functionality
