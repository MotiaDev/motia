import { Sidebar } from '@motiadev/ui'
import { X } from 'lucide-react'
import type React from 'react'
import type { Feature } from '../../types/file'
import { CodeDisplay } from './code-display'

type NodeSidebarProps = {
  content: string
  features: Feature[]
  title: string
  subtitle?: string
  variant: 'event' | 'api' | 'noop' | 'cron'
  language?: string
  isOpen: boolean
  onClose: () => void
}

export const NodeSidebar: React.FC<NodeSidebarProps> = ({
  content,
  title,
  subtitle,
  language,
  isOpen,
  onClose,
  features,
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
      <CodeDisplay code={content} language={language} features={features} />
    </Sidebar>
  )
}
