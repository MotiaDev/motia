import sys
import json
import importlib.util
import os
import platform

# get the FD from ENV
NODEIPCFD = int(os.environ["NODE_CHANNEL_FD"])

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