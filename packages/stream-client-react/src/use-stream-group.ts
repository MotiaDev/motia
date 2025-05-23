import { useEffect, useState } from 'react'
import { useMotiaStream } from './use-motia-stream'
import { StreamSubscription } from '@motiadev/stream-client-browser'

type Args = {
  streamName: string
  groupId: string
}

/**
 * A hook to get a group of items from a stream.
 *
 * @example
 * ```tsx
 * const { data } = useStreamGroup<{ id:string; name: string }>({ streamName: 'my-stream', groupId: '123' })
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
export const useStreamGroup = <TData>(args: Args) => {
  const { stream } = useMotiaStream()
  const [data, setData] = useState<TData[]>([])
  const [event, setEvent] = useState<StreamSubscription | null>(null)

  useEffect(() => {
    const subscription = stream.subscribeGroup(args.streamName, args.groupId)

    subscription.addChangeListener((data) => setData(data as TData[]))
    setEvent(subscription)

    return () => {
      setData([])
      subscription.close()
    }
  }, [stream, args.streamName, args.groupId])

  return { data, event }
}
