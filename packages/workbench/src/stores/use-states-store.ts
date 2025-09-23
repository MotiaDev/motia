import { create } from 'zustand'
import { StateItem } from '../components/states/hooks/states-hooks'

export interface StateStreamItem {
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: string | number | boolean | object | unknown[] | null
  timestamp: number
  operation: 'set' | 'delete' | 'clear'
  traceId?: string
}

export type StatesState = {
  stateItems: StateItem[]
  addStateItem: (item: StateStreamItem) => void
  updateStateItem: (item: StateStreamItem) => void
  removeStateItem: (groupId: string, key: string) => void
  clearStateItems: () => void
  resetStates: () => void
}

export const useStatesStore = create<StatesState>((set) => ({
  stateItems: [],
  
  addStateItem: (item: StateStreamItem) => {
    const stateItem: StateItem = {
      groupId: item.groupId,
      key: item.key,
      type: item.type,
      value: item.value,
    }
    
    set((state) => {
      // Check if item already exists
      const existingIndex = state.stateItems.findIndex(
        (existing) => existing.groupId === item.groupId && existing.key === item.key
      )
      
      if (existingIndex >= 0) {
        // Update existing item
        const newItems = [...state.stateItems]
        newItems[existingIndex] = stateItem
        return { stateItems: newItems }
      } else {
        // Add new item
        return { stateItems: [...state.stateItems, stateItem] }
      }
    })
  },
  
  updateStateItem: (item: StateStreamItem) => {
    const stateItem: StateItem = {
      groupId: item.groupId,
      key: item.key,
      type: item.type,
      value: item.value,
    }
    
    set((state) => {
      const existingIndex = state.stateItems.findIndex(
        (existing) => existing.groupId === item.groupId && existing.key === item.key
      )
      
      if (existingIndex >= 0) {
        const newItems = [...state.stateItems]
        newItems[existingIndex] = stateItem
        return { stateItems: newItems }
      }
      
      return state
    })
  },
  
  removeStateItem: (groupId: string, key: string) => {
    set((state) => ({
      stateItems: state.stateItems.filter(
        (item) => !(item.groupId === groupId && item.key === key)
      ),
    }))
  },
  
  clearStateItems: () => {
    set({ stateItems: [] })
  },
  
  resetStates: () => {
    set({ stateItems: [] })
  },
}))
