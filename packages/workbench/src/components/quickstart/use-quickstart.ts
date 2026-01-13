import { MotiaQuickstart } from './quickstart-engine'
import { useQuickstartStore } from './quickstart-store'

export const useQuickstart = (): {
  start: () => void
  close: () => void
} => {
  const start = (): void => MotiaQuickstart.start()
  const close = useQuickstartStore((state) => state.close)

  return { start, close }
}
