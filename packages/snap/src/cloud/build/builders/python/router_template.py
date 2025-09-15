from typing import Dict, Callable, Any, Literal
# from steps.api_step import handler as route0_handler, config as route0_config
# {{imports}}

class RouterPath:
    def __init__(self, step_name: str, method: Literal['get', 'post', 'put', 'delete', 'patch', 'options', 'head'], handler: Callable, config: Dict[str, Any]):
        self.step_name = step_name
        self.method = method
        self.handler = handler
        self.config = config

router_paths: Dict[str, RouterPath] = {
    # 'POST /api/parallel-merge/python': RouterPath('Parallel Merge Python', 'post', route0_handler, route0_config)
    # {{router paths}}
}
