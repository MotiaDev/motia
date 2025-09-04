import type { StreamSubscription } from '@motiadev/stream-client-browser'
import { useEffect, useState } from 'react'
import { useMotiaStream } from './use-motia-stream'

export type StreamGroupArgs<TData extends { id: string }> = {
  streamName: string
  groupId: string
  sortKey?: keyof TData
}

/**
 * A hook to get a group of items from a stream.
 *
 * @example
 * ```tsx
 * const { data } = useStreamGroup<{ id:string; name: string }>({
 *   streamName: 'my-stream',
 *   groupId: '123',
 * })
 *
 * return (
 *   <div>
 *     {data.map((item) => (
 *       <div key={item.id}>{item.name}</div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export const useStreamGroup = <TData extends { id: string }>(args?: StreamGroupArgs<TData>) => {
  const { stream } = useMotiaStream()
  const [data, setData] = useState<TData[]>([])
  const [event, setEvent] = useState<StreamSubscription | null>(null)

  useEffect(() => {
    if (!args?.streamName || !args?.groupId || !stream) return

    const subscription = stream.subscribeGroup(args.streamName, args.groupId, args.sortKey)

    subscription.addChangeListener((data) => setData(data as TData[]))
    setEvent(subscription)

    return () => {
      setData([])
      setEvent(null)
      subscription.close()
    }
  }, [stream, args?.streamName, args?.groupId, args?.sortKey])

  return { data, event }
}
