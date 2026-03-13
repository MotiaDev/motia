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
