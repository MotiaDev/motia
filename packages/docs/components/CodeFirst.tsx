import React from 'react'
import { BentoCard, CardText } from './BentoCard'
import RiveAnimation from './RiveAnimation'
import { Alignment, Fit } from '@rive-app/react-webgl2'
import bgBento1 from '@/public/images/landing/bgBento1.webp'

export default function CodeFirst() {
  return (
    <div className="w-full overflow-clip rounded-[12px] lg:h-[480px] lg:basis-1/3">
      <BentoCard bg={bgBento1} stroke="bento1-stroke">
        <div className="fade-bottom aspect-square max-h-[330px] w-full shrink">
          <RiveAnimation
            src="/rive/bento1.riv"
            className="h-full w-full"
            fit={Fit.Contain}
            alignment={Alignment.TopCenter}
          />
        </div>
        <CardText
          title="Code-first agents, APIs & automations"
          subtitle="Fully-featured, event driven backend framework"
        />
      </BentoCard>
    </div>
  )
}
