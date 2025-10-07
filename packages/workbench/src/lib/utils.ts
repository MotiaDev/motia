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
