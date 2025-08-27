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
