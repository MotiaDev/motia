import sys
import json
import importlib.util
import os
import platform
from pathlib import Path
import inspect

def sendMessage(text):
    bytesMessage = (json.dumps(text) + "\n").encode('utf-8')

    if platform.system() == 'Windows':
        sys.stdout.buffer.write(bytesMessage)
        sys.stdout.buffer.flush()
    else:
        NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])
        os.write(NODEIPCFD, bytesMessage)

def get_can_access(config):
    if isinstance(config, dict):
        return config.get('canAccess')
    return getattr(config, 'canAccess', None)

async def run_python_module(file_path: str, payload: dict) -> None:
    try:
        path = Path(file_path).resolve()
        steps_dir = next((p for p in path.parents if p.name in ("src", "steps")), None)
        if steps_dir is None:
            raise RuntimeError("Could not find 'src' or 'steps' directory in path")

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
        spec.loader.exec_module(module)

        if not hasattr(module, 'config'):
            raise AttributeError(f"No 'config' found in module {file_path}")

        can_access = get_can_access(module.config)
        if not callable(can_access):
            raise AttributeError(f"No 'canAccess' function defined in {file_path}")

        response = can_access(payload.get('subscription'), payload.get('authContext'))

        if inspect.isawaitable(response):
            response = await response

        result = bool(response)
        sendMessage(bool(result))

    except Exception as error:
        print('Error evaluating canAccess:', str(error), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    file_path = sys.argv[1]
    payload = json.loads(sys.argv[2])

    import asyncio
    asyncio.run(run_python_module(file_path, payload))


