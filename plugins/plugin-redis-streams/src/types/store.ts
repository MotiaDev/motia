import type { StreamEntry, StreamInfo } from './stream'

export type RedisStreamsState = {
  streams: StreamInfo[]
  selectedStream: StreamInfo | null
  selectedEntry: StreamEntry | null
  error: string | null
  searchQuery: string
  entryDetailOpen: boolean

  setStreams: (streams: StreamInfo[]) => void
  setSelectedStream: (stream: StreamInfo | null) => void
  updateSelectedStreamStats: (stream: StreamInfo) => void
  setSelectedEntry: (entry: StreamEntry | null) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setEntryDetailOpen: (open: boolean) => void
  reset: () => void
}
