import sys
import json
import importlib.util
import os
import platform
from dataclasses import asdict, is_dataclass
import copy
import types
from contextlib import contextmanager

def sendMessage(text):
    bytesMessage = (json.dumps(text) + "\n").encode('utf-8')
    if platform.system() == 'Windows':
        sys.stdout.buffer.write(bytesMessage)
        sys.stdout.buffer.flush()
    else:
        NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])
        os.write(NODEIPCFD, bytesMessage)

def _deref_from_defs(ref: str, defs: dict | None):
    print(f"[DEBUG] Dereferencing {ref}")  # debug
    if not isinstance(ref, str) or not ref.startswith("#/"):
        return None
    parts = ref.lstrip("#/").split("/")
    if not parts or parts[0] != "$defs" or defs is None:
        return None
    key = parts[1] if len(parts) > 1 else None
    print(f"[DEBUG] Looking for key '{key}' in defs")  # debug
    return copy.deepcopy(defs.get(key)) if key in defs else None

def _get_ts_type(s: str) -> str:
    print(f"[DEBUG] Mapping schema type {s}")  # debug
    if s == "string":
        return "string"
    elif s == "number":
        return "number"
    elif s == "boolean":
        return "boolean"
    elif s == "integer":
        return "number"
    elif s == "object":
        return "object"
    else:
        return s

def _clean_schema(schema: dict, inherited_defs: dict | None = None) -> dict:
    print("[DEBUG] Cleaning schema:", schema)  # debug
    if not isinstance(schema, dict):
        return {}

    local_defs = schema.get("$defs")
    if isinstance(local_defs, dict):
        defs = {**(inherited_defs or {}), **local_defs}
        print("[DEBUG] Merged defs:", defs)  # debug
    else:
        defs = inherited_defs

    if "$ref" in schema:
        print(f"[DEBUG] Found $ref: {schema['$ref']}")  # debug
        target = _deref_from_defs(schema["$ref"], defs)
        if target is not None:
            return _clean_schema(target, defs)

    out = {}
    if "title" in schema:
        out["title"] = schema["title"]
    if "type" in schema:
        out["type"] = _get_ts_type(schema["type"])
    if "required" in schema:
        out["required"] = schema["required"]
    if "items" in schema:
        out["items"] = _clean_schema(schema["items"], defs)

    if schema.get("type") == "object":
        print("[DEBUG] Processing object properties")  # debug
        props = schema.get("properties")
        cleaned_props = {}
        if isinstance(props, dict):
            for k, v in props.items():
                print(f"[DEBUG] Cleaning property {k}")  # debug
                cleaned_props[k] = _clean_schema(v, defs)
        out["properties"] = cleaned_props

    print("[DEBUG] Cleaned schema result:", out)  # debug
    return out

def clean_payload_body_schema(payload: dict) -> dict:
    print("[DEBUG] Cleaning payload body schema")  # debug
    if isinstance(payload, dict) and isinstance(payload.get("bodySchema"), dict):
        payload = copy.deepcopy(payload)
        payload["bodySchema"] = _clean_schema(payload["bodySchema"])
    return payload

def clean_payload_input_schema(payload: dict) -> dict:
    print("[DEBUG] Cleaning payload input schema")  # debug
    if isinstance(payload, dict) and isinstance(payload.get("input"), dict):
        payload = copy.deepcopy(payload)
        payload["input"] = _clean_schema(payload["input"])
    return payload

def clean_payload_response_schema(payload: dict) -> dict:
    print("[DEBUG] Cleaning payload response schema")  # debug
    print("\n=== Payload Configuration into clean function ===")
    print(json.dumps(payload, indent=2, sort_keys=True))
    print("===========================\n")

    if isinstance(payload, dict) and isinstance(payload.get("responseSchema"), dict):
        payload = copy.deepcopy(payload)
        cleaned_responses = {}
        for status, schema in payload["responseSchema"].items():
            print(f"[DEBUG] Cleaning response schema for status {status}")  # debug
            if isinstance(schema, dict):
                cleaned_responses[status] = _clean_schema(schema)
        payload["responseSchema"] = cleaned_responses
    return payload

