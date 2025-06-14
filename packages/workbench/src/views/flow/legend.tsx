import { Button } from '@motiadev/ui'
import { cn } from '@/lib/utils'
import { LayoutList, X } from 'lucide-react'
import { FC, useState } from 'react'
import { colorMap } from '@/publicComponents/colorMap'

const EdgeSwatch: FC<{ color: string; dashed: boolean }> = ({ color, dashed }) => (
  <svg className="my-1" width="48" height="10" viewBox="0 0 48 10" xmlns="http://www.w3.org/2000/svg">
    <line
      x1="0"
      y1="5"
      x2="48"
      y2="5"
      stroke={color}
      strokeWidth="2"
      strokeDasharray={dashed ? '4' : 'none'}
      strokeLinecap="round"
    />
  </svg>
)

const legendItems = [
  {
    label: 'Event (Core)',
    type: 'event',
    color: colorMap.event,
    description: 'Core logic components that process events.',
  },
  {
    label: 'API',
    type: 'api',
    color: colorMap.api,
    description: 'HTTP endpoints that trigger flows.',
  },
  {
    label: 'Noop (Non-Operation)',
    type: 'noop',
    color: colorMap.noop,
    description: 'Placeholder nodes for external processes.',
  },
  {
    label: 'Cron',
    type: 'cron',
    color: colorMap.cron,
    description: 'Scheduled tasks that run at specified intervals.',
  },
]

const edgeLegendItems = [
  {
    label: 'Event Edge',
    color: colorMap.event,
    description: 'Represents an event emitted and subscribed by steps.',
    dashed: true,
  },
  {
    label: 'Virtual Edge',
    color: 'hsl(var(--muted-foreground))',
    description: 'Represents virtual connections.',
    dashed: true,
  },
]

export const Legend: FC<{ onHover: (type: string | null) => void }> = ({ onHover }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={'absolute right-4 top-4 z-10 max-w-[500px]'}>
      <div
        className={cn(
          'rounded-lg border border-border bg-background/90 p-4 flex flex-col',
          !isExpanded && 'rounded-b-lg',
          isExpanded && 'gap-4',
        )}
      >
        <div className="flex items-center gap-2">
          {isExpanded && <div className="text-sm text-muted-foreground uppercase">Flow Legend</div>}
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-muted">
              {isExpanded ? <X size={16} /> : <LayoutList size={16} />}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-in-out',
            isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          {isExpanded && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {legendItems.map((item) => (
                  <div
                    key={item.type}
                    onMouseEnter={() => onHover(item.type)}
                    onMouseLeave={() => onHover(null)}
                    className="group cursor-pointer transition-all hover:bg-muted/20 rounded-md p-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-[8px] h-[8px] mt-[4px] rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="text-foreground text-sm font-medium">{item.label}</div>
                        <div className="text-muted-foreground text-sm mt-0.5">{item.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-border my-4" />

              <div className="text-sm text-muted-foreground uppercase pb-4">Edge Legend</div>
              <div className="grid grid-cols-2 gap-3">
                {edgeLegendItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <EdgeSwatch color={item.color} dashed={item.dashed} />
                    <div className="flex-1">
                      <div className="text-foreground text-sm font-medium">{item.label}</div>
                      <div className="text-muted-foreground text-sm mt-0.5">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
