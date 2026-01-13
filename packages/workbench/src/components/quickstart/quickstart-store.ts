import { create, type StoreApi, type UseBoundStore } from 'zustand'

export type TutorialStepConfig = {
  id: string
  title: string
  comment: { start: number; end: number }
  code: { start: number; end: number }
}

type QuickstartState = {
  isOpen: boolean
  code: string | null
  steps: TutorialStepConfig[]
  activeStepId: string | null
  visitedStepIds: Set<string>
  open: (code: string, steps: TutorialStepConfig[]) => void
  close: () => void
  setActiveStep: (stepId: string) => void
  visitStep: (stepId: string) => void
  run: () => Promise<void>
}

export const useQuickstartStore: UseBoundStore<StoreApi<QuickstartState>> = create<QuickstartState>((set, get) => ({
  isOpen: false,
  code: null,
  steps: [],
  activeStepId: null,
  visitedStepIds: new Set(),
  open: (code: string, steps: TutorialStepConfig[]) =>
    set({
      isOpen: true,
      code,
      steps,
      activeStepId: steps[0]?.id ?? null,
      visitedStepIds: new Set(steps[0] ? [steps[0].id] : []),
    }),
  close: () => set({ isOpen: false, code: null, steps: [], activeStepId: null, visitedStepIds: new Set() }),
  setActiveStep: (stepId: string) => set({ activeStepId: stepId }),
  visitStep: (stepId: string) =>
    set((state) => ({
      visitedStepIds: new Set([...state.visitedStepIds, stepId]),
    })),
  run: async () => {
    const { close } = get()
    close()
    await new Promise((resolve) => setTimeout(resolve, 100))
    await fetch('/hello', { method: 'GET' })
  },
}))
