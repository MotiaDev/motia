import { BentoCard, CardText } from './BentoCard'
import bgBento5 from '@/public/images/landing/bgBento5.webp'
import bento5 from '@/public/images/landing/bento5.webp'
import Image from "next/legacy/image"
import { ParticlesBento } from './Particles'

export default function AIReady() {
  return (
    <div className="w-full overflow-clip rounded-[12px] lg:h-[480px] lg:basis-1/3">
      <BentoCard bg={bgBento5} stroke="bento5-stroke">
        <div className="fade-bottom relative w-full shrink p-[10px] lg:max-h-[330px]">
          <Image src={bento5} alt="AI Ready" className="object-fit object-center" />
          <div className="pointer-events-none absolute bottom-0 h-full w-full">
            <ParticlesBento />
          </div>
        </div>
        <CardText
          title="AI-Ready Workflows"
          subtitle="Plug into 400k+ Python packages and 2M+ npm modules"
          textBoxWidth="w-[280px]"
        />
      </BentoCard>
    </div>
  )
}
