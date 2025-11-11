import { useEffect, useState } from 'react'
import type { TraceGroup } from '../types/observability'

export const useGetEndTime = (group: TraceGroup | undefined | null) => {
  const groupEndTime = group?.endTime
  const [endTime, setEndTime] = useState(() => groupEndTime || Date.now())

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (groupEndTime) {
      if (groupEndTime !== endTime) {
        setEndTime(groupEndTime)
      }
    } else {
      interval = setInterval(() => setEndTime(Date.now()), 100)
    }

    return () => clearInterval(interval)
  }, [groupEndTime, endTime])

  return endTime
}
