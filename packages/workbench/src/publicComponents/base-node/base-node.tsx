import { Button, cn } from '@motiadev/ui'
import { ScanSearch } from 'lucide-react'
import type React from 'react'
import { type PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { useHandlePositions } from '../../hooks/use-update-handle-positions'
import type { Feature } from '../../types/file'
import type { BaseNodeProps } from '../node-props'
import { BaseHandle } from './base-handle'
import { NodeHeader } from './node-header'
import { NodeSidebar } from './node-sidebar'

type Props = PropsWithChildren<{
  title: string
  subtitle?: string
  variant: 'event' | 'api' | 'noop' | 'cron'
  language?: string
  className?: string
  disableSourceHandle?: boolean
  disableTargetHandle?: boolean
  data: BaseNodeProps
}>

export const BaseNode: React.FC<Props> = ({
  title,
  variant,
  children,
  disableSourceHandle,
  disableTargetHandle,
  language,
  subtitle,
  data,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { sourcePosition, targetPosition, toggleTargetPosition, toggleSourcePosition } = useHandlePositions(data)

  const [content, setContent] = useState<string | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])

  const fetchContent = useCallback(async () => {
    const response = await fetch(`/__motia/step/${data.id}`)
    const responseData = await response.json()
    setContent(responseData.content)
    setFeatures(responseData.features)
  }, [data.id])

  useEffect(() => {
    if (data.id && isOpen) {
      fetchContent()
    }
  }, [data.id, isOpen, fetchContent])

  return (
    <div
      className={cn('p-1 rounded-lg max-w-[350px]', {
        'bg-muted-foreground/20': isOpen,
      })}
    >
      <div
        className="rounded-lg dark:bg-[#101010] bg-background border-1 border-muted-foreground/30 border-solid"
        data-testid={`node-${title?.toLowerCase().replace(/ /g, '-')}`}
      >
        <div className="group relative">
          {/* Main node content */}
          <NodeHeader text={title} variant={variant} className="border-b-2 border-muted-foreground/10">
            <div className="flex justify-end">
              <Button
                data-testid={`open-code-preview-button-${title?.toLowerCase()}`}
                variant="ghost"
                className="h-5 p-0.5"
                onClick={() => setIsOpen(true)}
              >
                <ScanSearch className="w-4 h-4" />
              </Button>
            </div>
          </NodeHeader>

          {subtitle && <div className="py-4 px-6 text-sm text-muted-foreground">{subtitle}</div>}
          {children && (
            <div className="p-2">
              <div
                className={cn('space-y-3 p-4 text-sm text-muted-foreground', {
                  'bg-card': variant !== 'noop',
                })}
              >
                {children}
              </div>
            </div>
          )}

          {/* Connection points */}
          {!disableTargetHandle && (
            <BaseHandle type="target" position={targetPosition} onTogglePosition={toggleTargetPosition} />
          )}
          {!disableSourceHandle && (
            <BaseHandle type="source" position={sourcePosition} onTogglePosition={toggleSourcePosition} />
          )}
        </div>
      </div>

      {content && (
        <NodeSidebar
          features={features}
          content={content}
          title={title}
          subtitle={subtitle}
          variant={variant}
          language={language}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
