'use client'

import React from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'

interface RiveAnimationProps {
  /** Path under public/, e.g. '/animations/yourAnimation.riv' */
  src?: string
  /** Auto-play on load */
  autoplay?: boolean
  /** Tailwind classes for sizing */
  className?: string
  alignment?: Alignment
  fit?: Fit
}

const RiveAnimation: React.FC<RiveAnimationProps> = ({
  src = '/rive/motiaBeam.riv',
  autoplay = true,
  className = 'w-full',
  alignment = Alignment.BottomLeft,
  fit = Fit.Cover,
}) => {
  const { RiveComponent } = useRive({
    src,
    autoplay,
    stateMachines: 'State Machine 1',
    layout: new Layout({
      fit: fit,
      alignment: alignment,
    }),
    onLoadError: (e) => console.log(e),
    onLoad: () => console.log('LOADED RIVE'),
  })

  return (
    <div className={className}>
      <RiveComponent />
    </div>
  )
}

export default RiveAnimation
