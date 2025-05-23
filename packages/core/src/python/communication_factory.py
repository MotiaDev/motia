import os
import platform
from typing import Union
from rpc_communication import RpcCommunication
from ipc_communication import IpcCommunication

def create_communication() -> Union[RpcCommunication, IpcCommunication]:
    """
    Create appropriate communication instance based on platform and environment.
    
    Logic:
    - Python + Windows = RPC (stdin/stdout)
    - Other cases with NODE_CHANNEL_FD = IPC
    - Fallback = RPC
    """
    
    # Check if we're on Windows
    is_windows = platform.system() == 'Windows'
    
    # Check if IPC file descriptor is available
    has_ipc_fd = "NODE_CHANNEL_FD" in os.environ
    
    if is_windows:
        # On Windows, always use RPC
        return RpcCommunication()
    elif has_ipc_fd:
        # On Unix with IPC FD available, use IPC
        try:
            return IpcCommunication()
        except RuntimeError:
            # Fallback to RPC if IPC fails to initialize
            return RpcCommunication()
    else:
        # Fallback to RPC
        return RpcCommunication() 