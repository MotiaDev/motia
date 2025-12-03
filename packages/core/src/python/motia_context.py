from typing import Any, List, Optional
from motia_type_definitions import HandlerResult
from motia_rpc import RpcSender
from motia_rpc_state_manager import RpcStateManager
from motia_logger import Logger
from motia_dot_dict import DotDict

class Context:
    def __init__(
        self,
        trace_id: str,
        flows: List[str],
        rpc: RpcSender,
        streams: DotDict,
    ):
        self.trace_id = trace_id
        self.flows = flows
        self.rpc = rpc
        self.state = RpcStateManager(rpc)
        self.streams = streams
        self.logger = Logger(self.trace_id, self.flows, rpc)

    def emit(self, event: Any) -> Optional[HandlerResult]:
        return self.rpc.send_no_wait('emit', event)