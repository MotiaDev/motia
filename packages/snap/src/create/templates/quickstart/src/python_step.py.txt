# This is an example of a Python step.
from pydantic import BaseModel

class Input(BaseModel):
    extra: str

config = {
    "type": "event",
    "name": "HelloFromPython",
    "subscribes": ["hello"],
    "input": Input.model_json_schema(),
    "emits": ["hello.response.python"],

    # Some optional fields. Full list here: https://www.motia.dev/docs/api-reference#eventconfig
    "flows": ["hello"],
    "description": "Say hello from Python!",
    "virtualEmits": [],
    "virtualSubscribes": [],
}

async def handler(input: Input, ctx):
    ctx.logger.info("Hello from Python!")
    await ctx.emit({"topic": "hello.response.python", "data": {"extra": "py"}})