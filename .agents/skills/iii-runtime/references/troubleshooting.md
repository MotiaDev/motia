# iii Troubleshooting

Use this note when the task is about failed setup, missing registrations, or unclear rollout risk.

## Verification Checklist

For a first slice, done means:

1. engine is reachable
2. one worker is connected
3. target function id is registered
4. trigger binding exists if the flow needs one
5. direct invoke or trigger smoke test succeeds

Report the first missing item instead of saying the setup is done.

## Common Failure Modes

### Worker connected, function missing

- check the worker entry point actually runs registration code
- confirm registration happens before the process exits
- check for reconnect assumptions in the selected SDK

### Trigger exists, but wrong behavior

- re-check trigger type against delivery semantics
- prefer `http` for request-response
- prefer queue for buffered async work
- prefer `cron` for scheduled work
- prefer `stream` only when bidirectional live flow matters

### SDK mismatch

- Node uses `registerWorker(...)` and connects automatically
- Python may use `init(...)` auto-connect in async code or `III(...)` plus `connect()`
- Rust examples use `init(...)`; lower-level constructor forms may still need `connect().await`

### Engine will not start locally

- if you see address-in-use errors, check configured ports before changing code
- bridge WebSocket defaults to `49134`
- HTTP module defaults to `3111`
- stream module defaults to `3112`
- if you are also running the console, it defaults to `3113`

### Risky first rollout

Move back to a sidecar slice if the first proposal touches:
- low-latency voice
- websocket authority
- one hot request path that must stay synchronous

### Distribution confusion

Check license and repo boundaries before claiming what is open or redistributable.
