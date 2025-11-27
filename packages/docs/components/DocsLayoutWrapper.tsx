'use client'

import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import CopyDocsButton from './CopyDocsButton'

// Using the same props type that DocsLayout accepts
type DocsLayoutProps = Parameters<typeof DocsLayout>[0]

interface DocsLayoutWrapperProps {
  children: ReactNode
  tree: DocsLayoutProps['tree']
  baseOptions: BaseLayoutProps
}

export default function DocsLayoutWrapper({ children, tree, baseOptions }: DocsLayoutWrapperProps) {
  return (
    <DocsLayout tree={tree} {...baseOptions}>
      {children}
      <CopyDocsButton />
    </DocsLayout>
  )
}
