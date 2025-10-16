import { Alignment, Fit } from '@rive-app/react-webgl2'
import React from 'react'
import bgBento4 from '@/public/images/landing/bgBento4.webp'
import { BentoCard, CardText } from './BentoCard'
import RiveAnimation from './RiveAnimation'

export default function TestAndDeploy() {
  return (
    <div className="w-full overflow-clip rounded-[12px] lg:h-[480px] lg:basis-1/3">
      <BentoCard bg={bgBento4} stroke="bento4-stroke">
        <div className="fade-bottom aspect-square max-h-[330px] w-full shrink">
          <RiveAnimation
            src="/rive/bento4.riv"
            className="fade-bottom h-full w-full"
            fit={Fit.Cover}
            alignment={Alignment.TopLeft}
          />
        </div>
        <CardText
          title="Test & deploy with confidence"
          subtitle="Test any workflow, any step: automate code, APIs, and agents with guaranteed quality at every layer."
        />
      </BentoCard>
    </div>
  )
}
