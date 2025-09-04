import { useCallback, useEffect, useRef } from 'react'

export const useDebounced = (fn: () => void, delay = 500) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null)

  const debouncedFn = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(fn, delay)
  }, [fn, delay])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return debouncedFn
}
