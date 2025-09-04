'use client'
import Image from 'next/image'
import background from '@/public/images/landing/backgroundLogoSlider.webp'
import superchargeAgentsIcon from '@/public/images/landing/superChargeAgentsIcon.png'
import { superchargeAgentsHeaderGraphic } from './Icons'
import InfiniteLogoList from './InfiniteLogoList'
import SectionAppearAnimation from './SectionAppearAnimation'
import { TextAppearBlur } from './TextAnimations'
import Title from './Title'

export default function SuperchargeAI() {
  return (
    <div
      id="integrations"
      className="relative flex h-[1074px] w-full flex-col items-center overflow-hidden max-md:-mt-[20vh] max-md:h-screen max-md:justify-center"
    >
      <Image
        src={background}
        alt="background platform"
        width={1920}
        height={1080}
        className="pointer-events-none absolute right-auto left-auto -z-0 w-full max-w-[1440px] mask-b-from-80% mask-b-to-95% object-contain max-md:bottom-[5.5vh] md:top-0 md:h-full"
      />

      <div className="relative flex w-full flex-col items-center gap-[20px] px-[16px] pt-[180px] max-md:pt-0">
        <SectionAppearAnimation>
          <Image src={superchargeAgentsIcon} alt="Build with the tools you know and love icon" className="w-[100px]" />
        </SectionAppearAnimation>
        <Title className="text-center">Build with the tools you know and love</Title>
        <p className="w-[350px] max-w-full text-center text-[16px] font-light text-white opacity-60">
          <TextAppearBlur delay={0.25}>
            Integrate with the libraries you already use to build practical, scalable, and reliable solutions.
          </TextAppearBlur>
        </p>
        {superchargeAgentsHeaderGraphic}
      </div>

      <div className="relative w-screen">
        {/* Left fade */}
        <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-[10%] bg-gradient-to-r from-black/0 to-black/90" />

        {/* Right fade */}
        <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-[10%] bg-gradient-to-l from-black/0 to-black/90" />
        <InfiniteLogoList />
      </div>
    </div>
  )
}
