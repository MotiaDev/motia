# import sys
# import json
# import importlib.util
# import os
# import platform
# from dataclasses import asdict, is_dataclass
# import copy
# import types
# from contextlib import contextmanager

# def sendMessage(text):
#     'sends a Node IPC message to parent proccess'
#     # encode message as json string + newline in bytes
#     bytesMessage = (json.dumps(text) + "\n").encode('utf-8')
    
#     # Handle Windows differently
#     if platform.system() == 'Windows':
#         # On Windows, write to stdout
#         sys.stdout.buffer.write(bytesMessage)
#         sys.stdout.buffer.flush()
#     else:
#         # On Unix systems, use the file descriptor approach
#         NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])
#         os.write(NODEIPCFD, bytesMessage)

# # def dataclass_to_clean_dict(obj, exclude=None):
# #     exclude = set(exclude or [])
# #     def clean(value):
# #         if is_dataclass(value):
# #             return clean(asdict(value))
# #         elif isinstance(value, dict):
# #             new_dict = {}
# #             for k, v in value.items():
# #                 if v is not None and k not in exclude:
# #                     new_dict[k] = clean(v)
# #             return new_dict
# #         elif isinstance(value, list):
# #             new_list = []
# #             for v in value:
# #                 if v is not None:
# #                     new_list.append(clean(v))
# #             return new_list
# #         else:
# #             return value

# #     return clean(asdict(obj))

# def _deref_from_defs(ref: str, defs: dict | None):
#     """Resolve '#/$defs/Key' against merged defs; return deep copy or None."""
#     if not isinstance(ref, str) or not ref.startswith("#/"):
#         return None
#     parts = ref.lstrip("#/").split("/")
#     if not parts or parts[0] != "$defs" or defs is None:
#         return None
#     key = parts[1] if len(parts) > 1 else None
#     return copy.deepcopy(defs.get(key)) if key in defs else None

# def _get_ts_type(s: str) -> str:
#     if s == "string":
#         return "string"
#     elif s == "number":
#         return "number"
#     elif s == "boolean":
#         return "boolean"
#     elif s == "integer":
#         return "number"
#     elif s == "object":
#         return "object"
#     else:
#         return s

# def _clean_schema(schema: dict, inherited_defs: dict | None = None) -> dict:
#     """
#     Return schema restricted to {title, type, properties} (recursively).
#     - Resolves $ref into nearest $defs (supports '#/$defs/Name').
#     - Merges local $defs with inherited for nested scopes.
#     """
#     if not isinstance(schema, dict):
#         return {}

#     # Merge inherited and local $defs (nearest $defs shadow outer ones)
#     local_defs = schema.get("$defs")
#     if isinstance(local_defs, dict):
#         defs = {**(inherited_defs or {}), **local_defs}
#     else:
#         defs = inherited_defs

#     # If a $ref exists, deref it first
#     if "$ref" in schema:
#         target = _deref_from_defs(schema["$ref"], defs)
#         if target is not None:
#             return _clean_schema(target, defs)

#     out = {}
#     if "title" in schema:
#         out["title"] = schema["title"]
#     if "type" in schema:
#         out["type"] = _get_ts_type(schema["type"])

#     if "required" in schema:
#         out["required"] = schema["required"]
#     if "items" in schema:
#         # out["items"] = schema["items"]
#         out["items"] = _clean_schema(schema["items"], defs)

#     # Recurse into object properties only
#     if schema.get("type") == "object":
#         props = schema.get("properties")
#         cleaned_props = {}
#         if isinstance(props, dict):
#             for k, v in props.items():
#                 cleaned_props[k] = _clean_schema(v, defs)
#         out["properties"] = cleaned_props

#     return out

# def clean_payload_body_schema(payload: dict) -> dict:
#     """
#     Assumes exactly one bodySchema at the top level: payload['bodySchema'].
#     Cleans it in place and returns the payload.
#     """
#     if isinstance(payload, dict) and isinstance(payload.get("bodySchema"), dict):
#         payload = copy.deepcopy(payload)
#         payload["bodySchema"] = _clean_schema(payload["bodySchema"])
#     return payload

