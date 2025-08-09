config = {
  "type": "api",
  "name": "ApiTrigger",
  "description": "test state",

  "path": "/default",
  "method": "POST",

  # This API Step emits events to topic `test-state`
  "emits": ["test-state"],

  # Expected request body for type checking and documentation
  "bodySchema": {
    "type": "object",
    "properties": { "name": { "type": "string" } }
  },

  # Expected response body for type checking and documentation
  "responseSchema": {
    "200": {
      "type": "object",
      "properties": {
        "traceId": { "type": "string" },
        "message": { "type": "string" }
      }
    }
  },

  # The virtual subscribes this step has, will be available in Workbench
  "virtualSubscribes": ["/default"],

  # The flows this step belongs to, will be available in Workbench
  "flows": ["default"],
}

async def handler(req, context):
  # Avoid usage of console.log, use logger instead
  context.logger.info('Step 01 – Processing API Step', { "body": req.get("body") })

  # Emit events to the topics to process asynchronously
  await context.emit({
    "topic": 'test-state',
    "data": { "message": req.get("body").get("message") },
  })

  # Return data back to the client
  return {
    "status": 200,
    "body": {
      "traceId": context.trace_id,
      "message": 'test-state topic emitted'
    },
  }
