# iii Adoption Patterns

Use this note when the task is about introducing `iii` into an existing system.

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

## Existing-App Integration Pattern

Prefer:

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

Entry-point bias:
- prefer `http` first for manual smoke tests or webhook-style ingestion
- prefer queue first for buffered async work
- prefer `cron` first for scheduled jobs

## Recommended Rollout

1. keep the current app as system of record
2. expose one `iii` entrypoint through `http`, queue, or cron
3. connect one worker in the closest supported language
4. register one domain-named function
5. smoke test direct invoke first, then the real trigger path
6. expand only after visibility and retries are understood

## Output Checklist

For architecture or implementation answers, include:
- engine location
- worker language and entry point
- function ids
- trigger bindings
- smoke test result or missing verification step

## Common Mistakes

- treating `iii` as just another agent framework
- adopting it to solve a plain model-routing problem
- starting with too many modules at once
- hiding domain intent behind vague function ids
- moving latency-sensitive hot paths first
- skipping the local docs that already define the current SDK and trigger behavior