@contextmanager
def soft_motia():
    print("[DEBUG] Entered soft_motia context")  # debug
    missing = set()
    try:
        import importlib
        real_motia = importlib.import_module("motia")
        print("[soft_motia] Loaded real motia package:", real_motia, file=sys.stderr)
    except ImportError:
        real_motia = None
        print("[soft_motia] No real motia package found, everything will be stubbed", file=sys.stderr)

    def _sentinel(name: str):
        class _Missing:
            def __repr__(self): return f"<MISSING {name}>"
            def __getattr__(self, _): 
                print(f"[soft_motia] getattr on missing {name}", file=sys.stderr)
                return _sentinel(f"{name}.attr")
            def __call__(self, *a, **k):
                print(f"[soft_motia] call on missing {name}", file=sys.stderr)
                return _sentinel(f"{name}()")
            def __iter__(self): return iter([])
            def __bool__(self): return False
        return _Missing()

    class MotiaProxy(types.ModuleType):
        __all__ = []
        def __getattr__(self, name: str):
            if real_motia and hasattr(real_motia, name):
                caller = sys._getframe(1).f_code.co_name
                module = sys._getframe(1).f_globals.get("__name__", "?")
                print(f"[soft_motia] getattr {name} (called by {caller} in {module})", file=sys.stderr)
                print(f"[soft_motia] Delegating motia.{name} → real motia", file=sys.stderr)
                return getattr(real_motia, name)
            else:
                print(f"[soft_motia] Stubbed motia.{name}", file=sys.stderr)
                missing.add(name)
                return _sentinel(f"motia.{name}")

    original = sys.modules.get("motia")
    sys.modules["motia"] = MotiaProxy("motia")

    try:
        yield missing
    finally:
        if original is not None:
            sys.modules["motia"] = original
            print("[soft_motia] Restored original motia", file=sys.stderr)
        else:
            sys.modules.pop("motia", None)
            print("[soft_motia] Removed motia proxy", file=sys.stderr)

async def run_python_module(file_path: str) -> None:
    print("[DEBUG] Starting run_python_module()")  # debug
    try:
        module_dir = os.path.dirname(os.path.abspath(file_path))
        print(f"[DEBUG] Module dir: {module_dir}")  # debug
        if module_dir not in sys.path:
            sys.path.insert(0, module_dir)

        flows_dir = os.path.dirname(module_dir)
        print(f"[DEBUG] Flows dir: {flows_dir}")  # debug
        if flows_dir not in sys.path:
            sys.path.insert(0, flows_dir)

        spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")
        module = importlib.util.module_from_spec(spec)
        module.__package__ = os.path.basename(module_dir)

        print("[DEBUG] Executing module...")  # debug
        with soft_motia() as missing:
            spec.loader.exec_module(module)
            print("[DEBUG] Module executed")  # debug
            if 'middleware' in module.config:
                print("[DEBUG] Removing 'middleware' from config")  # debug
                del module.config['middleware']
            payload = module.config
            payload = clean_payload_body_schema(payload)
            payload = clean_payload_input_schema(payload)
            payload = clean_payload_response_schema(payload)

        if missing:
            print(f"⚠ Missing motia types during config load: {sorted(missing)}", file=sys.stderr)

        if not hasattr(module, 'config'):
            raise AttributeError(f"No 'config' found in module {file_path}")

        print("\n=== Payload Configuration ===")
        print(json.dumps(payload, indent=2, sort_keys=True))
        print("===========================\n")

        print("[DEBUG] Sending message back to Node")  # debug
        sendMessage(payload)

    except Exception as error:
        print('[DEBUG] Error running Python module:', repr(error), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    print("[DEBUG] Script started")  # debug
    if len(sys.argv) < 2:
        print("[DEBUG] No file path provided, exiting")  # debug
        sys.exit(1)

    file_path = sys.argv[1]
    print(f"[DEBUG] File path argument: {file_path}")  # debug

    import asyncio
    asyncio.run(run_python_module(file_path))
