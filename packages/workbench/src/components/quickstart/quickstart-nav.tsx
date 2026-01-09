import type { FC, ReactNode } from 'react'

export type QuickstartNavItem = {
  id: string
  icon: ReactNode
  label: string
  onClick: () => void
  isActive?: boolean
}

type QuickstartNavProps = {
  items: QuickstartNavItem[]
}

export const QuickstartNav: FC<QuickstartNavProps> = ({ items }) => {
  return (
    <div className="flex flex-col gap-2 p-2 border-r border-border bg-muted/30">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg transition-colors
            ${item.isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
          `}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </div>
  )
}
