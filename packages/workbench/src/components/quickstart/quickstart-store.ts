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
  open: (code: string, steps: TutorialStepConfig[]) => void
  close: () => void
  setActiveStep: (stepId: string) => void
}

export const useQuickstartStore: UseBoundStore<StoreApi<QuickstartState>> = create<QuickstartState>((set) => ({
  isOpen: false,
  code: null,
  steps: [],
  activeStepId: null,
  open: (code: string, steps: TutorialStepConfig[]) =>
    set({ isOpen: true, code, steps, activeStepId: steps[0]?.id ?? null }),
  close: () => set({ isOpen: false, code: null, steps: [], activeStepId: null }),
  setActiveStep: (stepId: string) => set({ activeStepId: stepId }),
}))
