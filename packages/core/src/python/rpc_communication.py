import uuid
import asyncio
import json
import sys
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

class RpcCommunication:
    """RPC communication using stdin/stdout"""
    
    def __init__(self):
        self.executing = True
        self.pending_requests: Dict[str, asyncio.Future] = {}
        self.stdin_reader_task: Optional[asyncio.Task] = None
        self.message_handlers: Dict[str, Callable] = {}
        
    def send_no_wait(self, method: str, args: Any) -> None:
        """Send RPC request without waiting for response"""
        request = {
            'type': 'rpc_request',
            'method': method,
            'args': args
        }
        
        try:
            json_str = json.dumps(request, default=serialize_for_json)
            print(json_str, flush=True)
        except Exception as e:
            print(f"ERROR: Failed to send RPC request: {e}", file=sys.stderr)

    async def send(self, method: str, args: Any) -> Any:
        """Send RPC request and wait for response"""
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
            print(json_str, flush=True)
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

    async def _read_stdin(self) -> None:
        """Read messages from stdin in background"""
        loop = asyncio.get_event_loop()
        
        while self.executing:
            try:
                line = await loop.run_in_executor(None, sys.stdin.readline)
                
                if not line:
                    break
                    
                line = line.strip()
                if line:
                    try:
                        msg = json.loads(line)
                        self._handle_message(msg)
                    except json.JSONDecodeError as e:
                        print(f"WARNING: Failed to parse JSON: {e}", file=sys.stderr)
                        
            except Exception as e:
                print(f"ERROR: Reading stdin failed: {e}", file=sys.stderr)
                await asyncio.sleep(0.1)

    async def init(self) -> None:
        """Initialize RPC communication"""
        if not self.stdin_reader_task:
            self.stdin_reader_task = asyncio.create_task(self._read_stdin())

    def close(self) -> None:
        """Close RPC communication"""
        self.executing = False
        
        for future in self.pending_requests.values():
            if not future.done():
                future.set_exception(Exception("RPC connection closed"))
        self.pending_requests.clear()
        
        if self.stdin_reader_task and not self.stdin_reader_task.done():
            self.stdin_reader_task.cancel() 