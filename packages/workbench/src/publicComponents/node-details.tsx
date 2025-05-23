import { ChevronRight } from 'lucide-react'
import { DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { DialogContent } from '../components/ui/dialog'
import { Dialog } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { LanguageIndicator } from '../views/flow/nodes/language-indicator'
import { Emits } from './emits'
import { Subscribe } from './subscribe'
import { colorMap } from './colorMap'
import { HeaderBar } from './components/header-bar'
import React, { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  name: string
  type: 'event' | 'api' | 'noop' | 'cron'
  subscribes?: string[]
  emits?: Array<string | { topic: string; label?: string }>
  description?: string
  language?: string
}>

export const DetailItem: React.FC<PropsWithChildren<{ label: string }>> = (props) => {
  const { label, children } = props

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-foreground">{label}</Label>
      {children}
    </div>
  )
}
export const NodeDetails: React.FC<Props> = (props) => {
  const { name, type, subscribes, emits, description, language, children } = props

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-end gap-2">
          <div className="border border-solid border-border/50 p-1 rounded-md cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="border border-solid" style={{ borderColor: colorMap[type] }}>
        <DialogHeader>
          <DialogTitle>
            <HeaderBar variant={type} text={name} />
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div className="flex flex-col gap-6">
            {description && (
              <DetailItem label="Description">
                <span className="text-sm text-muted-foreground">{description}</span>
              </DetailItem>
            )}
            <DetailItem label="Language">
              <div className="flex items-center gap-2">
                <LanguageIndicator language={language} />
                <span className="capitalize">{language}</span>
              </div>
            </DetailItem>
            {subscribes && (
              <DetailItem label="Subscribes">
                <Subscribe subscribes={subscribes} />
              </DetailItem>
            )}
            {emits && (
              <DetailItem label="Emits">
                <Emits emits={emits} />
              </DetailItem>
            )}
            {children}
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