# def clean_payload_input_schema(payload: dict) -> dict:
#     """
#     If payload has an 'input' schema, clean it in place and return the payload.
#     """
#     if isinstance(payload, dict) and isinstance(payload.get("input"), dict):
#         payload = copy.deepcopy(payload)
#         payload["input"] = _clean_schema(payload["input"])
#     return payload

# def clean_payload_response_schema(payload: dict) -> dict:
#     """
#     If payload has a 'responseSchema' (e.g. keyed by status codes),
#     clean each schema inside and return the payload.
#     """
#     print("\n=== Payload Configuration into clean function ===")
#     print(json.dumps(payload, indent=2, sort_keys=True))
#     print("===========================\n")
#     if isinstance(payload, dict) and isinstance(payload.get("responseSchema"), dict):
#         payload = copy.deepcopy(payload)
#         cleaned_responses = {}
#         for status, schema in payload["responseSchema"].items():
#             if isinstance(schema, dict):
#                 cleaned_responses[status] = _clean_schema(schema)
#         payload["responseSchema"] = cleaned_responses
#     return payload

# # @contextmanager
# # def soft_motia():
# #     """
# #     Temporarily installs a dummy 'motia' module into sys.modules so that
# #     imports from motia.* (like generated types) don't crash if _internal
# #     hasn't been generated yet.

# #     It stubs any missing attribute with a harmless placeholder.
# #     """
# #     missing = set()
# #     real = sys.modules.get("motia")

# #     def _sentinel(name: str):
# #         class _Missing:
# #             def __repr__(self): return f"<MISSING {name}>"
# #             def __getattr__(self, _): return _sentinel(f"{name}.attr")
# #             def __call__(self, *a, **k): return _sentinel(f"{name}()")
# #             def __iter__(self): return iter([])
# #             def __bool__(self): return False
# #         return _Missing()

# #     class MotiaProxy(types.ModuleType):
# #         __all__ = []
# #         def __getattr__(self, name):
# #             missing.add(name)
# #             return _sentinel(f"motia.{name}")

# #     sys.modules["motia"] = MotiaProxy("motia")

# #     try:
# #         yield missing
# #     finally:
# #         if real is not None:
# #             sys.modules["motia"] = real
# #         else:
# #             sys.modules.pop("motia", None)

# @contextmanager
# def soft_motia():
#     """
#     Context manager to make `motia` imports safe when generated files
#     (`_internal.py`, `__init__.py` re-exports) may not exist yet.

#     - Delegates to the real motia package for things that exist (like core/).
#     - Provides harmless stubs for missing attributes (generated types).
#     - Logs what is delegated and what is stubbed.
#     """
#     missing = set()

#     # Try to import the real motia package (the folder you created)
#     try:
#         import importlib
#         real_motia = importlib.import_module("motia")
#         print("[soft_motia] Loaded real motia package:", real_motia, file=sys.stderr)
#     except ImportError:
#         real_motia = None
#         print("[soft_motia] No real motia package found, everything will be stubbed", file=sys.stderr)

#     def _sentinel(name: str):
#         class _Missing:
#             def __repr__(self): return f"<MISSING {name}>"
#             def __getattr__(self, _): 
#                 print(f"[soft_motia] getattr on missing {name}", file=sys.stderr)
#                 return _sentinel(f"{name}.attr")
#             def __call__(self, *a, **k):
#                 print(f"[soft_motia] call on missing {name}", file=sys.stderr)
#                 return _sentinel(f"{name}()")
#             def __iter__(self): return iter([])
#             def __bool__(self): return False
#         return _Missing()

