import { useEffect } from 'react'
import { MotiaQuickstart } from './quickstart-engine'

export const useQuickstart = (): { start: () => void } => {
  const start = (): void => MotiaQuickstart.start()

  useEffect(() => {
    const unsubscribe = MotiaQuickstart.onStart(() => {
      // For now, display an alert to indicate success
      alert('Quickstart flow started!')
    })

    return unsubscribe
  }, [])

  return { start }
}
