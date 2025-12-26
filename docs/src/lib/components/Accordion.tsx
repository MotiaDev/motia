'use client'
import React, { type PropsWithChildren, useState } from 'react'
import { Icon } from './Icon'
import { ChevronDown, ChevronRight } from 'lucide-react'

export const AccordionGroup: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="flex flex-col border border-border bg-muted-background rounded-lg">{children}</div>
}

type AccordionProps = PropsWithChildren<{
  title: string
  description: string
  iconName: string
  defaultOpen?: boolean
}>

export const Accordion: React.FC<AccordionProps> = ({
  title,
  description,
  iconName,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col">
      <div
        className="flex flex-row gap-1 items-center gap-2 px-4 hover:bg-white/5 p-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        <Icon name={iconName} className="size-4" />
        <h3 className="text-sm font-semibold m-1!">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  )
}
