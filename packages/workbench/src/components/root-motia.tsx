import React, { PropsWithChildren } from 'react'
import { useAnalytics } from '@/lib/analytics'

export const RootMotia: React.FC<PropsWithChildren> = ({ children }) => {
  useAnalytics()

  return children
}
