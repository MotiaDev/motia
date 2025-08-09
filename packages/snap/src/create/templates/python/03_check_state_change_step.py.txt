config = {
  "type": "event",
  "name": "CheckStateChange",
  "description": "check state change",

  # This step subscribes to the event `check-state-change` to 
  # be processed asynchronously.
  "subscribes": ["check-state-change"],

  # Doesn"t emit anything, which means this is a final step in a workflow
  "emits": [],

  # Definition of the expected input
  "input": {
    "type": "object",
    "properties": {
      "key": { "type": "string" },
      "expected": { "type": "string" }
    }
  },
  
  # The flows this step belongs to, will be available in Workbench
  "flows": ["default"],
}

async def handler(input, context):
  # Avoid usage of console.log, use logger instead
  context.logger.info("Step 03 – Executing CheckStateChange step", { "input": input })

  # Fetches value from state with the given key
  value = await context.state.get(context.trace_id, input.get("key"))

  if value != input.get("expected"):
    context.logger.error("The provided value for the state key does not match", { 
      "key": input.get("key"),
      "value": value,
      "expected": input.get("expected")
    })
  else:
    context.logger.info("The provided value matches the state value 🏁", {
      "key": input.get("key"),
      "value": value,
    })
