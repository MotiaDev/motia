import React from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../utils'

export const Icon: React.FC<{ name?: string; className?: string }> = ({ name, className }) => {
  const IconComponent: LucideIcon | undefined = name
    ? (LucideIcons[name as keyof typeof LucideIcons] as LucideIcon | undefined)
    : undefined

  return IconComponent && <IconComponent className={cn('size-6', className)} />
}
