import { cn } from '@/lib/utils'
import { Position } from '@xyflow/react'
import { cva, type VariantProps } from 'class-variance-authority'
import React, { PropsWithChildren } from 'react'
import { BaseHandle } from './base-handle'
import { LanguageIndicator } from '../views/flow/nodes/language-indicator'
import { colorMap } from './colorMap'

const baseDot = cva('w-[6px] h-[6px] rounded-full', {
  variants: {
    variant: {
      event: 'bg-[rgba(0,117,255,1)]',
      api: 'bg-[rgba(189,255,0,1)]',
      noop: 'bg-[rgba(255,49,234,1)]',
      cron: 'bg-[rgba(255,113,11,1)]',
    },
  },
})

type Props = PropsWithChildren<{
  title: string
  variant: VariantProps<typeof baseDot>['variant']
  language?: string
  headerChildren?: React.ReactNode
  className?: string
  disableSourceHandle?: boolean
  disableTargetHandle?: boolean
}>

const Dot = ({ variant }: { variant: VariantProps<typeof baseDot>['variant'] }) => (
  <div className={cn(baseDot({ variant }))} />
)

const HeaderBar = ({
  text,
  variant,
  children,
}: {
  text: string
  variant: VariantProps<typeof baseDot>['variant']
  children?: React.ReactNode
}) => (
  <div className="text-sm text-foreground flex justify-between items-center gap-4">
    <div className="flex items-center gap-2">
      <Dot variant={variant} />
      <span>{text}</span>
    </div>
    {children}
  </div>
)

export const BaseNode = (props: Props) => {
  const { title, variant, children, disableSourceHandle, disableTargetHandle, language } = props

  return (
    <div className="p-[1px] rounded-lg max-w-[350px] ">
      <div
        className="rounded-lg bg-background p-4 border border-muted border-solid"
        style={{
          borderColor: colorMap[variant as keyof typeof colorMap],
        }}
      >
        <div className="group relative">
          {/* Main node content */}
          <HeaderBar text={title} variant={variant} children={<LanguageIndicator language={language} />} />
          <div className="pt-4 space-y-3">{children}</div>

          {/* Connection points */}
          {!disableTargetHandle && <BaseHandle type="target" position={Position.Top} variant={variant} />}
          {!disableSourceHandle && <BaseHandle type="source" position={Position.Bottom} variant={variant} />}

          {/* Stacked card effect */}
          <div className="absolute inset-0 -z-10 translate-y-1 translate-x-1 bg-background rounded-md border border-white/5" />
        </div>
      </div>
    </div>
  )
}
