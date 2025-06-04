import { useState, useEffect } from 'react'
import { TracesList } from '@/components/observability/traces-list'
import { TraceTimeline } from '@/components/observability/trace-timeline'
import { TraceSearch } from '@/components/observability/trace-search'
import { ObservabilityStats } from '@/components/observability/observability-stats'
import { Trace, TraceGroup, TraceFilter } from '@/types/observability'

export const TracesPage = () => {
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<TraceGroup | null>(null)
  const [traces, setTraces] = useState<Trace[]>([])
  const [groups, setGroups] = useState<TraceGroup[]>([])
  const [filter, setFilter] = useState<TraceFilter>({})
  const [loading, setLoading] = useState(true)

  const fetchTraces = async (searchFilter: TraceFilter = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchFilter.flowName) params.append('flowName', searchFilter.flowName)
      if (searchFilter.status) params.append('status', searchFilter.status)
      if (searchFilter.stepName) params.append('stepName', searchFilter.stepName)
      if (searchFilter.correlationId) params.append('correlationId', searchFilter.correlationId)
      if (searchFilter.limit) params.append('limit', searchFilter.limit.toString())
      if (searchFilter.startTime?.from) params.append('from', searchFilter.startTime.from.toString())
      if (searchFilter.startTime?.to) params.append('to', searchFilter.startTime.to.toString())

      const response = await fetch(`/motia/traces?${params}`)
      const result = await response.json()
      
      setTraces(result.traces || [])
      setGroups(result.groups || [])
    } catch (error) {
      console.error('Failed to fetch traces:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTraceDetails = async (traceId: string): Promise<Trace> => {
    try {
      const response = await fetch(`/motia/traces/details/${traceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trace details')
      }
      const traceWithDetails = await response.json()
      
      // Update the selected trace if it matches
      if (selectedTrace?.id === traceId) {
        setSelectedTrace(traceWithDetails)
      }
      
      // Update the trace in the traces list
      setTraces(prevTraces => 
        prevTraces.map(trace => 
          trace.id === traceId ? traceWithDetails : trace
        )
      )
      
      // Update the trace in groups if it exists there
      setGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          traces: group.traces.map(trace => 
            trace.id === traceId ? traceWithDetails : trace
          )
        }))
      )
      
      return traceWithDetails
    } catch (error) {
      console.error('Failed to load trace details:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchTraces(filter)
  }, [filter])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchTraces(filter)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [filter, loading])

  const handleTraceSelect = (trace: Trace) => {
    setSelectedTrace(trace)
    setSelectedGroup(null)
  }

  const handleGroupSelect = (group: TraceGroup) => {
    setSelectedGroup(group)
    setSelectedTrace(null)
  }

  const handleSearch = (searchFilter: TraceFilter) => {
    setFilter(searchFilter)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Observability</h1>
          <ObservabilityStats />
        </div>
        <TraceSearch onSearch={handleSearch} />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-border">
          <TracesList
            traces={traces}
            groups={groups}
            selectedTrace={selectedTrace}
            selectedGroup={selectedGroup}
            onTraceSelect={handleTraceSelect}
            onGroupSelect={handleGroupSelect}
            loading={loading}
          />
        </div>
        
        <div className="flex-1">
          {selectedTrace && (
            <TraceTimeline 
              trace={selectedTrace} 
              onLoadDetails={loadTraceDetails}
            />
          )}
          {selectedGroup && (
            <TraceTimeline 
              group={selectedGroup} 
              onLoadDetails={loadTraceDetails}
            />
          )}
          {!selectedTrace && !selectedGroup && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a trace or trace group to view the timeline
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 