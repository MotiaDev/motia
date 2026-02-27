"""Accepts multipart/form-data and streams back random items as SSE."""

import asyncio
import json
import math
import random
import time
from typing import Any
from urllib.parse import unquote

from motia import ApiStreamRequest, FlowContext, http

config = {
    "name": "SSE Example",
    "description": "Accepts form-data and streams back random items as SSE",
    "flows": ["sse-example"],
    "triggers": [
        http("POST", "/sse"),
    ],
    "enqueues": [],
}


async def handler(args: ApiStreamRequest[Any], ctx: FlowContext[Any]) -> None:
    """Read form body, then stream random items back as SSE."""
    request = args.request
    response = args.response

    ctx.logger.info("FormData received", {"headers": request.headers})

    await response.status(200)
    await response.headers({
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        "connection": "keep-alive",
    })

    raw_chunks: list[str] = []
    async for chunk in request.request_body.stream:
        if isinstance(chunk, bytes):
            raw_chunks.append(chunk.decode("latin-1"))
        else:
            raw_chunks.append(str(chunk))

    parts: dict[str, str] = {}
    for s in raw_chunks:
        s = s.strip()
        if not s:
            continue
        for pair in s.split("&"):
            if "=" in pair:
                key, value = pair.split("=", 1)
                parts[unquote(key)] = unquote(value)
            elif pair:
                parts[unquote(pair)] = ""

    items = _generate_random_items(parts)

    for item in items:
        response.writer.stream.write(f"event: item\ndata: {json.dumps(item)}\n\n".encode("utf-8"))
        await asyncio.sleep(0.3 + random.random() * 0.7)

    response.writer.stream.write(f"event: done\ndata: {json.dumps({'total': len(items)})}\n\n".encode("utf-8"))
    response.close()


def _generate_random_items(parts: dict[str, str]) -> list[dict[str, Any]]:
    fields = [{"name": k, "value": v} for k, v in parts.items()]
    count = 5 + math.floor(random.random() * 6)

    adjectives = ["swift", "lazy", "bold", "calm", "fierce", "gentle", "sharp", "wild"]
    nouns = ["falcon", "river", "mountain", "crystal", "thunder", "shadow", "ember", "frost"]

    return [
        {
            "id": f"item-{int(time.time() * 1000)}-{i}",
            "label": f"{random.choice(adjectives)} {random.choice(nouns)}",
            "score": round(random.random() * 100),
            "source": fields[i % len(fields)] if fields else None,
        }
        for i in range(count)
    ]
