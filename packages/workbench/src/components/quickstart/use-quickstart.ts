import { MotiaQuickstart } from './quickstart-engine'

export const useQuickstart = (): { start: () => void } => {
  const start = (): void => MotiaQuickstart.start()

  return { start }
}
