import { StreamSubscription } from '@motiadev/stream-client-browser'
import { useEffect, useState } from 'react'
import { useMotiaStream } from './use-motia-stream'

export type StreamItemArgs = {
  streamName: string
  groupId: string
  id?: string
}

/**
 * A hook to get a single item from a stream.
 *
 * @example
 * ```tsx
 * const { data } = useStreamItem<{ id:string; name: string }>({
 *   streamName: 'my-stream',
 *   groupId: '123',
 *   id: '123',
 * })
 *
 * return (
 *   <div>{data?.name}</div>
 * )
 * ```
 */
export const useStreamItem = <TData>(args?: StreamItemArgs) => {
  const { stream } = useMotiaStream()
  const [data, setData] = useState<TData | null>(null)
  const [event, setEvent] = useState<StreamSubscription | null>(null)

  useEffect(() => {
    if (!args?.streamName || !args?.groupId || !args?.id || !stream) return

    const subscription = stream.subscribeItem(args.streamName, args.groupId, args.id)

    subscription.addChangeListener((data) => setData(data as TData))
    setEvent(subscription)

    return () => {
      setData(null)
      setEvent(null)
      subscription.close()
    }
  }, [stream, args?.streamName, args?.groupId, args?.id])

  return { data, event }
}
