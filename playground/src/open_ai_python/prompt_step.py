from openai import OpenAI
import os

config = {
  "type": "event",
  "name": "CallOpenAiPython",
  "description": "Call OpenAI",
  "subscribes": ["openai-prompt-python"],
  "emits": [],
  "input": {
    "type": "object",
    "properties": {
      "message": {"type": "string","description": "The message to send to OpenAI"},
      "assistantMessageId": {"type": "string","description": "The assistant message ID"},
      "threadId": {"type": "string","description": "The thread ID"}
    },
    "required": ["message", "assistantMessageId", "threadId"]
  },
  "flows": ["open-ai"]
}

async def handler(input, context):
    logger = context.logger
    message = input["message"]
    assistant_message_id = input["assistantMessageId"]
    thread_id = input["threadId"]
    openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY_"))

    logger.info("Starting OpenAI response")

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": message}],
        stream=True
    )

    message_result = []

    for chunk in response:
        if chunk.choices[0].delta.content:
            message_result.append(chunk.choices[0].delta.content)
            context.streams.message_python.set(thread_id, assistant_message_id, {"message": "".join(message_result)})

    context.streams.message_python.set(thread_id, assistant_message_id, {"message": "".join(message_result)})

    logger.info("OpenAI response completed")
