import type React from 'react'
import type { PropsWithChildren } from 'react'
import { useAnalytics } from '@/lib/motia-analytics'

export const RootMotia: React.FC<PropsWithChildren> = ({ children }) => {
  useAnalytics()

  return children
}
