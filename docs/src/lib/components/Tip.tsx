import { Callout } from 'fumadocs-ui/components/callout'
import type { PropsWithChildren } from 'react'

export const Tip: React.FC<PropsWithChildren> = ({ children }) => {
  return <Callout type="info">{children}</Callout>
}
