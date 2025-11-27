import { useEffect, useState, useCallback } from 'react'

export interface StateItem {
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: string | number | boolean | object | unknown[] | null
}

type Output = {
  items: StateItem[]
  deleteItems: (ids: string[]) => void
  refetch: () => void
}

export const useGetStateItems = (): Output => {
  const [items, setItems] = useState<StateItem[]>([])

  const refetch = useCallback(() => {
    fetch('/__motia/state')
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

  const deleteItems = (ids: string[]) => {
    fetch('/__motia/state/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).then(() => refetch())
  }

  useEffect(refetch, [refetch])

  return { items, deleteItems, refetch }
}
