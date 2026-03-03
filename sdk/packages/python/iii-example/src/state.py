from typing import Any

from .iii import iii


class State:
    async def get(self, scope: str, key: str) -> Any | None:
        return await iii.call("state::get", {"scope": scope, "key": key})

    async def set(self, scope: str, key: str, value: Any) -> Any:
        return await iii.call("state::set", {"scope": scope, "key": key, "value": value})

    async def delete(self, scope: str, key: str) -> None:
        return await iii.call("state::delete", {"scope": scope, "key": key})

    async def get_group(self, scope: str) -> list[Any]:
        return await iii.call("state::list", {"scope": scope})


state = State()
