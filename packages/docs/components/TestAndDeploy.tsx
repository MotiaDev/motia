import React from 'react'
import { BentoCard, CardText } from './BentoCard'
import RiveAnimation from './RiveAnimation'
import { Alignment, Fit } from '@rive-app/react-webgl2'
import bgBento4 from '@/public/images/landing/bgBento4.webp'

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
          subtitle="Ensure robust test coverage with E2E, integration and unit test at the workflow or step level"
        />
      </BentoCard>
    </div>
  )
}
