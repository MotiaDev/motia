import uuid
import asyncio
import json
import sys
import os
from typing import Any, Dict, Optional, Callable

def serialize_for_json(obj: Any) -> Any:
    """Convert Python objects to JSON-serializable types"""
    if hasattr(obj, '__dict__'):
        return obj.__dict__
    elif hasattr(obj, '_asdict'):
        return obj._asdict()
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_json(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    else:
        return obj

class IpcCommunication:
    """IPC communication using file descriptors"""
    
    def __init__(self):
        self.executing = True
        self.pending_requests: Dict[str, asyncio.Future] = {}
        self.ipc_reader_task: Optional[asyncio.Task] = None
        self.message_handlers: Dict[str, Callable] = {}
        self.ipc_fd: Optional[int] = None
        
        # Get IPC file descriptor
        if "NODE_CHANNEL_FD" in os.environ:
            try:
                self.ipc_fd = int(os.environ["NODE_CHANNEL_FD"])
            except (ValueError, TypeError):
                raise RuntimeError("Invalid NODE_CHANNEL_FD environment variable")
        else:
            raise RuntimeError("NODE_CHANNEL_FD environment variable not found")
        
    def send_no_wait(self, method: str, args: Any) -> None:
        """Send IPC request without waiting for response"""
        request = {
            'type': 'rpc_request',
            'method': method,
            'args': args
        }
        
        try:
            json_str = json.dumps(request, default=serialize_for_json)
            message_bytes = (json_str + "\n").encode('utf-8')
            os.write(self.ipc_fd, message_bytes)
        except Exception as e:
            print(f"ERROR: Failed to send IPC request: {e}", file=sys.stderr)

    async def send(self, method: str, args: Any) -> Any:
        """Send IPC request and wait for response"""
        request_id = str(uuid.uuid4())
        future = asyncio.Future()
        self.pending_requests[request_id] = future

        request = {
            'type': 'rpc_request',
            'id': request_id,
            'method': method,
            'args': args
        }
        
        try:
            json_str = json.dumps(request, default=serialize_for_json)
            message_bytes = (json_str + "\n").encode('utf-8')
            os.write(self.ipc_fd, message_bytes)
        except Exception as e:
            future.set_exception(e)
            return await future

        return await future

    def _handle_message(self, msg: Dict[str, Any]) -> None:
        """Handle incoming message from Node.js"""
        msg_type = msg.get('type')
        
        if msg_type == 'rpc_response':
            request_id = msg.get('id')
            if request_id in self.pending_requests:
                future = self.pending_requests[request_id]
                del self.pending_requests[request_id]
                
                error = msg.get('error')
                if error is not None:
                    future.set_exception(Exception(str(error)))
                else:
                    future.set_result(msg.get('result'))
        
        elif msg_type in self.message_handlers:
            try:
                self.message_handlers[msg_type](msg)
            except Exception as e:
                print(f"ERROR: Handler for {msg_type} failed: {e}", file=sys.stderr)

    async def _read_ipc(self) -> None:
        """Read messages from IPC file descriptor in background"""
        loop = asyncio.get_event_loop()
        buffer = ""
        
        while self.executing:
            try:
                data = await loop.run_in_executor(None, os.read, self.ipc_fd, 4096)
                if not data:
                    break
                
                buffer += data.decode('utf-8')
                lines = buffer.split('\n')
                buffer = lines[-1]  # Keep incomplete line in buffer
                
                for line in lines[:-1]:
                    if line.strip():
                        try:
                            msg = json.loads(line.strip())
                            self._handle_message(msg)
                        except json.JSONDecodeError as e:
                            print(f"WARNING: Failed to parse JSON: {e}", file=sys.stderr)
                        
            except OSError:
                # IPC channel closed
                break
            except Exception as e:
                print(f"ERROR: Reading IPC failed: {e}", file=sys.stderr)
                await asyncio.sleep(0.1)

    async def init(self) -> None:
        """Initialize IPC communication"""
        if not self.ipc_reader_task:
            self.ipc_reader_task = asyncio.create_task(self._read_ipc())

    def close(self) -> None:
        """Close IPC communication"""
        self.executing = False
        
        for future in self.pending_requests.values():
            if not future.done():
                future.set_exception(Exception("IPC connection closed"))
        self.pending_requests.clear()
        
        if self.ipc_reader_task and not self.ipc_reader_task.done():
            self.ipc_reader_task.cancel() 