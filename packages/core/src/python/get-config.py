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
        file_path_obj = Path(file_path).resolve()
        module_dir = file_path_obj.parent

        module_dir_str = str(module_dir)
        if module_dir_str not in sys.path:
            sys.path.insert(0, module_dir_str)

        # Walk up the directory tree to find the outermost package that still has an __init__.py.
        package_root = None
        current = module_dir
        while True:
            if (current / "__init__.py").is_file():
                package_root = current

            parent = current.parent
            if parent == current:
                break

            current = parent

        package_root = package_root or module_dir
        package_root_parent = package_root.parent
        package_root_parent_str = str(package_root_parent)
        if package_root_parent_str not in sys.path:
            sys.path.insert(0, package_root_parent_str)

        spec = importlib.util.spec_from_file_location("dynamic_module", file_path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load module from {file_path}")
            
        module = importlib.util.module_from_spec(spec)
        rel_parts = file_path_obj.with_suffix("").relative_to(package_root_parent).parts
        module_name = ".".join(rel_parts)
        if len(rel_parts) <= 1:
            module.__package__ = ""
        elif len(rel_parts) == 2:
            module.__package__ = module_name
        else:
            module.__package__ = ".".join(rel_parts[:-1])
        spec.loader.exec_module(module)

        if not hasattr(module, 'config'):
            raise AttributeError(f"No 'config' found in module {file_path}")

        if 'middleware' in module.config:
            del module.config['middleware']

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