---
name: iii-runtime
description: Use when working with iii as an orchestration runtime, especially when evaluating adoption in an existing backend, building functions or triggers or workers, choosing iii modules, integrating iii with queues or cron or http or stream workflows, or using iii for agent and tool-calling systems.
---

# iii Runtime

Use this skill when the task is about understanding, adopting, or implementing `iii`.

This repo positions `iii` as a centralized orchestration runtime for distributed polyglot function execution built around three primitives:
- `Function`
- `Trigger`
- `Worker`

## Start Here

Before making implementation decisions, read the smallest relevant local doc:

- first-time project flow: `docs/content/tutorials/quickstart.mdx`
- core model: `docs/content/primitives-and-concepts/functions-triggers-workers.mdx`
- register and invoke functions: `docs/content/how-to/use-functions-and-triggers.mdx`
- expose REST endpoints: `docs/content/how-to/expose-http-endpoint.mdx`
- trigger types: `docs/content/architecture/trigger-types.mdx`
- engine modules: `docs/content/modules/`

Do not read everything. Pick the nearest doc to the task.

## What iii Is Good At

`iii` is strongest when the system needs one runtime model across:
- HTTP endpoints
- queue consumers
- cron jobs
- state reactions
- streams
- pub-sub
- multi-language workers

It is especially useful when the current backend has glue-code sprawl between API servers, schedulers, queues, and workers.

## Default Adoption Bias

For existing systems, prefer `iii` as a sidecar first.

Good first slices:
- webhook ingestion
- async fanout
- cron jobs
- notifications
- evaluation pipelines
- orchestration-heavy agent workflows

Higher-risk first slices:
- low-latency voice or websocket hot paths
- tightly coupled streaming inference loops
- core request paths that already work and are latency-sensitive

## Build Pattern

Default to the smallest useful rollout:

1. start the engine
2. connect one worker
3. register one function
4. bind one trigger
5. invoke it directly
6. then expand

Do not start by modeling the whole platform.

## Working Model

Keep these rules in mind:

- keep product logic in workers, not engine internals
- use stable function ids with domain prefixes such as `orders::process` or `agent::research`
- make payloads explicit and versionable
- choose the simplest trigger that preserves delivery semantics
- keep hot paths outside `iii` until there is real latency evidence

## Trigger Choice

Use this mapping:

- HTTP request -> `http`
- scheduled task -> `cron`
- async buffered work -> queue
- live bidirectional event flow -> stream
- event distribution -> pub-sub
- state mutation reaction -> state

If several fit, choose the simplest option that keeps retries, ordering, and visibility correct.

## Existing-App Integration Pattern

For established apps, prefer:

```text
existing app
  -> emits event / calls iii HTTP endpoint / enqueues work
  -> iii orchestrates functions
  -> iii calls internal services or external APIs
```

This keeps ownership clear:
- the existing app keeps request handling and core domain semantics
- `iii` owns orchestration-heavy or async flows

Avoid splitting one synchronous hot request across both runtimes without a strong reason.

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

## Repo Navigation

Use the right area of the monorepo:

- engine runtime: `engine/`
- SDKs: `sdk/packages/node/iii`, `sdk/packages/python/iii`, `sdk/packages/rust/iii`
- docs site: `docs/`
- website / marketing pages: `website/`
- console: `console/`

When editing docs, follow the Divio split already used in `.cursor/rules/docs.mdc` and `.cursor/skills/`.

## License Reminder

This repo uses dual licensing:
- engine runtime: `Elastic License 2.0`
- SDKs, docs, website, console, frameworks: `Apache 2.0`

If a task touches distribution, hosted offerings, or managed-service positioning, check the license boundary before making claims.

## Common Mistakes

- treating `iii` as just another agent framework
- adopting it to solve a plain model-routing problem
- starting with too many modules at once
- hiding domain intent behind vague function ids
- moving latency-sensitive hot paths first
- skipping the local docs that already define the current SDK and trigger behavior
