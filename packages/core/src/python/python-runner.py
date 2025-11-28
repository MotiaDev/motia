import asyncio
import copy
import importlib
import importlib.util
import json
import os
import sys
import traceback
import types
from contextlib import contextmanager
from pathlib import Path
from typing import Callable, List, Dict
from motia_rpc import RpcSender
from motia_context import Context
from motia_middleware import compose_middleware
from motia_rpc_stream_manager import RpcStreamManager
from motia_dot_dict import DotDict

def parse_args(arg: str) -> Dict:
    """Parse command line arguments into HandlerArgs"""
    try:
        return json.loads(arg)
    except json.JSONDecodeError:
        print('Error parsing args:', arg)
        return arg

def _deref_from_defs(ref: str, defs: dict | None):
    if not isinstance(ref, str) or not ref.startswith("#/"):
        return None

    parts = ref.lstrip("#/").split("/")
    if len(parts) < 2 or parts[0] != "$defs" or defs is None:
        return None

    key = parts[1]
    return copy.deepcopy(defs[key]) if key in defs else None

def _normalize_json_type(type_value):
    type_map = {"integer": "number"}
    if isinstance(type_value, str):
        return type_map.get(type_value, type_value)
    if isinstance(type_value, list):
        return [type_map.get(t, t) for t in type_value if isinstance(t, str)]
    return type_value

def _clean_schema(schema: object, inherited_defs: dict | None = None) -> dict:
    if not isinstance(schema, dict):
        return {}

    local_defs = schema.get("$defs")
    defs = {**(inherited_defs or {}), **local_defs} if isinstance(local_defs, dict) else inherited_defs

    cleaned = {}

    if "$ref" in schema:
        resolved = _deref_from_defs(schema["$ref"], defs)
        if resolved is not None:
            cleaned.update(_clean_schema(resolved, defs))

    for key, value in schema.items():
        if key in {"$ref", "$defs"}:
            continue

        if key == "type":
            value = _normalize_json_type(value)
        elif key == "items":
            value = _clean_schema(value, defs)
        elif key in {"anyOf", "oneOf", "allOf"} and isinstance(value, list):
            value = [_clean_schema(entry, defs) if isinstance(entry, dict) else entry for entry in value]
        elif key == "properties" and isinstance(value, dict):
            value = {prop: _clean_schema(prop_schema, defs) for prop, prop_schema in value.items()}
        elif isinstance(value, dict):
            value = _clean_schema(value, defs)

        cleaned[key] = value

    return cleaned

def _clean_payload_schema_fields(config: dict) -> dict:
    if not isinstance(config, dict):
        return config

    payload = dict(config)

    if isinstance(payload.get("bodySchema"), dict):
        payload["bodySchema"] = _clean_schema(payload["bodySchema"])

    if isinstance(payload.get("input"), dict):
        payload["input"] = _clean_schema(payload["input"])

    if isinstance(payload.get("responseSchema"), dict):
        payload["responseSchema"] = {
            status: _clean_schema(schema) if isinstance(schema, dict) else schema
            for status, schema in payload["responseSchema"].items()
        }

    return payload

@contextmanager
def soft_motia():
    missing: set[str] = set()
    try:
        real_motia = importlib.import_module("motia")
    except ImportError:
        real_motia = None

    def _sentinel(name: str):
        class _Missing:
            def __repr__(self): return f"<MISSING {name}>"
            def __getattr__(self, attr): return _sentinel(f"{name}.{attr}")
            def __call__(self, *args, **kwargs): return _sentinel(f"{name}()")
            def __iter__(self): return iter([])
            def __bool__(self): return False
        return _Missing()

    class MotiaProxy(types.ModuleType):
        __all__ = []
        def __getattr__(self, name: str):
            if real_motia and hasattr(real_motia, name):
                return getattr(real_motia, name)
            missing.add(name)
            return _sentinel(f"motia.{name}")

    original = sys.modules.get("motia")
    sys.modules["motia"] = MotiaProxy("motia")

    try:
        yield missing
    finally:
        if original is not None:
            sys.modules["motia"] = original
        else:
            sys.modules.pop("motia", None)

async def run_python_module(file_path: str, rpc: RpcSender, args: Dict) -> None:
    """Execute a Python module with the given arguments"""
    try:
        args = args or {}
        path = Path(file_path).resolve()
        steps_dir = next((p for p in path.parents if p.name == "steps"), None)
        if steps_dir is None:
            raise RuntimeError("Could not find 'steps' directory in path")

        project_root = steps_dir.parent
        project_parent = project_root.parent
        if str(project_parent) not in sys.path:
            sys.path.insert(0, str(project_parent))

        rel_parts = path.relative_to(project_parent).with_suffix("").parts
        module_name = ".".join(rel_parts)
        package_name = module_name.rsplit(".", 1)[0] if "." in module_name else ""

        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")

        module = importlib.util.module_from_spec(spec)
        module.__package__ = package_name
        sys.modules[module_name] = module
        missing_types: set[str] = set()
        with soft_motia() as missing:
            spec.loader.exec_module(module)
            missing_types = missing

        if not hasattr(module, "handler"):
            raise AttributeError(f"Function 'handler' not found in module {file_path}")

        config = module.config
        if isinstance(config, dict):
            config = _clean_payload_schema_fields(config)

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
        if missing_types:
            print(f"⚠ Missing motia types during module load: {sorted(missing_types)}", file=sys.stderr)
        
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
