import uuid
import asyncio
import json
import sys
import os
import platform
from typing import Any, Dict, Optional, Callable, Union
from communication_factory import create_communication
from rpc_communication import RpcCommunication
from ipc_communication import IpcCommunication

def serialize_for_json(obj: Any) -> Any:
    """Convert Python objects to JSON-serializable types"""
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    elif hasattr(obj, '_asdict'):  # For namedtuples
        return obj._asdict()
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    else:
        return obj

class RpcSender:
    """Unified communication interface that delegates to appropriate implementation"""
    
    def __init__(self):
        self._communication: Union[RpcCommunication, IpcCommunication] = create_communication()
        
    def send_no_wait(self, method: str, args: Any) -> None:
        """Send request without waiting for response"""
        return self._communication.send_no_wait(method, args)

    async def send(self, method: str, args: Any) -> Any:
        """Send request and wait for response"""
        return await self._communication.send(method, args)

    async def init(self) -> None:
        """Initialize communication"""
        return await self._communication.init()

    def close(self) -> None:
        """Close communication"""
        return self._communication.close()
