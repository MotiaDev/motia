import React, { PropsWithChildren } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { useLogListener } from '@/hooks/use-log-listener'

export const RootMotia: React.FC<PropsWithChildren> = ({ children }) => {
  useLogListener()
  useAnalytics()

  return children
}
