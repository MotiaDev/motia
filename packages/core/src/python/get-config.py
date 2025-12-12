import sys
import json
import importlib.util
import os
import platform
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

async def run_python_module(file_path: str) -> None:
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

        if 'middleware' in module.config:
            del module.config['middleware']
        
        if 'canAccess' in module.config:
            del module.config['canAccess']
            module.config['__motia_hasCanAccess'] = True

        sendMessage(module.config)

    except Exception as error:
        print('Error running Python module:', str(error), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    file_path = sys.argv[1]

    import asyncio
    asyncio.run(run_python_module(file_path))
