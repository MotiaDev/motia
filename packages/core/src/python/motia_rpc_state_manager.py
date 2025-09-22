import asyncio
import functools
import sys
from typing import Any
from motia_rpc import RpcSender

class RpcStateManager:
    def __init__(self, rpc: RpcSender):
        self.rpc = rpc
        self._loop = asyncio.get_event_loop()

    async def get(self, trace_id: str, key: str) -> asyncio.Future[Any]:
        result = await self.rpc.send('state.get', {'traceId': trace_id, 'key': key})
        
        if result is None:
            return {'data': None}
        elif isinstance(result, dict):
            if 'data' not in result:
                return {'data': result}
        
        return result
    
    async def get_group(self, group_id: str) -> asyncio.Future[Any]:
        result = await self.rpc.send('state.getGroup', {'groupId': group_id})
        
        if result is None:
            return {'data': None}
        elif isinstance(result, dict):
            if 'data' not in result:
                return {'data': result}
        
        return result
    
    async def getGroup(self, trace_id: str, key: str) -> asyncio.Future[Any]:
        return await self.get_group(trace_id, key)

    async def set(self, trace_id: str, key: str, value: Any) -> asyncio.Future[None]:
        future = await self.rpc.send('state.set', {'traceId': trace_id, 'key': key, 'value': value})
        return future

    async def delete(self, trace_id: str, key: str) -> asyncio.Future[None]:
        return await self.rpc.send('state.delete', {'traceId': trace_id, 'key': key})

    async def clear(self, trace_id: str) -> asyncio.Future[None]:
        return await self.rpc.send('state.clear', {'traceId': trace_id})

    async def update(self, trace_id: str, key: str, update_fn) -> asyncio.Future[Any]:
        # SECURITY NOTE: state.update over RPC is disabled for security reasons
        # Python function stringification doesn't work with JavaScript Function reconstruction
        # Use atomic operations instead: increment, decrement, compare_and_swap, etc.
        raise NotImplementedError(
            "state.update over RPC is not supported in Python for security reasons. "
            "Use atomic operations instead: increment, decrement, compare_and_swap, "
            "push, pop, set_field, delete_field, or transactions."
        )

    # === NEW ATOMIC PRIMITIVES ===

    async def increment(self, trace_id: str, key: str, delta: int = 1) -> asyncio.Future[int]:
        return await self.rpc.send('state.increment', {'traceId': trace_id, 'key': key, 'delta': delta})

    async def decrement(self, trace_id: str, key: str, delta: int = 1) -> asyncio.Future[int]:
        return await self.rpc.send('state.decrement', {'traceId': trace_id, 'key': key, 'delta': delta})

    async def compare_and_swap(self, trace_id: str, key: str, expected: Any, new_value: Any) -> asyncio.Future[bool]:
        return await self.rpc.send('state.compareAndSwap', {
            'traceId': trace_id,
            'key': key,
            'expected': expected,
            'newValue': new_value
        })

    # === ATOMIC ARRAY OPERATIONS ===

    async def push(self, trace_id: str, key: str, *items) -> asyncio.Future[list]:
        return await self.rpc.send('state.push', {'traceId': trace_id, 'key': key, 'items': list(items)})

    async def pop(self, trace_id: str, key: str) -> asyncio.Future[Any]:
        return await self.rpc.send('state.pop', {'traceId': trace_id, 'key': key})

    async def shift(self, trace_id: str, key: str) -> asyncio.Future[Any]:
        return await self.rpc.send('state.shift', {'traceId': trace_id, 'key': key})

    async def unshift(self, trace_id: str, key: str, *items) -> asyncio.Future[list]:
        return await self.rpc.send('state.unshift', {'traceId': trace_id, 'key': key, 'items': list(items)})

    # === ATOMIC OBJECT OPERATIONS ===

    async def set_field(self, trace_id: str, key: str, field: str, value: Any) -> asyncio.Future[dict]:
        return await self.rpc.send('state.setField', {
            'traceId': trace_id,
            'key': key,
            'field': field,
            'value': value
        })

    async def delete_field(self, trace_id: str, key: str, field: str) -> asyncio.Future[dict]:
        return await self.rpc.send('state.deleteField', {'traceId': trace_id, 'key': key, 'field': field})

    # === TRANSACTION SUPPORT ===

    async def transaction(self, trace_id: str, operations: list) -> asyncio.Future[dict]:
        return await self.rpc.send('state.transaction', {'traceId': trace_id, 'operations': operations})

    # === BATCH OPERATIONS ===

    async def batch(self, trace_id: str, operations: list) -> asyncio.Future[dict]:
        return await self.rpc.send('state.batch', {'traceId': trace_id, 'operations': operations})

    # === UTILITY OPERATIONS ===

    async def exists(self, trace_id: str, key: str) -> asyncio.Future[bool]:
        return await self.rpc.send('state.exists', {'traceId': trace_id, 'key': key})

    # Add wrappers to handle non-awaited coroutines
    def __getattribute__(self, name):
        attr = super().__getattribute__(name)
        if name in ('get', 'set', 'delete', 'clear') and asyncio.iscoroutinefunction(attr):
            @functools.wraps(attr)
            def wrapper(*args, **kwargs):
                coro = attr(*args, **kwargs)
                # Check if this is being awaited
                frame = sys._getframe(1)
                if frame.f_code.co_name != '__await__':
                    # Not being awaited, schedule in background
                    # But we need to make sure this task completes before the handler returns
                    # So we'll return the task for the caller to await if needed
                    task = asyncio.create_task(coro)
                    # Add error handling for the background task
                    def handle_exception(t):
                        if t.done() and not t.cancelled() and t.exception():
                            print(f"Unhandled exception in background task: {t.exception()}", file=sys.stderr)
                    task.add_done_callback(handle_exception)
                    return task
                # Being awaited, return coroutine as normal
                return coro
            return wrapper
        return attr
