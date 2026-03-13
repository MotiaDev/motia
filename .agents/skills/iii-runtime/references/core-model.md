# iii Core Model

Use this note when the main need is to understand where `iii` fits conceptually.

## What iii Is Good At

`iii` is strongest when a system needs one runtime model across:
- HTTP endpoints
- queue consumers
- cron jobs
- state reactions
- streams
- pub-sub
- multi-language workers

It is especially useful when the current backend has glue-code sprawl between API servers, schedulers, queues, and workers.

## Build Pattern

Default to the smallest useful rollout:

1. start the engine
2. connect one worker
3. register one function
4. bind one trigger
5. invoke it directly
6. then expand

Do not start by modeling the whole platform.

## Minimal Worker Example

```ts
import { registerWorker } from 'iii-sdk'

const iii = registerWorker('ws://localhost:49134')

iii.registerFunction({ id: 'lesson.summarize' }, async (input) => {
  return { summary: `done:${input.lessonId}` }
})

iii.registerTrigger({
  type: 'http',
  function_id: 'lesson.summarize',
  config: { api_path: '/lesson/summarize', http_method: 'POST' },
})
```

Start with one worker, one function, one trigger, one smoke test.

Python follows the same shape:

```py
from iii import init

iii = init("ws://localhost:49134")
iii.register_function("lesson.summarize", summarize)
iii.register_trigger(
    type="http",
    function_id="lesson.summarize",
    config={"api_path": "/lesson/summarize", "http_method": "POST"},
)
```

Rust parity lives in `sdk/packages/rust/iii/README.md`.

## Trigger Choice

Use this mapping:

- HTTP request -> `http`
- scheduled task -> `cron`
- async buffered work -> queue
- live bidirectional event flow -> stream
- event distribution -> pub-sub
- state mutation reaction -> state

If several fit, choose the simplest option that keeps retries, ordering, and visibility correct.

## Agentic Systems

`iii` works well for agentic systems when the main need is orchestration, tool discovery, or durable multi-step execution.

Strong patterns:
- tool-calling agents using discovered functions
- multi-agent handoff across functions
- durable workflows with checkpoint state
- replayable or inspectable chains

Weak reason to adopt `iii`:
- only wanting more LLM providers

If the problem is model abstraction only, keep that concern separate from orchestration.
