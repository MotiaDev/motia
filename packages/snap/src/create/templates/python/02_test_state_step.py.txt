config = {
  "type": "event",
  "name": "SetStateChange",
  "description": "set a state change for evaluation",

  # This step subscribes to the event `test-state` to 
  # be processed asynchronously.
  "subscribes": ["test-state"],

  # It ultimately emits an event to `check-state-change` topic.
  "emits": ['check-state-change'],

  # Definition of the expected input
  "input": {
    "type": "object",
    "properties": { "message": { "type": "string" } }
  },

  # The flows this step belongs to, will be available in Workbench
  "flows": ['default'],
}

async def handler(input, context):
  # Avoid usage of console.log, use logger instead
  context.logger.info('Step 02 – Pushing message content to state', { "input": input })

  message = 'Welcome to motia!'

  # Persist content on state to be used by other steps
  # or in other workflows later
  await context.state.set(context.trace_id, 'test', message)

  # Emit events to the topics to process separately
  # on another step
  await context.emit({
    "topic": 'check-state-change',
    "data": { "key": 'test', "expected": message }
  })
