import copy
import importlib
import importlib.util
import json
import os
import platform
import sys
import types
from contextlib import contextmanager
from pathlib import Path

def sendMessage(text):
    'sends a Node IPC message to parent proccess'
    # encode message as json string + newline in bytes
    bytesMessage = (json.dumps(text) + "\n").encode('utf-8')
    
    # Handle Windows differently
    if platform.system() == 'Windows':
        # On Windows, write to stdout
        sys.stdout.buffer.write(bytesMessage)
        sys.stdout.buffer.flush()
    else:
        # On Unix systems, use the file descriptor approach
        NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])
        os.write(NODEIPCFD, bytesMessage)

def _deref_from_defs(ref: str, defs: dict | None):
    if not isinstance(ref, str) or not ref.startswith("#/"):
        return None

    parts = ref.lstrip("#/").split("/")
    if len(parts) < 2 or parts[0] != "$defs" or defs is None:
        return None

    key = parts[1]
    if key in defs:
        return copy.deepcopy(defs[key])
    return None

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

    payload = copy.deepcopy(config)

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

async def run_python_module(file_path: str) -> None:
    try:
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

        if not hasattr(module, 'config'):
            raise AttributeError(f"No 'config' found in module {file_path}")

        payload = copy.deepcopy(module.config) if isinstance(module.config, dict) else module.config

        if isinstance(payload, dict) and 'middleware' in payload:
            del payload['middleware']
        
        if isinstance(payload, dict) and 'canAccess' in payload:
            del payload['canAccess']
            payload['__motia_hasCanAccess'] = True

        if isinstance(payload, dict):
            payload = _clean_payload_schema_fields(payload)

        sendMessage(payload)
        if missing_types:
            print(f"⚠ Missing motia types during config load: {sorted(missing_types)}", file=sys.stderr)

    except Exception as error:
        print('Error running Python module:', str(error), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    file_path = sys.argv[1]

    import asyncio
    asyncio.run(run_python_module(file_path))
