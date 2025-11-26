import { ChevronsUpDown } from 'lucide-react'
import type { ComponentProps, FC, ReactNode } from 'react'
import * as React from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'

export interface BreadcrumbItemProps {
  label: string | ReactNode
  icon?: ReactNode
  onClick?: () => void
  isLast: boolean
  dropdownItems?: {
    label: string | ReactNode
    icon?: ReactNode
    onClick?: () => void
  }[]
}

export const BreadcrumbItem: FC<BreadcrumbItemProps> = ({ label, onClick, isLast, dropdownItems, icon }) => {
  if (dropdownItems?.length) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 gap-2">
            {icon}
            {label} <ChevronsUpDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={'bg-background text-foreground'}>
          {dropdownItems.map((item) => (
            <DropdownMenuItem key={`dropdown-${item.label}`} className="cursor-pointer gap-2" onClick={item.onClick}>
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (isLast) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="cursor-default hover:bg-transparent hover:text-muted-transparent p-1"
        asChild
      >
        <div className="flex items-center gap-2">
          {icon}
          {label}
        </div>
      </Button>
    )
  }

  return (
    <Button onClick={onClick} variant="ghost" size="sm" className="p-1 gap-2">
      {icon}
      {label}
    </Button>
  )
}

BreadcrumbItem.displayName = 'BreadcrumbItem'

export interface BreadcrumbProps extends ComponentProps<'div'> {
  items: {
    label: string | ReactNode
    icon?: ReactNode
    onClick?: () => void
    dropdownItems?: {
      label: string | ReactNode
      icon?: ReactNode
      onClick?: () => void
    }[]
  }[]
}

export const Breadcrumb: FC<BreadcrumbProps> = ({ className, items, ...props }) => {
  const lastIndex = items.length - 1
  return (
    <div className={cn('flex items-center', className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-fragment`}>
          {index !== 0 && (
            <span key={`${item.label}-separator`} className="mx-1.5 text-muted-foreground">
              /
            </span>
          )}
          <BreadcrumbItem
            key={`${item.label}-item`}
            label={item.label}
            icon={item.icon}
            isLast={index === lastIndex}
            dropdownItems={item.dropdownItems}
          />
        </React.Fragment>
      ))}
    </div>
  )
}
Breadcrumb.displayName = 'Breadcrumb'
