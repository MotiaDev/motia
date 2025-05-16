import { useEffect, useState } from 'react'
import { useSocket } from '../../../hooks/use-socket'

export const useStateStream = (object: Record<string, any> | undefined) => {
  const { socket } = useSocket()
  const [data, setData] = useState<Record<string, any> | undefined>(object)

  useEffect(() => {
    if (!object) return

    const { __motia, ...rest } = object

    setData(rest)

    if (__motia) {
      const eventName = `${__motia.streamName}-${__motia.id}`

      socket.emit('join', __motia)
      socket.on(eventName, (event: any) => {
        if (event.type === 'update') {
          delete event.data.__motia
          setData(event.data)
        } else if (event.type === 'delete') {
          setData(undefined)
        }
      })

      return () => {
        socket.emit('leave', __motia)
        socket.off(eventName)
      }
    }
  }, [object?.__motia])

  return { data }
}
