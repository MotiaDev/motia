import { Stream } from '@motiadev/stream-client-browser'
import type React from 'react'
import { useEffect, useState } from 'react'
import { MotiaStreamContext } from './motia-stream-context'

type Props = React.PropsWithChildren<{
  /**
   * The address of the stream server.
   *
   * @example
   * ```tsx
   * <MotiaStreamProvider address="ws://localhost:3000">
   *   <App />
   * </MotiaStreamProvider>
   */
  address: string
}>

export const MotiaStreamProvider: React.FC<Props> = ({ children, address }) => {
  const [stream, setStream] = useState<Stream | null>(null)

  useEffect(() => {
    const stream = new Stream(address)
    setStream(stream)

    return () => stream.close()
  }, [address])

  return <MotiaStreamContext.Provider value={{ stream }}>{children}</MotiaStreamContext.Provider>
}
