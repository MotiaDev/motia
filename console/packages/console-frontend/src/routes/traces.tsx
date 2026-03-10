import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  GitBranch,
  Pause,
  Play,
  RefreshCw,
  Timer,
  XCircle,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchTraces, fetchTraceTree } from '@/api'
import { FlameGraph } from '@/components/traces/FlameGraph'
import { ServiceBreakdown } from '@/components/traces/ServiceBreakdown'
import { SpanPanel } from '@/components/traces/SpanPanel'
import { TraceFilters } from '@/components/traces/TraceFilters'
import { TraceHeader } from '@/components/traces/TraceHeader'
import { TraceMap } from '@/components/traces/TraceMap'
import { ViewSwitcher, type ViewType } from '@/components/traces/ViewSwitcher'
import { WaterfallChart } from '@/components/traces/WaterfallChart'
import { Badge, Button } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Pagination } from '@/components/ui/pagination'
import { useTraceFilters } from '@/hooks/useTraceFilters'
import { getServiceColor } from '@/lib/traceColors'
import {
  buildWorkflowChainFor,
  extractEnqueueInfo,
  extractServiceChain,
  toMs,
  treeToWaterfallData,
  type EnqueueInfo,
  type VisualizationSpan,
  type WaterfallData,
  type WorkflowStep,
} from '@/lib/traceTransform'
import { formatDuration } from '@/lib/traceUtils'

export const Route = createFileRoute('/traces')({
  component: TracesPage,
})

interface TraceGroup {
  traceId: string
  rootOperation: string
  functionId?: string
  status: 'ok' | 'error' | 'pending'
  startTime: number
  endTime?: number
  duration?: number
  spanCount: number
  services: string[]
}

interface TraceCacheEntry {
  chain: string[]
  enqueueInfo: EnqueueInfo | null
}

function formatTime(timestamp: number): string {
  const timestampMs = timestamp > 4102444800000 ? timestamp / 1_000_000 : timestamp
  const date = new Date(timestampMs)

  if (Number.isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const DEFAULT_TRACE_LIMIT = 10_000
const TRACE_PANEL_DEFAULT = 520
const SPAN_PANEL_DEFAULT = 400
const PANEL_MIN_WIDTH = 280
const PANEL_MAX_WIDTH = 900
const LIVE_INTERVAL = 3000
const RELATED_FETCH_WINDOW = 300_000
const clampPanelWidth = (w: number) => Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, w))

function TracesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSystem, setShowSystem] = useState(false)
  const [traceGroups, setTraceGroups] = useState<TraceGroup[]>([])
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
  const [hasOtelConfigured, setHasOtelConfigured] = useState(false)

  const [isPaused, setIsPaused] = useState(false)

  const [activeView, setActiveView] = useState<ViewType>('waterfall')
  const [selectedSpan, setSelectedSpan] = useState<VisualizationSpan | null>(null)
  const [waterfallData, setWaterfallData] = useState<WaterfallData | null>(null)
  const [isLoadingSpans, setIsLoadingSpans] = useState(false)
  const [spansError, setSpansError] = useState<string | null>(null)

  const [chainCache, setChainCache] = useState<Map<string, TraceCacheEntry>>(new Map())
  const chainCacheRef = useRef(chainCache)
  chainCacheRef.current = chainCache
  const chainFetchingRef = useRef(new Set<string>())

  const prevTraceIdsRef = useRef(new Set<string>())
  const newTraceIdsRef = useRef(new Set<string>())

  const listHoveredRef = useRef(false)
  const pendingTracesRef = useRef<TraceGroup[] | null>(null)

  // Prevent re-fetching related traces when cache updates
  const workflowFetchedForRef = useRef<string | null>(null)
  // Keep the previous chain so it doesn't flicker when navigating between steps
  const prevChainRef = useRef<WorkflowStep[] | null>(null)

  const {
    filters: filterState,
    updateFilter,
    resetFilters,
    getActiveFilterCount,
    getFilterOnlyParams,
    validationWarnings,
    clearValidationWarnings,
  } = useTraceFilters()

  const activeFilterCount = getActiveFilterCount()

  const mapSpanToTraceGroup = useCallback(
    (span: {
      trace_id: string
      name: string
      status: string
      start_time_unix_nano: number
      end_time_unix_nano: number
      service_name?: string
      attributes?: Array<[string, unknown]>
    }): TraceGroup => {
      const startTime = toMs(span.start_time_unix_nano)
      const endTime = toMs(span.end_time_unix_nano)
      let functionId: string | undefined
      if (Array.isArray(span.attributes)) {
        for (const item of span.attributes) {
          if (Array.isArray(item) && item.length >= 2 && String(item[0]) === 'function_id') {
            functionId = String(item[1])
            break
          }
        }
      }
      return {
        traceId: span.trace_id,
        rootOperation: span.name,
        functionId,
        status: span.status.toLowerCase() === 'error' ? 'error' : 'ok',
        startTime,
        endTime,
        duration: endTime - startTime,
        spanCount: 1,
        services: [span.service_name || 'unknown'],
      }
    },
    [],
  )

  const loadTraces = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = getFilterOnlyParams()
      const data = await fetchTraces({
        ...params,
        offset: 0,
        limit: DEFAULT_TRACE_LIMIT,
        include_internal: showSystem,
      })

      if (data.spans && data.spans.length > 0) {
        const traces = data.spans.map(mapSpanToTraceGroup)
        traces.sort((a, b) => b.startTime - a.startTime)
        prevTraceIdsRef.current = new Set(traces.map((t) => t.traceId))
        setTraceGroups(traces)
        setHasOtelConfigured(true)
      } else {
        setTraceGroups([])
        setHasOtelConfigured(false)
      }
    } catch (error) {
      console.error('Failed to load traces:', error)
      setTraceGroups([])
      setHasOtelConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }, [getFilterOnlyParams, showSystem, mapSpanToTraceGroup])

  const loadTraceSpans = useCallback(async (traceId: string) => {
    setIsLoadingSpans(true)
    setSpansError(null)
    setWaterfallData(null)

    try {
      const data = await fetchTraceTree(traceId)

      if (data.roots && data.roots.length > 0) {
        const wfData = treeToWaterfallData(data.roots)

        if (wfData) {
          setWaterfallData(wfData)
          setSpansError(null)
        } else {
          console.warn('[Traces] treeToWaterfallData returned null')
          setSpansError('Failed to process span data')
        }

        setChainCache((prev) => {
          if (prev.has(traceId)) return prev
          const next = new Map(prev)
          next.set(traceId, {
            chain: extractServiceChain(data.roots),
            enqueueInfo: extractEnqueueInfo(data.roots),
          })
          return next
        })
      } else {
        console.warn('[Traces] No roots found for trace:', traceId)
        setSpansError('No span data available for this trace')
      }
    } catch (error) {
      console.error('[Traces] Failed to load trace tree:', error)
      setSpansError(error instanceof Error ? error.message : 'Failed to load trace details')
    } finally {
      setIsLoadingSpans(false)
    }
  }, [])

  useEffect(() => {
    loadTraces()
  }, [loadTraces])

  const silentRefresh = useCallback(async () => {
    try {
      const params = getFilterOnlyParams()
      const data = await fetchTraces({
        ...params,
        offset: 0,
        limit: DEFAULT_TRACE_LIMIT,
        include_internal: showSystem,
      })
      if (data.spans?.length) {
        const traces = data.spans.map(mapSpanToTraceGroup)
        traces.sort((a, b) => b.startTime - a.startTime)

        const newIds = new Set(traces.map((t) => t.traceId))
        const prevIds = prevTraceIdsRef.current
        const changed = newIds.size !== prevIds.size || [...newIds].some((id) => !prevIds.has(id))

        if (changed) {
          const fresh = new Set<string>()
          for (const id of newIds) {
            if (!prevIds.has(id)) fresh.add(id)
          }
          prevTraceIdsRef.current = newIds

          if (listHoveredRef.current) {
            pendingTracesRef.current = traces
            return
          }

          newTraceIdsRef.current = fresh
          if (fresh.size > 0) {
            setTimeout(() => {
              newTraceIdsRef.current = new Set()
            }, 1500)
          }
          setTraceGroups(traces)
          setHasOtelConfigured(true)
        }
      }
    } catch {
      // Silent poll — swallow errors
    }
  }, [getFilterOnlyParams, showSystem, mapSpanToTraceGroup])

  const handleListMouseLeave = useCallback(() => {
    listHoveredRef.current = false
    const pending = pendingTracesRef.current
    if (pending) {
      pendingTracesRef.current = null
      newTraceIdsRef.current = new Set<string>()
      setTraceGroups(pending)
      setHasOtelConfigured(true)
    }
  }, [])

  const selectedTraceIdRef = useRef(selectedTraceId)
  selectedTraceIdRef.current = selectedTraceId

  useEffect(() => {
    if (isPaused) return
    const id = setInterval(() => {
      silentRefresh()
      const traceId = selectedTraceIdRef.current
      if (traceId) {
        fetchTraceTree(traceId)
          .then((data) => {
            if (data.roots?.length) {
              const wf = treeToWaterfallData(data.roots)
              if (wf) setWaterfallData(wf)
            }
          })
          .catch(() => {})
      }
    }, LIVE_INTERVAL)
    return () => clearInterval(id)
  }, [isPaused, silentRefresh])

  const selectTrace = useCallback(
    (traceId: string | null) => {
      setSelectedTraceId(traceId)
      if (!traceId) {
        setWaterfallData(null)
        setSelectedSpan(null)
        setSpansError(null)
        setIsLoadingSpans(false)
        workflowFetchedForRef.current = null
        prevChainRef.current = null
      } else {
        loadTraceSpans(traceId)
      }
    },
    [loadTraceSpans],
  )

  const handleTraceHover = useCallback((group: TraceGroup) => {
    if (chainCacheRef.current.has(group.traceId) || chainFetchingRef.current.has(group.traceId))
      return
    chainFetchingRef.current.add(group.traceId)
    fetchTraceTree(group.traceId)
      .then((data) => {
        setChainCache((prev) => {
          if (prev.has(group.traceId)) return prev
          const next = new Map(prev)
          next.set(group.traceId, {
            chain: data.roots?.length
              ? extractServiceChain(data.roots)
              : [group.services[0] || 'unknown'],
            enqueueInfo: data.roots?.length ? extractEnqueueInfo(data.roots) : null,
          })
          return next
        })
      })
      .catch(() => {})
      .finally(() => {
        chainFetchingRef.current.delete(group.traceId)
      })
  }, [])

  const selectedTrace = traceGroups.find((g) => g.traceId === selectedTraceId)

  // One-time fetch of related enqueue traces when a trace is selected
  useEffect(() => {
    if (!selectedTraceId) {
      workflowFetchedForRef.current = null
      return
    }
    if (selectedTraceId === workflowFetchedForRef.current) return

    const selected = traceGroups.find((t) => t.traceId === selectedTraceId)
    if (!selected || selected.functionId !== 'enqueue') return

    workflowFetchedForRef.current = selectedTraceId

    const candidates = traceGroups.filter(
      (t) =>
        t.functionId === 'enqueue' &&
        t.traceId !== selectedTraceId &&
        Math.abs(t.startTime - selected.startTime) < RELATED_FETCH_WINDOW &&
        !chainCacheRef.current.has(t.traceId) &&
        !chainFetchingRef.current.has(t.traceId),
    )

    if (candidates.length === 0) return
    const batch = candidates.slice(0, 50)
    for (const t of batch) chainFetchingRef.current.add(t.traceId)

    Promise.allSettled(
      batch.map((t) =>
        fetchTraceTree(t.traceId).then((data) => ({
          traceId: t.traceId,
          chain: data.roots?.length
            ? extractServiceChain(data.roots)
            : [t.services[0] || 'unknown'],
          enqueueInfo: data.roots?.length ? extractEnqueueInfo(data.roots) : null,
        })),
      ),
    ).then((results) => {
      const entries: [string, TraceCacheEntry][] = []
      for (const r of results) {
        if (r.status === 'fulfilled') {
          entries.push([r.value.traceId, { chain: r.value.chain, enqueueInfo: r.value.enqueueInfo }])
          chainFetchingRef.current.delete(r.value.traceId)
        }
      }
      if (entries.length) {
        setChainCache((prev) => {
          const next = new Map(prev)
          for (const [k, v] of entries) next.set(k, v)
          return next
        })
      }
    })
  }, [selectedTraceId, traceGroups])

  // Build workflow chain — persists across step navigation to avoid flicker
  const selectedWorkflowChain = useMemo(() => {
    if (!selectedTraceId) {
      prevChainRef.current = null
      return null
    }

    const selected = traceGroups.find((t) => t.traceId === selectedTraceId)
    if (!selected || selected.functionId !== 'enqueue') {
      prevChainRef.current = null
      return null
    }

    const infoMap = new Map<string, EnqueueInfo>()
    for (const [traceId, entry] of chainCache) {
      if (entry.enqueueInfo) infoMap.set(traceId, entry.enqueueInfo)
    }

    const chain = buildWorkflowChainFor(
      selectedTraceId,
      traceGroups
        .filter(
          (t) =>
            t.functionId === 'enqueue' &&
            Math.abs(t.startTime - selected.startTime) < RELATED_FETCH_WINDOW,
        )
        .map((t) => ({
          traceId: t.traceId,
          startTime: t.startTime,
          endTime: t.endTime ?? t.startTime + (t.duration ?? 0),
          duration: t.duration ?? 0,
          status: (t.status === 'error' ? 'error' : 'ok') as 'ok' | 'error',
        })),
      infoMap,
    )

    if (chain) {
      prevChainRef.current = chain
      return chain
    }

    // If chain not found yet (data still loading), reuse previous chain if it contains this trace
    if (prevChainRef.current?.some((s) => s.traceId === selectedTraceId)) {
      return prevChainRef.current
    }

    return null
  }, [selectedTraceId, traceGroups, chainCache])

  const filteredTraces = useMemo(() => {
    return traceGroups.filter((group) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesId = group.traceId.toLowerCase().includes(query)
        const matchesOp = group.rootOperation.toLowerCase().includes(query)
        const matchesFn = group.functionId?.toLowerCase().includes(query) ?? false
        const cacheEntry = chainCache.get(group.traceId)
        const matchesTopic =
          cacheEntry?.enqueueInfo?.topic.toLowerCase().includes(query) ?? false
        const matchesDown =
          cacheEntry?.enqueueInfo?.downstreamFunction?.toLowerCase().includes(query) ?? false
        if (!matchesId && !matchesOp && !matchesFn && !matchesTopic && !matchesDown) return false
      }
      return true
    })
  }, [traceGroups, searchQuery, chainCache])

  const totalPages = Math.max(1, Math.ceil(filteredTraces.length / filterState.pageSize))

  const pagedTraces = useMemo(() => {
    const start = (filterState.page - 1) * filterState.pageSize
    return filteredTraces.slice(start, start + filterState.pageSize)
  }, [filteredTraces, filterState.page, filterState.pageSize])

  useEffect(() => {
    if (selectedTraceId && !pagedTraces.some((g) => g.traceId === selectedTraceId)) {
      selectTrace(null)
    }
  }, [pagedTraces, selectedTraceId, selectTrace])

  const stats = useMemo(
    () => ({
      totalTraces: filteredTraces.length,
      errorCount: filteredTraces.filter((g) => g.status === 'error').length,
      avgDuration:
        filteredTraces.length > 0
          ? filteredTraces.reduce((sum, g) => sum + (g.duration || 0), 0) / filteredTraces.length
          : 0,
    }),
    [filteredTraces],
  )

  const getTraceLabel = useCallback(
    (group: TraceGroup) => {
      const cacheEntry = chainCache.get(group.traceId)
      if (group.functionId === 'enqueue' && cacheEntry?.enqueueInfo) {
        const { topic, downstreamFunction } = cacheEntry.enqueueInfo
        return downstreamFunction ? `enqueue: ${topic} → ${downstreamFunction}` : `enqueue: ${topic}`
      }
      if (group.functionId && group.functionId !== 'enqueue') {
        return group.functionId
      }
      return group.rootOperation
    },
    [chainCache],
  )

  // --- Resizable panels ---
  const containerRef = useRef<HTMLDivElement>(null)
  const [panelWidths, setPanelWidths] = useState({
    trace: TRACE_PANEL_DEFAULT,
    span: SPAN_PANEL_DEFAULT,
  })
  const [isResizing, setIsResizing] = useState(false)
  const panelWidthsRef = useRef({ trace: TRACE_PANEL_DEFAULT, span: SPAN_PANEL_DEFAULT })
  panelWidthsRef.current = panelWidths
  const isResizingRef = useRef<'trace' | 'span' | null>(null)
  const resizeStartRef = useRef({ x: 0, width: 0, otherWidth: 0 })
  const prevSelectedSpanRef = useRef<string | null>(null)
  const preSplitTraceWidthRef = useRef(TRACE_PANEL_DEFAULT)

  useEffect(() => {
    const spanId = selectedSpan?.span_id ?? null
    const hadSpan = prevSelectedSpanRef.current !== null
    const hasSpan = spanId !== null

    if (hasSpan && !hadSpan) {
      preSplitTraceWidthRef.current = panelWidthsRef.current.trace
      const containerWidth = containerRef.current?.offsetWidth ?? 1200
      const halfWidth = Math.max(PANEL_MIN_WIDTH, Math.floor((containerWidth - 3) / 2))
      setPanelWidths({ trace: halfWidth, span: halfWidth })
    } else if (!hasSpan && hadSpan) {
      setPanelWidths((p) => ({ ...p, trace: preSplitTraceWidthRef.current }))
    }

    prevSelectedSpanRef.current = spanId
  }, [selectedSpan])

  const startResize = useCallback((e: React.MouseEvent, panel: 'trace' | 'span') => {
    e.preventDefault()
    isResizingRef.current = panel
    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      width: panel === 'trace' ? panelWidthsRef.current.trace : panelWidthsRef.current.span,
      otherWidth: panel === 'trace' ? panelWidthsRef.current.span : panelWidthsRef.current.trace,
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      const dx = resizeStartRef.current.x - e.clientX

      if (isResizingRef.current === 'trace') {
        setPanelWidths((p) => ({ ...p, trace: clampPanelWidth(resizeStartRef.current.width + dx) }))
      } else {
        const totalWidth = resizeStartRef.current.width + resizeStartRef.current.otherWidth
        const maxForPanel = totalWidth - PANEL_MIN_WIDTH
        const newSpanWidth = Math.max(
          PANEL_MIN_WIDTH,
          Math.min(maxForPanel, resizeStartRef.current.width + dx),
        )
        const newTraceWidth = totalWidth - newSpanWidth
        setPanelWidths({ trace: newTraceWidth, span: newSpanWidth })
      }
    }
    const onMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = null
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 md:px-5 py-3 md:py-4 bg-dark-gray/30 border-b border-border">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <h1 className="text-sm md:text-base font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            Traces
          </h1>
          {isPaused && (
            <Badge variant="warning" className="gap-1 text-[10px] md:text-xs">
              <Pause className="w-2.5 h-2.5 md:w-3 md:h-3" />
              <span className="hidden sm:inline">Paused</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Button
            variant={isPaused ? 'accent' : 'ghost'}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="h-6 md:h-7 text-[10px] md:text-xs px-2"
          >
            {isPaused ? (
              <Play className="w-3 h-3 md:mr-1.5" />
            ) : (
              <Pause className="w-3 h-3 md:mr-1.5" />
            )}
            <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
          <Button
            variant={showSystem ? 'accent' : 'ghost'}
            size="sm"
            onClick={() => setShowSystem(!showSystem)}
            className="h-6 md:h-7 text-[10px] md:text-xs px-2"
          >
            {showSystem ? (
              <Eye className="w-3 h-3 md:mr-1.5" />
            ) : (
              <EyeOff className="w-3 h-3 md:mr-1.5" />
            )}
            <span className={`hidden md:inline ${showSystem ? '' : 'line-through opacity-60'}`}>
              System
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTraces}
            disabled={isLoading}
            className="h-7 text-xs text-muted hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border">
        <ErrorBoundary>
          <TraceFilters
            filters={filterState}
            onFilterChange={updateFilter}
            onClear={resetFilters}
            validationWarnings={validationWarnings}
            onClearWarnings={clearValidationWarnings}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            stats={hasOtelConfigured ? stats : undefined}
          />
        </ErrorBoundary>
      </div>

      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        <div
          className={`flex flex-col flex-1 overflow-hidden ${selectedSpan && waterfallData ? 'hidden' : ''}`}
        >
          <div
            className="flex-1 overflow-y-auto"
            onMouseEnter={() => {
              listHoveredRef.current = true
            }}
            onMouseLeave={handleListMouseLeave}
          >
            {isLoading && traceGroups.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-5 h-5 text-muted animate-spin" />
              </div>
            ) : filteredTraces.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center max-w-xs">
                  <div className="w-10 h-10 mb-3 mx-auto rounded-lg bg-dark-gray border border-border flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-muted" />
                  </div>
                  <h3 className="text-xs font-medium mb-1 text-foreground">No traces found</h3>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {activeFilterCount > 0 || searchQuery
                      ? 'No traces match the current filters. Try adjusting or clearing them.'
                      : 'No traces recorded yet. They will appear here once available.'}
                  </p>
                  {(activeFilterCount > 0 || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFilters()
                        setSearchQuery('')
                      }}
                      className="mt-2.5 text-[11px] text-yellow hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              pagedTraces.map((group) => {
                const isSelected = selectedTraceId === group.traceId
                const isNew = newTraceIdsRef.current.has(group.traceId)
                const label = getTraceLabel(group)

                return (
                  <button
                    key={group.traceId}
                    type="button"
                    onMouseEnter={() => handleTraceHover(group)}
                    onClick={() => selectTrace(isSelected ? null : group.traceId)}
                    className={`w-full p-3 border-b border-border text-left transition-colors
                      ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-dark-gray/50'}
                      ${isNew ? 'animate-flash-yellow' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {group.status === 'ok' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      ) : group.status === 'error' ? (
                        <XCircle className="w-3.5 h-3.5 text-error" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-yellow animate-pulse" />
                      )}
                      <span className="font-medium text-sm truncate flex-1">{label}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted">
                      <code className="font-mono">{group.traceId.slice(0, 8)}</code>
                      <span className="flex items-center gap-1">
                        <Timer className="w-2.5 h-2.5" />
                        {formatDuration(group.duration ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        {group.services.join(', ')}
                      </span>
                      <span className="ml-auto">{formatTime(group.startTime)}</span>
                    </div>

                    {(() => {
                      const cacheEntry = chainCache.get(group.traceId)
                      const chain = cacheEntry?.chain
                      if (!chain || chain.length <= 1) return null
                      return (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {chain.map((svc, i) => (
                            <span key={svc} className="flex items-center gap-1">
                              {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-gray-600" />}
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#141414] border border-[#1D1D1D] text-[9px] font-mono text-gray-400">
                                <span
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: getServiceColor(svc) }}
                                />
                                {svc}
                              </span>
                            </span>
                          ))}
                        </div>
                      )
                    })()}
                  </button>
                )
              })
            )}
          </div>

          {filteredTraces.length > 0 && (
            <div className="flex-shrink-0 bg-background/95 backdrop-blur border-t border-border px-3 py-2">
              <Pagination
                currentPage={filterState.page}
                totalPages={totalPages}
                totalItems={filteredTraces.length}
                pageSize={filterState.pageSize}
                onPageChange={(page) => updateFilter('page', page)}
                onPageSizeChange={(pageSize) => updateFilter('pageSize', pageSize)}
                pageSizeOptions={[25, 50, 100]}
              />
            </div>
          )}
        </div>

        {selectedTrace && (
          <>
            {!(selectedSpan && waterfallData) && (
              <button
                type="button"
                onMouseDown={(e) => startResize(e, 'trace')}
                onDoubleClick={() => setPanelWidths((p) => ({ ...p, trace: TRACE_PANEL_DEFAULT }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setPanelWidths((p) => ({ ...p, trace: TRACE_PANEL_DEFAULT }))
                  }
                }}
                className="w-[3px] flex-shrink-0 cursor-col-resize relative bg-border hover:bg-primary/50 active:bg-primary transition-colors"
              >
                <div className="absolute inset-y-0 -left-[3px] -right-[3px]" />
              </button>
            )}
            <div
              style={{ width: panelWidths.trace }}
              className={`bg-[#0A0A0A] flex flex-col h-full overflow-hidden flex-shrink-0 animate-trace-panel-in ${isResizing ? 'pointer-events-none select-none' : ''}`}
            >
              {isLoadingSpans && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 text-yellow animate-spin mb-3" />
                  <div className="text-xs font-medium mb-1">Loading trace...</div>
                  <div className="text-[10px] text-muted font-mono">
                    {selectedTrace.traceId.slice(0, 12)}
                  </div>
                </div>
              )}

              {!isLoadingSpans && spansError && (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="w-10 h-10 mb-3 rounded-lg bg-dark-gray border border-border flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-error" />
                  </div>
                  <div className="text-xs font-medium mb-1 text-error">Failed to load trace</div>
                  <div className="text-[10px] text-muted text-center mb-3 max-w-xs">
                    {spansError}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadTraceSpans(selectedTrace.traceId)}
                    className="text-[10px] h-6"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              {!isLoadingSpans && !spansError && waterfallData && (
                <>
                  <TraceHeader
                    data={waterfallData}
                    traceId={selectedTrace.traceId}
                    onClose={() => {
                      selectTrace(null)
                    }}
                    onSpanClick={setSelectedSpan}
                  />

                  <div className="border-b border-[#1D1D1D] px-4 py-2.5">
                    <ViewSwitcher currentView={activeView} onViewChange={setActiveView} />
                  </div>

                  <div className="flex-1 overflow-auto min-h-0">
                    {activeView === 'waterfall' &&
                      selectedWorkflowChain &&
                      selectedWorkflowChain.length > 1 && (
                        <div className="border-b border-[#2D2D2D] bg-[#0A0A0A] sticky top-0 z-10">
                          <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-muted">
                            Workflow
                          </div>
                          {selectedWorkflowChain.map((step) => {
                            const isCurrent = step.traceId === selectedTrace.traceId
                            return (
                              <button
                                key={step.traceId}
                                type="button"
                                onClick={() => selectTrace(step.traceId)}
                                className={`w-full flex items-center gap-1.5 py-1 px-3 text-left transition-colors border-l-2
                                  ${isCurrent ? 'bg-yellow/5 border-l-yellow' : 'border-l-transparent hover:bg-dark-gray/30'}
                                `}
                              >
                                {step.status === 'ok' ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-success shrink-0" />
                                ) : (
                                  <XCircle className="w-2.5 h-2.5 text-error shrink-0" />
                                )}
                                <span className="text-[10px] font-mono text-cyan-400 truncate">
                                  {step.topic}
                                </span>
                                {step.downstreamFunction && (
                                  <>
                                    <ChevronRight className="w-2 h-2 text-gray-600 shrink-0" />
                                    <span className="text-[10px] font-mono text-foreground truncate">
                                      {step.downstreamFunction}
                                    </span>
                                  </>
                                )}
                                <span className="text-[9px] text-muted ml-auto shrink-0">
                                  {formatDuration(step.duration)}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                    {activeView === 'waterfall' && (
                      <WaterfallChart
                        data={waterfallData}
                        onSpanClick={setSelectedSpan}
                        selectedSpanId={selectedSpan?.span_id}
                      />
                    )}

                    {activeView === 'flamegraph' && (
                      <FlameGraph
                        data={waterfallData}
                        onSpanClick={setSelectedSpan}
                        selectedSpanId={selectedSpan?.span_id}
                      />
                    )}

                    {activeView === 'map' && (
                      <TraceMap data={waterfallData} onSpanClick={setSelectedSpan} />
                    )}
                  </div>

                  <div className="border-t border-[#1D1D1D] flex-shrink-0">
                    <ServiceBreakdown data={waterfallData} />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {selectedSpan && waterfallData && (
          <>
            <button
              type="button"
              onMouseDown={(e) => startResize(e, 'span')}
              onDoubleClick={() => setPanelWidths((p) => ({ ...p, span: SPAN_PANEL_DEFAULT }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setPanelWidths((p) => ({ ...p, span: SPAN_PANEL_DEFAULT }))
                }
              }}
              className="w-[3px] flex-shrink-0 cursor-col-resize relative bg-border hover:bg-primary/50 active:bg-primary transition-colors"
            >
              <div className="absolute inset-y-0 -left-[3px] -right-[3px]" />
            </button>
            <div
              style={{ width: panelWidths.span }}
              className={`bg-[#0A0A0A] flex-shrink-0 h-full overflow-hidden ${isResizing ? 'pointer-events-none select-none' : ''}`}
            >
              <SpanPanel
                key={selectedSpan.span_id}
                span={selectedSpan}
                traceData={waterfallData}
                onClose={() => setSelectedSpan(null)}
                onNavigateToSpan={setSelectedSpan}
                onNavigateToTrace={(traceId) => selectTrace(traceId)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
