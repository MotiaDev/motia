import { getDevtoolsApi, getManagementApi } from '../config'
import { unwrapResponse } from '../utils'

// ============================================================================
// Trace Types (engine.otel.traces.*)
// ============================================================================

export interface SpanEvent {
  name: string
  timestamp: number
  attributes: Record<string, unknown>
}

export interface SpanLink {
  trace_id: string
  span_id: string
  attributes: Record<string, unknown>
}

export interface StoredSpan {
  trace_id: string
  span_id: string
  parent_span_id?: string
  name: string
  kind?: string
  start_time_unix_nano: number
  end_time_unix_nano: number
  status: string
  attributes: Array<[string, unknown]>
  events: SpanEvent[]
  links: SpanLink[]
  flags?: number
  service_name?: string
  resource?: Record<string, unknown>
}

export interface TracesResponse {
  spans: StoredSpan[]
  total: number
  offset: number
  limit: number
}

export interface TracesFilterParams {
  trace_id?: string
  service_name?: string
  name?: string
  status?: 'ok' | 'error' | 'unset'
  span_id?: string
  parent_span_id?: string | null
  min_duration_ms?: number
  max_duration_ms?: number
  start_time?: number
  end_time?: number
  attributes?: [string, string][]
  sort_by?: 'start_time' | 'duration' | 'service_name'
  sort_order?: 'asc' | 'desc'
  offset?: number
  limit?: number
  include_internal?: boolean
}

// Tree API types (engine.traces.tree)
export interface SpanTreeNode {
  trace_id: string
  span_id: string
  parent_span_id?: string
  name: string
  kind?: string
  start_time_unix_nano: number
  end_time_unix_nano: number
  status: string
  attributes: Array<[string, unknown]>
  events: SpanEvent[]
  links: SpanLink[]
  flags?: number
  service_name?: string
  resource?: Record<string, unknown>
  children: SpanTreeNode[]
}

export interface TraceTreeResponse {
  roots: SpanTreeNode[]
}

export async function fetchTraces(options?: TracesFilterParams): Promise<TracesResponse> {
  // Build request body, filtering out undefined values
  const body: Record<string, unknown> = {
    offset: options?.offset ?? 0,
    limit: options?.limit ?? 100,
  }

  // Add optional filter parameters if provided
  if (options?.trace_id !== undefined) body.trace_id = options.trace_id
  if (options?.service_name !== undefined) body.service_name = options.service_name
  if (options?.name !== undefined) body.name = options.name
  if (options?.status !== undefined) body.status = options.status
  if (options?.span_id !== undefined) body.span_id = options.span_id
  if (options?.parent_span_id !== undefined) body.parent_span_id = options.parent_span_id
  if (options?.min_duration_ms !== undefined) body.min_duration_ms = options.min_duration_ms
  if (options?.max_duration_ms !== undefined) body.max_duration_ms = options.max_duration_ms
  if (options?.start_time !== undefined) body.start_time = options.start_time
  if (options?.end_time !== undefined) body.end_time = options.end_time
  if (options?.attributes !== undefined) body.attributes = options.attributes
  if (options?.sort_by !== undefined) body.sort_by = options.sort_by
  if (options?.sort_order !== undefined) body.sort_order = options.sort_order
  if (options?.include_internal !== undefined) body.include_internal = options.include_internal

  try {
    const res = await fetch(`${getDevtoolsApi()}/otel/traces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      return unwrapResponse<TracesResponse>(res)
    }
  } catch {
    // Fall through to management API
  }

  const res = await fetch(`${getManagementApi()}/otel/traces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to fetch traces')
  return res.json()
}

export async function fetchTraceTree(traceId: string): Promise<TraceTreeResponse> {
  const body = { trace_id: traceId }

  try {
    const res = await fetch(`${getDevtoolsApi()}/otel/traces/tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      return unwrapResponse<TraceTreeResponse>(res)
    }
  } catch {
    // Fall through to management API
  }

  const res = await fetch(`${getManagementApi()}/otel/traces/tree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to fetch trace tree')
  return res.json()
}

export async function clearTraces(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${getDevtoolsApi()}/otel/traces/clear`, {
      method: 'POST',
    })
    if (res.ok) {
      await unwrapResponse(res)
      return { success: true }
    }
  } catch {
    // Fall through to management API
  }

  const res = await fetch(`${getManagementApi()}/otel/traces/clear`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to clear traces')
  return { success: true }
}
