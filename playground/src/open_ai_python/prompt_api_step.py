import uuid

config = {
  "type": "api",
  "name": "OpenAiApiPython", 
  "description": "Call OpenAI",
  "path": "/open-ai-python",
  "method": "POST",
  "emits": ["openai-prompt-python"],
  "flows": ["open-ai"],
  "bodySchema": {
    "type": "object",
    "properties": {
      "message": { "type": "string", "description": "The message to send to OpenAI" },
      "threadId": { "type": "string", "description": "The thread ID" }
    },
    "required": ["message"]
  },
  "responseSchema": {
    "200": {
      "type": "object",
      "properties": {
        "threadId": { "type": "string", "description": "The thread ID" }
      },
      "required": ["threadId"]
    }
  }
}

async def handler(req, context):
  body = req.get("body", {})
  context.logger.info("[Call OpenAI] Received callOpenAi event", {"message": body.get("message")})

  message = body.get("message")
  thread_id = body.get("threadId", str(uuid.uuid4()))
  assistant_message_id = str(uuid.uuid4())

  result = await context.streams.message_python.set(thread_id, assistant_message_id, {"message": ""})

  await context.emit({
    "topic": "openai-prompt-python",
    "data": {
      "message": message,
      "threadId": thread_id,
      "assistantMessageId": assistant_message_id
    }
  })

  return { "status": 200, "body": result }
