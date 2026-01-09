import { create, type StoreApi, type UseBoundStore } from 'zustand'

type QuickstartState = {
  isOpen: boolean
  code: string | null
  open: (code: string) => void
  close: () => void
}

export const useQuickstartStore: UseBoundStore<StoreApi<QuickstartState>> = create<QuickstartState>((set) => ({
  isOpen: false,
  code: null,
  open: (code: string) => set({ isOpen: true, code }),
  close: () => set({ isOpen: false, code: null }),
}))
