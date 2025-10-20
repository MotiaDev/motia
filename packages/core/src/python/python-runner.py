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
from pathlib import Path

def parse_args(arg: str) -> Dict:
    """Parse command line arguments into HandlerArgs"""
    try:
        return json.loads(arg)
    except json.JSONDecodeError:
        print('Error parsing args:', arg)
        return arg

async def run_python_module(file_path: str, rpc: RpcSender, args: Dict) -> None:
    """Execute a Python module with the given arguments"""
    try:
        module_dir = os.path.dirname(os.path.abspath(file_path))
        flows_dir = os.path.dirname(module_dir)
        
        for path in [module_dir, flows_dir]:
            if path not in sys.path:
                sys.path.insert(0, path)

        spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")
            
        module = importlib.util.module_from_spec(spec)

        flows_dir = Path(file_path).parents[1]  # adjust if your root is deeper
        rel_parts = Path(file_path).relative_to(flows_dir).with_suffix("").parts
        module_name = flows_dir.name + "." + ".".join(rel_parts)
        module.__package__ = module_name.rsplit(".", 1)[0]

        spec.loader.exec_module(module)

        if not hasattr(module, "handler"):
            raise AttributeError(f"Function 'handler' not found in module {file_path}")

        config = module.config

        trace_id = args.get("traceId")
        flows = args.get("flows") or []
        data = args.get("data")
        context_in_first_arg = args.get("contextInFirstArg")
        streams_config = args.get("streams") or []

        streams = DotDict()
        for item in streams_config:
            name = item.get("name")
            streams[name] = RpcStreamManager(name, rpc)
        
        context = Context(trace_id, flows, rpc, streams)

        middlewares: List[Callable] = config.get("middleware", [])
        composed_middleware = compose_middleware(*middlewares)
        
        async def handler_fn():
            if context_in_first_arg:
                return await module.handler(context)
            else:
                return await module.handler(data, context)

        result = await composed_middleware(data, context, handler_fn)

        if result:
            await rpc.send('result', result)

        rpc.send_no_wait("close", None)
        rpc.close()
        
    except Exception as error:
        stack_list = traceback.format_exception(type(error), error, error.__traceback__)

        # We're removing the first two and last item
        # 0: Traceback (most recent call last):
        # 1: File "python-runner.py", line 82, in run_python_module
        # 2: File "python-runner.py", line 69, in run_python_module
        # -1: Exception: message
        stack_list = stack_list[3:-1]

        rpc.send_no_wait("close", {
            "message": str(error),
            "stack": "\n".join(stack_list)
        })
        rpc.close()

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
