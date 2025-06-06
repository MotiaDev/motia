import React from 'react'
import { Stream } from '@motiadev/stream-client-browser'

type MotiaStreamContextType = {
  stream: Stream | null
}

export const MotiaStreamContext = React.createContext<MotiaStreamContextType>({
  stream: null,
})
