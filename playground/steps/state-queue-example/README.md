# State-Managed Sequential Queue Example

This example demonstrates how to build a workflow that processes items sequentially (one at a time) using Motia's built-in state management features to handle locking and queuing.

## How it Works

This workflow uses Motia's state management to ensure items submitted via an API are processed sequentially, one at a time.

1.  **Trigger**: A client sends a POST request (e.g., containing `itemId` and `payload`) to the `/state-queue/process-item` API endpoint handled by `trigger.api.step.ts`. Motia assigns a unique `traceId` to this incoming request.
2.  **Emit Request**: The `trigger` step immediately emits a `queue.request` event containing the original request body and the unique `originalTraceId` associated with the initial API call. It then responds `202 Accepted` to the client.
3.  **Manager**: The `manager.event.step.ts` listens for `queue.request`. It uses Motia's `state` API (scoped to `state-queue-lock`) to check a boolean flag `is_running`.
    *   If `is_running` is **false** (or not set), the lock is free. The manager sets `is_running` to `true`, stores the `originalTraceId` from the event into the `current_traceId` state key (marking this request as the active one), and emits a `queue.process` event containing the request body and the `originalTraceId`.
    *   If `is_running` is **true**, the lock is busy. The manager retrieves the current `request_queue` (an array) from the state, adds an object `{ body: requestBody, traceId: originalTraceId }` to it, and saves the updated queue back to the state.
4.  **Worker**: The `worker.event.step.ts` listens for `queue.process`. It receives the `body` and the `traceId` (which is the *original* trace ID of the request it needs to process). It simulates doing some work (e.g., processing the item based on `body.itemId`) for a few seconds.
5.  **Event Emission**: After finishing its work (or encountering an error), the worker emits a `queue.finished` event. Crucially, it includes the `traceId` it was given (the *original* trace ID) in the event data as `finishedTraceId`, along with any processing results.
6.  **Dequeue Logic**: The `dequeue.event.step.ts` listens for the `queue.finished` event. It retrieves the `current_traceId` from the state (the ID of the request that *should* be running).
    *   It **verifies** that the `finishedTraceId` from the worker's event matches the `current_traceId` stored in the state. If they don't match, it means a stale or unexpected event arrived, and it's simply ignored.
    *   If the IDs match, it retrieves the `request_queue` from the state.
    *   If the queue **has items**, it dequeues the next item (`nextRequest`). It updates the `current_traceId` state key to hold the `traceId` of this *next* item. It saves the modified (shorter) queue back to the state. Finally, it emits a `queue.process` event for the dequeued item, passing its body and original `traceId`.
    *   If the queue is **empty**, it means no more items are waiting. It releases the lock by setting `is_running` state back to `false` and deleting the `current_traceId` state key.

This cycle ensures that only one worker processes an item at any given time, using the `is_running` flag and `current_traceId` state as a lock, while the `request_queue` state holds pending items. The use of the *original* trace ID throughout ensures correct correlation and locking. By using events instead of HTTP calls, the system is more efficient and resilient, as it doesn't rely on network calls that could fail.

## Usage with `curl`

You can trigger the processing of an item by sending a POST request to the `/state-queue/process-item` API endpoint defined in `trigger.api.step.ts`.

```bash
# Example: Trigger processing for item-123
curl -X POST http://localhost:3000/state-queue/process-item \
  -H "Content-Type: application/json" \
  -d '{"itemId": "item-123", "payload": {"data": "example payload"}}'

# Example: Trigger processing for item-456 (will be queued if item-123 is running)
curl -X POST http://localhost:3000/state-queue/process-item \
  -H "Content-Type: application/json" \
  -d '{"itemId": "item-456", "payload": {"info": "more data"}}'
```

The API will respond with a `202 Accepted` status and a `traceId` which you can use for tracking, while the request is queued or processed asynchronously.

## Steps Overview

*   **`trigger.api.step.ts`**:
    *   API Endpoint: `POST /state-queue/process-item`
    *   Accepts: JSON body (e.g., `{ "itemId": "...", "payload": ... }`)
    *   Emits: `queue.request` with `{ requestBody, originalTraceId }`
    *   Responsibility: Entry point for new items. Captures the request and its unique `traceId`, then triggers the manager.
*   **`manager.event.step.ts`**:
    *   Subscribes to: `queue.request`
    *   Emits: `queue.process` with `{ body, traceId }` (where `traceId` is the original trace ID)
    *   State Used: `is_running` (boolean), `current_traceId` (string), `request_queue` (array) within scope `state-queue-lock`.
    *   Responsibility: Manages the lock. If free, starts the first worker and locks. If busy, adds the request to the queue.
*   **`worker.event.step.ts`**:
    *   Subscribes to: `queue.process`
    *   Input: `{ body, traceId }` (original trace ID)
    *   Emits: `queue.finished` with `{ finishedTraceId, result }` (where `finishedTraceId` is the original trace ID it received).
    *   Responsibility: Performs the actual work for an item and emits an event to the dequeue step upon completion (or error), passing back the original trace ID it worked on.
*   **`dequeue.event.step.ts`**:
    *   Subscribes to: `queue.finished`
    *   Input: `{ finishedTraceId, result }`
    *   Emits: `queue.process` (if queue has items)
    *   State Used: Reads `current_traceId`, reads/writes `request_queue`, writes `current_traceId`, writes `is_running`, deletes `current_traceId`.
    *   Responsibility: Handles the worker completion event. Verifies the finished worker's ID against the lock, dequeues the next item if available (updating the lock and triggering the next worker), or releases the lock if the queue is empty.
