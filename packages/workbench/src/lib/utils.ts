import { TabLocation } from '@/stores/use-app-tabs-store'

export const formatDuration = (duration?: number) => {
  if (duration === undefined || duration === null) return 'N/A'
  if (duration < 1000) return `${duration}ms`
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
  if (duration < 3600000) return `${(duration / 60000).toFixed(1)}min`
  return `${(duration / 3600000).toFixed(1)}h`
}

export const formatTimestamp = (time: number) => {
  const date = new Date(Number(time))
  return `${date.toLocaleDateString('en-US', { year: undefined, month: 'short', day: '2-digit' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h24' })}.${date.getMilliseconds().toString().padStart(3, '0')}`
}

export type ViewMode = 'project' | 'system'
export const DEFAULT_VIEW_MODE: ViewMode = 'system'

export const getViewModeFromURL = (): ViewMode => {
  try {
    const url = new URL(window.location.href)
    const viewMode = url.searchParams.get('view-mode')

    if (viewMode === 'project' || viewMode === 'system') {
      return viewMode
    }

    return DEFAULT_VIEW_MODE
  } catch (error) {
    console.error('[Motia] Error parsing URL:', error)
    return DEFAULT_VIEW_MODE
  }
}

export const isValidTabLocation = (position: string): position is TabLocation => {
  return Object.values(TabLocation).includes(position as TabLocation)
}
