# This is an example of a Python step.
from pydantic import BaseModel, StrictStr

class Input(BaseModel):
    extra: StrictStr

config = {
    "type": "event",
    "name": "HelloFromPython",
    "subscribes": ["hello"],
    "input": Input,
    "emits": ["hello.response.python"],

    # Some optional fields. Full list here: https://www.motia.dev/docs/api-reference#eventconfig
    "description": "Says hello in the logs",
    "flows": ["hello"],
    "virtualEmits": [],
    "virtualSubscribes": [],
}

async def handler(input: Input, ctx):
    ctx.logger.info("Hello from Python!")