import React from 'react'
import bgBento3 from '@/public/images/landing/bgBento3.webp'
import { BentoCard, CardText } from './BentoCard'
import RiveAnimation from './RiveAnimation'
import { Alignment, Fit } from '@rive-app/react-webgl2'

export default function ChooseLanguage() {
  return (
    <div className="w-full overflow-clip rounded-[12px] lg:h-[480px] lg:basis-1/3">
      <BentoCard bg={bgBento3} stroke="bento1-stroke">
        <div className="fade-bottom aspect-square max-h-[330px] w-full shrink">
          <RiveAnimation
            src="/rive/bento3.riv"
            className="h-full w-full"
            fit={Fit.Contain}
            alignment={Alignment.TopCenter}
          />
        </div>
        <CardText
          title="Choose the best language "
          subtitle="Write and connect steps in Python, TypeScript, JavaScript or Ruby"
        />
      </BentoCard>
    </div>
  )
}
