from __future__ import annotations

from typing import Any

from iii import (
    IStream,
    StreamDeleteInput,
    StreamGetInput,
    StreamListGroupsInput,
    StreamListInput,
    StreamSetInput,
    StreamSetResult,
    StreamUpdateInput,
)

from .iii import get_iii
from .models import Todo


class StreamClient:
    async def get(self, stream_name: str, group_id: str, item_id: str) -> Any | None:
        iii = get_iii()
        return await iii.call(
            "stream::get", {"stream_name": stream_name, "group_id": group_id, "item_id": item_id}
        )

    async def set(self, stream_name: str, group_id: str, item_id: str, data: Any) -> Any:
        iii = get_iii()
        return await iii.call(
            "stream::set", {"stream_name": stream_name, "group_id": group_id, "item_id": item_id, "data": data}
        )

    async def delete(self, stream_name: str, group_id: str, item_id: str) -> None:
        iii = get_iii()
        return await iii.call(
            "stream::delete", {"stream_name": stream_name, "group_id": group_id, "item_id": item_id}
        )

    async def get_group(self, stream_name: str, group_id: str) -> list[Any]:
        iii = get_iii()
        return await iii.call(
            "stream::list", {"stream_name": stream_name, "group_id": group_id}
        )

    async def list_groups(self, stream_name: str) -> list[str]:
        iii = get_iii()
        return await iii.call("stream::list_groups", {"stream_name": stream_name})


class TodoStream(IStream[dict[str, Any]]):
    def __init__(self) -> None:
        self._todos: list[Todo] = []

    async def get(self, input: StreamGetInput) -> dict[str, Any] | None:
        for todo in self._todos:
            if todo.id == input.item_id:
                return todo.model_dump()
        return None

    async def set(self, input: StreamSetInput) -> StreamSetResult[dict[str, Any]] | None:
        for i, todo in enumerate(self._todos):
            if todo.id == input.item_id:
                updated = Todo(**{**todo.model_dump(), **input.data})
                self._todos[i] = updated
                return StreamSetResult(old_value=todo.model_dump(), new_value=updated.model_dump())

        new_todo = Todo(
            id=input.item_id,
            group_id=input.group_id,
            description=input.data.get("description", ""),
            due_date=input.data.get("dueDate"),
            completed_at=None,
        )
        self._todos.append(new_todo)
        return StreamSetResult(old_value=None, new_value=new_todo.model_dump())

    async def delete(self, input: StreamDeleteInput) -> None:
        self._todos = [t for t in self._todos if t.id != input.item_id]

    async def list(self, input: StreamListInput) -> list[dict[str, Any]]:
        return [t.model_dump() for t in self._todos if t.group_id == input.group_id]

    async def list_groups(self, input: StreamListGroupsInput) -> list[str]:
        return list({t.group_id for t in self._todos})

    async def update(self, input: StreamUpdateInput) -> StreamSetResult[dict[str, Any]] | None:
        return None


streams = StreamClient()
_streams_registered = False


def register_streams() -> None:
    global _streams_registered
    if _streams_registered:
        return
    get_iii().create_stream("todo", TodoStream())
    _streams_registered = True
