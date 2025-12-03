export type StreamInfo = {
  name: string
  displayName: string
  length: number
  firstEntryId: string | null
  lastEntryId: string | null
  groups: number
  radixTreeKeys: number
  radixTreeNodes: number
}

export type StreamEntry = {
  id: string
  timestamp: number
  fields: Record<string, string>
}

export type StreamEntryPagination = {
  start: string
  end: string
  count: number
  reverse?: boolean
}
