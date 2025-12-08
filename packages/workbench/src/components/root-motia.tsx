import type { PropsWithChildren } from 'react'
import { memo } from 'react'
import { useAnalytics } from '../lib/motia-analytics'

export const RootMotia: React.FC<PropsWithChildren> = memo(({ children }) => {
  useAnalytics()

  return children
})
RootMotia.displayName = 'RootMotia'
