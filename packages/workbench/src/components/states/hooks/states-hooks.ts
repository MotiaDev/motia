import { useEffect, useState } from 'react'

export interface StateItem {
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: string | number | boolean | object | unknown[] | null
}

export const useGetStateItems = (): StateItem[] => {
  const [items, setItems] = useState<StateItem[]>([])

  useEffect(() => {
    fetch('/motia/state')
      .then(async (res) => {
        if (res.ok) {
          return res.json()
        } else {
          throw await res.json()
        }
      })
      .then(setItems)
      .catch((err) => console.error(err))
  }, [])

  return items
}
