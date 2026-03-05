'use client'

import * as FumaTabs from 'fumadocs-ui/components/tabs'
import { type ComponentProps } from 'react'

type TabsProps = ComponentProps<typeof FumaTabs.Tabs>

export function Tabs(props: TabsProps) {
  return <FumaTabs.Tabs {...props} />
}

export const Tab = FumaTabs.Tab
export const TabsList = FumaTabs.TabsList
export const TabsTrigger = FumaTabs.TabsTrigger
export const TabsContent = FumaTabs.TabsContent
