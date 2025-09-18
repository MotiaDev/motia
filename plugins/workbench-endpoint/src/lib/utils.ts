import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration = (duration?: number) => {
  if (!duration) return 'N/A'
  if (duration < 1000) return `${duration}ms`
  return `${(duration / 1000).toFixed(1)}s`
}

export const formatTimestamp = (time: number) => {
  const date = new Date(Number(time))
  return `${date.toLocaleDateString('en-US', { year: undefined, month: 'short', day: '2-digit' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h24' })}.${date.getMilliseconds().toString().padStart(3, '0')}`
}
