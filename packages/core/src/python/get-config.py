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
    
    if not isinstance(ref, str):
        return None
    
    if not ref.startswith("#/"):
        return None

    parts = ref.lstrip("#/").split("/")

    if not parts:
        return None
    
    if parts[0] != "$defs":
        return None
    
    if defs is None:
        return None

    if len(parts) > 1:
        key = parts[1]
    else:
        key = None

    if key is not None and key in defs:
        return copy.deepcopy(defs[key])
    else:
        return None

# TODO : review
def _get_ts_type(s: str) -> str:
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
    if not isinstance(schema, dict):
        return {}

    local_defs = schema.get("$defs")
    if isinstance(local_defs, dict):
        defs = {**(inherited_defs or {}), **local_defs}
    else:
        defs = inherited_defs

    out = {}

    # 🔹 If $ref found, deref and merge
    if "$ref" in schema:
        target = _deref_from_defs(schema["$ref"], defs)
        if target is not None:
            # Merge dereferenced schema first
            out.update(_clean_schema(target, defs))

    # 🔹 Copy basic fields
    if "title" in schema:
        out["title"] = schema["title"]

    if "type" in schema:
        out["type"] = _get_ts_type(schema["type"])

    if "enum" in schema:
        out["enum"] = schema["enum"]

    if "required" in schema:
        out["required"] = schema["required"]

    if "items" in schema:
        out["items"] = _clean_schema(schema["items"], defs)

    # 🔹 Handle anyOf/oneOf/allOf recursively
    for keyword in ("anyOf", "oneOf", "allOf"):
        if keyword in schema and isinstance(schema[keyword], list):
            out[keyword] = [_clean_schema(s, defs) for s in schema[keyword]]

    if schema.get("type") == "object":
        props = schema.get("properties")
        cleaned_props = {}
        if isinstance(props, dict):
            for k, v in props.items():
                cleaned_props[k] = _clean_schema(v, defs)
        out["properties"] = cleaned_props

    return out

def clean_payload_body_schema(payload: dict) -> dict:
    if isinstance(payload, dict) and isinstance(payload.get("bodySchema"), dict):
        payload = copy.deepcopy(payload)
        payload["bodySchema"] = _clean_schema(payload["bodySchema"])
    return payload

def clean_payload_input_schema(payload: dict) -> dict:
    if isinstance(payload, dict) and isinstance(payload.get("input"), dict):
        payload = copy.deepcopy(payload)
        payload["input"] = _clean_schema(payload["input"])
    return payload

def clean_payload_response_schema(payload: dict) -> dict:

    if isinstance(payload, dict) and isinstance(payload.get("responseSchema"), dict):
        payload = copy.deepcopy(payload)
        cleaned_responses = {}
        for status, schema in payload["responseSchema"].items():
            if isinstance(schema, dict):
                cleaned_responses[status] = _clean_schema(schema)
        payload["responseSchema"] = cleaned_responses
    return payload

@contextmanager
def soft_motia():
    missing = set()
    try:
        import importlib
        real_motia = importlib.import_module("motia")

    except ImportError:
        real_motia = None

    def _sentinel(name: str):
        class _Missing:
            def __repr__(self): return f"<MISSING {name}>"
            def __getattr__(self, _): 
                return _sentinel(f"{name}.attr")
            def __call__(self, *a, **k):
                return _sentinel(f"{name}()")
            def __iter__(self): return iter([])
            def __bool__(self): return False
        return _Missing()

    class MotiaProxy(types.ModuleType):
        __all__ = []
        def __getattr__(self, name: str):
            if real_motia and hasattr(real_motia, name):
                return getattr(real_motia, name)
            else:
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

async def run_python_module(file_path: str) -> None:
    try:
        module_dir = os.path.dirname(os.path.abspath(file_path))
        if module_dir not in sys.path:
            sys.path.insert(0, module_dir)

        flows_dir = os.path.dirname(module_dir)
        if flows_dir not in sys.path:
            sys.path.insert(0, flows_dir)

        spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")
        module = importlib.util.module_from_spec(spec)
        module.__package__ = os.path.basename(module_dir)

        with soft_motia() as missing:
            spec.loader.exec_module(module)
            if 'middleware' in module.config:
                del module.config['middleware']
            payload = module.config
            print("[DEBUG] ", module.config)
            payload = clean_payload_body_schema(payload)
            payload = clean_payload_input_schema(payload)
            payload = clean_payload_response_schema(payload)
            print("DEBUG", payload)
        if missing:
            print(f"⚠ Missing motia types during config load: {sorted(missing)}", file=sys.stderr)

        if not hasattr(module, 'config'):
            raise AttributeError(f"No 'config' found in module {file_path}")

        sendMessage(payload)

    except Exception as error:
        print('[DEBUG] Error running Python module:', repr(error), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    file_path = sys.argv[1]

    import asyncio
    asyncio.run(run_python_module(file_path))
