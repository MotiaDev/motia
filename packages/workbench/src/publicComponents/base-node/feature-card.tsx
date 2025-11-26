import { cn } from '@motiadev/ui'
import type React from 'react'
import type { Feature } from '../../types/file'

type Props = {
  feature: Feature
  highlighted: boolean
  onClick: () => void
  onHover: () => void
}

export const FeatureCard: React.FC<Props> = ({ feature, highlighted, onClick, onHover }) => {
  return (
    <div
      data-feature-id={feature.id}
      className={cn(
        'p-4 rounded-lg bg-card shadow-sm cursor-pointer hover:bg-card/50 border-2 border-transparent',
        highlighted && 'border-2 border-accent-1000 bg-accent-100',
      )}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      <div className="text-md font-semibold text-foreground leading-tight whitespace-nowrap mb-2">{feature.title}</div>
      <div className="text-sm font-medium text-muted-foreground leading-tight">{feature.description}</div>
      {feature.link && (
        <div className="text-sm font-medium text-muted-foreground leading-tight">
          <a href={feature.link}>Learn more</a>
        </div>
      )}
    </div>
  )
}
