import asyncio
import functools
import sys
from typing import Any, Dict
from motia_rpc import RpcSender

class RpcStreamManager:
    def __init__(self, stream_name: str,rpc: RpcSender):
        self.rpc = rpc
        self.stream_name = stream_name
        self._loop = asyncio.get_event_loop()

    async def get(self, group_id: str, id: str) -> asyncio.Future[Any]:
        result = await self.rpc.send(f'streams.{self.stream_name}.get', {'groupId': group_id, 'id': id})
        return result

    async def set(self, group_id: str, id: str, data: Any) -> asyncio.Future[None]:
        future = await self.rpc.send(f'streams.{self.stream_name}.set', {'groupId': group_id, 'id': id, 'data': data})
        return future

    async def delete(self, group_id: str, id: str) -> asyncio.Future[None]:
        return await self.rpc.send(f'streams.{self.stream_name}.delete', {'groupId': group_id, 'id': id})

    async def getGroup(self, group_id: str) -> asyncio.Future[None]:
        return await self.rpc.send(f'streams.{self.stream_name}.getGroup', {'groupId': group_id})

    async def get_group(self, group_id: str) -> asyncio.Future[None]:
        return await self.getGroup(group_id)
    
    async def send(self, channel: Dict, event: Dict) -> asyncio.Future[None]:
        return await self.rpc.send(f'streams.{self.stream_name}.send', {'channel': channel, 'event': event})

    # Add wrappers to handle non-awaited coroutines
    def __getattribute__(self, name):
        attr = super().__getattribute__(name)
        if name in ('get', 'set', 'delete', 'getGroup') and asyncio.iscoroutinefunction(attr):
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
