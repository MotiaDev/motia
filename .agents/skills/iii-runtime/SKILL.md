---
name: iii-runtime
description: Use when working with iii as an orchestration runtime, especially when evaluating adoption in an existing backend, building functions or triggers or workers, choosing iii modules, integrating iii with queues or cron or http or stream workflows, or using iii for agent and tool-calling systems.
---

# iii Runtime

Use this skill when the task is about understanding, adopting, or implementing `iii`.

`iii` is a centralized orchestration runtime for distributed polyglot function execution built around three primitives:
- `Function`
- `Trigger`
- `Worker`

## Use this skill when

- user asks whether to adopt `iii`
- user wants to build on `iii`
- user needs help with functions, triggers, or workers
- user is integrating `iii` with an existing backend
- user is deciding between `http`, `cron`, queue, stream, pub-sub, or state patterns
- user wants to use `iii` for agent or tool-calling workflows

## First read

- For core model and repo framing: `references/core-model.md`
- For adoption and integration guidance: `references/adoption-patterns.md`

Then read the nearest local docs in `docs/content/` rather than everything:
- quickstart: `docs/content/tutorials/quickstart.mdx`
- functions and triggers: `docs/content/how-to/use-functions-and-triggers.mdx`
- HTTP endpoint: `docs/content/how-to/expose-http-endpoint.mdx`
- trigger types: `docs/content/architecture/trigger-types.mdx`
- modules: `docs/content/modules/`

## Working rules

1. For existing systems, prefer `iii` as a sidecar first.
2. Keep product logic in workers, not engine internals.
3. Use stable domain-shaped function ids such as `orders::process` or `agent::research`.
4. Choose the simplest trigger that preserves retries, ordering, and visibility.
5. Keep latency-sensitive hot paths outside `iii` until there is real evidence it belongs there.
6. If the task is only model abstraction or provider routing, do not force `iii` into the solution.

## Good first-use cases

- webhook ingestion
- cron jobs
- queue consumers
- async fanout
- notifications
- eval pipelines
- orchestration-heavy agent workflows

## Higher-risk first-use cases

- websocket session authority
- low-latency voice or streaming inference loops
- tightly coupled request-response hot paths
- provider-specific realtime transports

## Repo anchors

- engine runtime: `engine/`
- SDKs: `sdk/packages/node/iii`, `sdk/packages/python/iii`, `sdk/packages/rust/iii`
- docs: `docs/`
- website: `website/`
- console: `console/`

## Notes

- This repo already has Cursor-specific guidance under `.cursor/`; this skill is the portable repo-local skill entrypoint.
- The repo uses dual licensing. Check `engine/` vs SDK/docs/website boundaries before making distribution claims.
