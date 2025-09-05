import sys
import json
import importlib.util
import os
import asyncio
import traceback
from typing import Callable, List, Dict
from motia_rpc import RpcSender
from motia_context import Context
from motia_middleware import compose_middleware
from motia_rpc_stream_manager import RpcStreamManager
from motia_dot_dict import DotDict
from dataclasses import asdict, is_dataclass
print("DEBUG: runner starting from", __file__, file=sys.stderr)

def parse_args(arg: str) -> Dict:
    """Parse command line arguments into HandlerArgs"""
    try:
        return json.loads(arg)
    except json.JSONDecodeError:
        print('Error parsing args:', arg)
        return arg

# def dataclass_to_clean_dict(obj, exclude=None):
#     exclude = set(exclude or [])

#     def clean(value):
#         if is_dataclass(value):
#             return clean(asdict(value))
#         elif isinstance(value, dict):
#             return {
#                 k: clean(v)
#                 for k, v in value.items()
#                 if v is not None and k not in exclude
#             }
#         elif isinstance(value, list):
#             return [clean(v) for v in value if v is not None]
#         else:
#             return value

#     return clean(asdict(obj))

async def run_python_module(file_path: str, rpc: RpcSender, args: Dict) -> None:
    """Execute a Python module with the given arguments"""
    try:
        print("[DEBUG] Entered run_python_module", file=sys.stderr)
        print("[DEBUG] sys.path (initial):", sys.path, file=sys.stderr)

        # Setup sys.path
        module_dir = os.path.dirname(os.path.abspath(file_path))
        print(f"[DEBUG] module_dir resolved: {module_dir}", file=sys.stderr)

        flows_dir = os.path.dirname(module_dir)
        print(f"[DEBUG] flows_dir resolved: {flows_dir}", file=sys.stderr)

        for path in [module_dir, flows_dir]:
            if path not in sys.path:
                print(f"[DEBUG] Inserting {path} into sys.path", file=sys.stderr)
                sys.path.insert(0, path)
        print("[DEBUG] sys.path (after insertion):", sys.path, file=sys.stderr)

        # Import module
        print(f"[DEBUG] Attempting to load module from {file_path}", file=sys.stderr)
        spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
        if spec is None:
            print("[ERROR] spec is None", file=sys.stderr)
        if spec and spec.loader is None:
            print("[ERROR] spec.loader is None", file=sys.stderr)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")

        print("[DEBUG] Creating module object from spec", file=sys.stderr)
        module = importlib.util.module_from_spec(spec)
        module.__package__ = os.path.basename(module_dir)
        print(f"[DEBUG] Executing module {file_path}", file=sys.stderr)
        spec.loader.exec_module(module)
        print("[DEBUG] Module executed successfully", file=sys.stderr)

        if not hasattr(module, "handler"):
            print("[ERROR] No 'handler' function found in module", file=sys.stderr)
            raise AttributeError(f"Function 'handler' not found in module {file_path}")

        print("[DEBUG] Accessing module.config", file=sys.stderr)
        config = getattr(module, "config", None)
        if config is None:
            print("[ERROR] No 'config' attribute in module", file=sys.stderr)
            raise AttributeError(f"'config' not found in module {file_path}")

        # Extract args
        trace_id = args.get("traceId")
        flows = args.get("flows") or []
        data = args.get("data")
        context_in_first_arg = args.get("contextInFirstArg")
        streams_config = args.get("streams") or []
        print(f"[DEBUG] Args extracted: trace_id={trace_id}, flows={flows}, context_in_first_arg={context_in_first_arg}", file=sys.stderr)

        # Setup streams
        streams = DotDict()
        print(f"[DEBUG] Initializing streams from config: {streams_config}", file=sys.stderr)
        for item in streams_config:
            name = item.get("name")
            print(f"[DEBUG] Creating RpcStreamManager for stream: {name}", file=sys.stderr)
            streams[name] = RpcStreamManager(name, rpc)

        # Create context
        print("[DEBUG] Creating Context object", file=sys.stderr)
        context = Context(trace_id, flows, rpc, streams)

        # Middleware
        middlewares: List[Callable] = config.get("middleware", [])
        print(f"[DEBUG] Middlewares loaded: {middlewares}", file=sys.stderr)
        composed_middleware = compose_middleware(*middlewares)
        print("[DEBUG] Middleware composed successfully", file=sys.stderr)

        async def handler_fn():
            print("[DEBUG] Entered handler_fn", file=sys.stderr)
            if context_in_first_arg:
                print("[DEBUG] Calling handler with context only", file=sys.stderr)
                return await module.handler(context)
            else:
                print("[DEBUG] Calling handler with data + context", file=sys.stderr)
                return await module.handler(data, context)

        result = None
        try:
            print("[DEBUG] Executing composed middleware", file=sys.stderr)
            result = await composed_middleware(data, context, handler_fn)
            print(f"[DEBUG] Middleware execution result: {result}", file=sys.stderr)
        except Exception as e:
            print("[ERROR] Exception during middleware execution:", str(e), file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

        if result:
            print("[DEBUG] Sending result via RPC:", result, file=sys.stderr)
            await rpc.send('result', result)
        else:
            print("[DEBUG] No result to send", file=sys.stderr)

        print("[DEBUG] Sending close signal to RPC", file=sys.stderr)
        rpc.send_no_wait("close", None)
        rpc.close()
        print("[DEBUG] Finished run_python_module successfully", file=sys.stderr)

    except Exception as error:
        print("[FATAL ERROR] Exception in run_python_module:", str(error), file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        stack_list = traceback.format_exception(type(error), error, error.__traceback__)

        # Trimming stack
        stack_list = stack_list[3:-1]

        rpc.send_no_wait("close", {
            "message": str(error),
            "stack": "\n".join(stack_list)
        })
        rpc.close()
        print("[DEBUG] RPC closed after fatal error", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pythonRunner.py <file-path> <arg>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    arg = sys.argv[2] if len(sys.argv) > 2 else None

    rpc = RpcSender()
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    args = parse_args(arg) if arg else None
    tasks = asyncio.gather(rpc.init(), run_python_module(file_path, rpc, args))
    loop.run_until_complete(tasks)
