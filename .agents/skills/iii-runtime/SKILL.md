---
name: iii-runtime
description: Use when deciding whether iii should own a workflow, adopting iii into an existing backend, or building iii workers, functions, and triggers for http, cron, queue, stream, pub-sub, or state driven orchestration.
---

# iii Runtime

Use this skill for `iii` adoption calls and for concrete worker / function / trigger work.

`iii` is a centralized orchestration runtime centered on these core building blocks:
- `Function`
- `Trigger`
- `Worker`

## Use this skill when

- user asks whether `iii` fits an existing system
- user wants to add or debug a worker
- user needs to register functions or triggers
- user is choosing between `http`, `cron`, queue, `stream`, `pub-sub`, or state patterns
- user is integrating `iii` with an existing backend or agent system

## First read

- core framing: `references/core-model.md`
- adoption and rollout: `references/adoption-patterns.md`
- failure modes: `references/troubleshooting.md`

Then read only the nearest local docs:
- quickstart engine path: `docs/content/tutorials/quickstart.mdx` section `2. Run the Engine`
- first function: `docs/content/how-to/use-functions-and-triggers.mdx` section `Registering a Function and Triggering it`
- trigger registration: `docs/content/architecture/trigger-types.mdx` section `Registering Triggers`
- HTTP surface: `docs/content/how-to/expose-http-endpoint.mdx` section `3. Register the HTTP trigger`
- Node SDK example: `sdk/packages/node/iii/README.md` section `Hello World`
- Python SDK example: `sdk/packages/python/iii/README.md` section `Hello World`
- Rust SDK example: `sdk/packages/rust/iii/README.md` section `Hello World`

## Working rules

1. For existing systems, start sidecar-first.
2. Keep domain logic in workers, not engine internals.
3. Use stable domain-shaped ids like `orders::process` or `agent::research`.
4. Choose the simplest trigger that preserves retries, ordering, and visibility.
5. Keep latency-sensitive hot paths outside `iii` until measured evidence says otherwise.
6. If the problem is only model routing or provider abstraction, do not force `iii` into the design.

## Good first slices

- webhook ingestion
- cron jobs
- queue consumers
- async fanout
- notifications
- eval pipelines
- orchestration-heavy agent workflows

## Higher-risk slices

- websocket session authority
- low-latency voice or streaming loops
- tightly coupled request-response hot paths
- provider-specific realtime transports

## Anti-patterns

- using `iii` for plain model routing
- splitting one hot synchronous request across two runtimes first
- moving latency-critical voice paths on day one
- vague function ids with no domain meaning
- enabling many modules before one end-to-end slice works

## Output shape

Report:
- engine location: local or remote
- worker language and entry point
- function ids registered or planned
- trigger bindings
- verification: direct invoke or smoke test status

## Repo anchors

- engine runtime: `engine/`
- SDKs: `sdk/packages/node/iii`, `sdk/packages/python/iii`, `sdk/packages/rust/iii`
- docs: `docs/`
- website: `website/`
- console: `console/`

## Notes

- `.cursor/` has repo-specific authoring guidance; this skill is the portable entrypoint.
- Check licensing boundaries before making distribution claims about `engine/` versus SDKs, docs, website, or console.
