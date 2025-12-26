import Link from 'next/link'
import React, { type PropsWithChildren } from 'react'
import { cn } from '../utils'
import { Icon } from './Icon'

type CardProps = PropsWithChildren<{
  title: string
  description: string
  href: string
  iconName?: string
  horizontal?: boolean
}>

export const Card: React.FC<CardProps> = ({ title, description, href, iconName, children, horizontal = false }) => {
  return (
    <Link href={href} className="no-underline flex">
      <div
        className={cn(
          'flex w-full flex-1 border border-border hover:border-foreground bg-muted-background rounded-lg p-4 hover:bg-muted-foreground/10 transition-colors',
          horizontal ? 'flex-row gap-4 items-center' : 'flex-col gap-1',
        )}
      >
        <Icon name={iconName} className={cn('size-6', horizontal ? 'mt-1' : 'mb-2')} />
        <div className="flex flex-col gap-1">
          <h3 className="text-lg m-0! font-semibold">{title}</h3>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
          {children}
        </div>
      </div>
    </Link>
  )
}
