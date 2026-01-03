import { Sidebar, Tabs, TabsContent, TabsList, TabsTrigger } from '@motiadev/ui'
import { Code2, Play, X } from 'lucide-react'
import type React from 'react'
import type { Feature } from '../../types/file'
import { CodeDisplay } from './code-display'
import { StepTriggerPanel } from './step-trigger-panel'

type NodeSidebarProps = {
  content: string
  features: Feature[]
  title: string
  subtitle?: string
  variant: 'event' | 'api' | 'noop' | 'cron'
  language?: string
  isOpen: boolean
  onClose: () => void
  stepId: string
  config: {
    type: string
    bodySchema?: unknown
    path?: string
    method?: string
    subscribes?: string[]
    cron?: string
  } | null
}

export const NodeSidebar: React.FC<NodeSidebarProps> = ({
  content,
  title,
  subtitle,
  language,
  isOpen,
  onClose,
  features,
  stepId,
  config,
}) => {
  if (!isOpen) return null

  return (
    <Sidebar
      title={title}
      subtitle={subtitle}
      initialWidth={820}
      contentClassName="p-0 h-full gap-0"
      onClose={onClose}
      actions={[{ icon: <X />, onClick: onClose, label: 'Close' }]}
    >
      <Tabs defaultValue="code" className="h-full flex flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="code">
              <Code2 className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="trigger">
              <Play className="w-4 h-4 mr-2" />
              Trigger
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="code" className="flex-1 overflow-hidden mt-0">
          <CodeDisplay code={content} language={language} features={features} />
        </TabsContent>
        <TabsContent value="trigger" className="flex-1 overflow-hidden mt-0">
          {config ? (
            <StepTriggerPanel stepId={stepId} stepName={title} config={config} />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Loading step configuration...</div>
          )}
        </TabsContent>
      </Tabs>
    </Sidebar>
  )
}
