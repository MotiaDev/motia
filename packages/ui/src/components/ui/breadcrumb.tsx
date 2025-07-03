import { cn } from '@/lib/utils'
import * as React from 'react'
import { ComponentProps, FC, ReactNode } from 'react'
import { Button } from './button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { ChevronsUpDown } from 'lucide-react'

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

  if (dropdownItems?.length) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 gap-2">
            {icon}
            {label} <ChevronsUpDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {dropdownItems.map((item) => (
            <DropdownMenuItem key={item.label as string} className="cursor-pointer gap-2" onClick={item.onClick}>
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
        <React.Fragment key={item.label as string}>
          {index !== 0 && <span className="mx-1.5 text-muted-foreground">/</span>}
          <BreadcrumbItem
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
