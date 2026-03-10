from typing import Any, Awaitable, Callable

from iii import III, ApiRequest, ApiResponse, FunctionInfo, Logger


def use_api(
    iii: III,
    config: dict[str, Any],
    handler: Callable[[ApiRequest[Any], Logger], Awaitable[ApiResponse[Any]]],
) -> None:
    api_path = config["api_path"]
    http_method = config["http_method"]
    function_id = f"api.{http_method.lower()}.{api_path}"
    logger = Logger(function_name=function_id)

    async def wrapped(data: Any) -> dict[str, Any]:
        req = ApiRequest(**data) if isinstance(data, dict) else data
        result = await handler(req, logger)
        return result.model_dump(by_alias=True)

    iii.register_function(function_id, wrapped)
    iii.register_trigger(
        type="http",
        function_id=function_id,
        config={
            "api_path": api_path,
            "http_method": http_method,
            "description": config.get("description"),
            "metadata": config.get("metadata"),
        },
    )


def use_functions_available(iii: III, callback: Callable[[list[FunctionInfo]], None]) -> Callable[[], None]:
    return iii.on_functions_available(callback)
