config = {
    "type": "api",
    "name": "large-data-step",
    "emits": [],
    "path": "/large-data",
    "method": "POST",
}


async def handler(body, _context):
    if isinstance(body, str):
        return {
            "status": 200,
            "body": {
                "return data": "random",
            },
        }

    if isinstance(body, (bytes, bytearray)):
        return len(body)

    if body is not None and hasattr(body, "__len__"):
        try:
            return len(body)
        except (TypeError, NotImplementedError):
            pass

    return 0