#     class MotiaProxy(types.ModuleType):
#         __all__ = []
#         def __getattr__(self, name: str):
#             if real_motia and hasattr(real_motia, name):
#                 print(f"[soft_motia] Delegating motia.{name} → real motia", file=sys.stderr)
#                 return getattr(real_motia, name)
#             else:
#                 print(f"[soft_motia] Stubbed motia.{name}", file=sys.stderr)
#                 missing.add(name)
#                 return _sentinel(f"motia.{name}")

#     # Save the original motia if present
#     original = sys.modules.get("motia")

#     # Install proxy
#     sys.modules["motia"] = MotiaProxy("motia")

#     try:
#         yield missing
#     finally:
#         # Restore
#         if original is not None:
#             sys.modules["motia"] = original
#             print("[soft_motia] Restored original motia", file=sys.stderr)
#         else:
#             sys.modules.pop("motia", None)
#             print("[soft_motia] Removed motia proxy", file=sys.stderr)

# class MotiaWrapper(types.ModuleType):
#     def __getattr__(self, name):
#         real_motia = sys.modules.get("_real_motia")
#         if real_motia and hasattr(real_motia, name):
#             return getattr(real_motia, name)
#         return object  # safe placeholder

# async def run_python_module(file_path: str) -> None:
#     try:

#         module_dir = os.path.dirname(os.path.abspath(file_path))
        
#         if module_dir not in sys.path:
#             sys.path.insert(0, module_dir)
            
#         flows_dir = os.path.dirname(module_dir)
#         if flows_dir not in sys.path:
#             sys.path.insert(0, flows_dir)

#         spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
#         if spec is None or spec.loader is None:
#             raise ImportError(f"Could not load module from {file_path}")
            
#         module = importlib.util.module_from_spec(spec)
#         module.__package__ = os.path.basename(module_dir)
#         with soft_motia() as missing:
#             spec.loader.exec_module(module)
#             if 'middleware' in module.config:
#                 del module.config['middleware']
#             payload = module.config
#             payload = clean_payload_body_schema(payload)
#             payload = clean_payload_input_schema(payload)
#             payload = clean_payload_response_schema(payload)
        
#         if missing:
#             print(f"⚠ Missing motia types during config load: {sorted(missing)}", file=sys.stderr)


#         if not hasattr(module, 'config'):
#             raise AttributeError(f"No 'config' found in module {file_path}")
        
#         print("\n=== Payload Configuration ===")
#         print(json.dumps(payload, indent=2, sort_keys=True))
#         print("===========================\n")
#         sendMessage(payload)

#     except Exception as error:
#         print('Error running Python module:', repr(error), file=sys.stderr)
#         sys.exit(1)

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         sys.exit(1)

#     file_path = sys.argv[1]

#     import asyncio
#     asyncio.run(run_python_module(file_path))

import sys
import json
import importlib.util
import os
import platform
from dataclasses import asdict, is_dataclass
import copy
import types
from contextlib import contextmanager

# =====================================================
# Function: sendMessage
# =====================================================
def sendMessage(text):
    print("[DEBUG] Entered sendMessage()")  # debug
    bytesMessage = (json.dumps(text) + "\n").encode('utf-8')
    print("[DEBUG] Encoded message:", bytesMessage)  # debug
    
    if platform.system() == 'Windows':
        print("[DEBUG] Platform = Windows, writing to stdout")  # debug
        sys.stdout.buffer.write(bytesMessage)
        sys.stdout.buffer.flush()
    else:
        print("[DEBUG] Platform != Windows, writing to NODE_CHANNEL_FD")  # debug
        NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])
        os.write(NODEIPCFD, bytesMessage)

# =====================================================
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

# =====================================================
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

# =====================================================
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

# =====================================================
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

# =====================================================
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

# =====================================================
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

# =====================================================
if __name__ == "__main__":
    print("[DEBUG] Script started")  # debug
    if len(sys.argv) < 2:
        print("[DEBUG] No file path provided, exiting")  # debug
        sys.exit(1)

    file_path = sys.argv[1]
    print(f"[DEBUG] File path argument: {file_path}")  # debug

    import asyncio
    asyncio.run(run_python_module(file_path))
