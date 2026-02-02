import { Callout } from 'fumadocs-ui/components/callout'
import type React from 'react'
import type { PropsWithChildren } from 'react'

export const Tip: React.FC<PropsWithChildren> = ({ children }) => {
  return <Callout type="info">{children}</Callout>
}
