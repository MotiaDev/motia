'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import RiveAnimation from './RiveAnimation'
import motiaPlaque from '@/public/images/landing/motiaPlaque.webp'
import { Alignment, Fit } from '@rive-app/react-webgl2'
import Title from './Title'
import SectionAppearAnimation from './SectionAppearAnimation'
import { useState } from 'react'
import ModalForm from './Modal'
import smoke from '@/public/images/landing/smoke.webp'
import ctaSectionGlow from '@/public/images/landing/ctaSectionGlow.svg'
import ModalCTA from './ModalCTA'
import CopyNPX from './CopyNpx'

type Ray = {
  delay?: number
}
const Ray: React.FC<Ray> = ({ delay = 0 }) => {
  return (
    <div className="mt flex h-[115px] w-[2px] justify-center bg-white/30">
      <motion.div
        initial={{ y: 150 }}
        animate={{ y: -150 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
          delay: delay,
        }}
        className="fade-bottom-large h-[50px] w-[1px] rotate-180 bg-white"
      ></motion.div>
    </div>
  )
}
export default function CTASection() {
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="relative flex w-full flex-col items-center overflow-hidden bg-black pt-[100px] pb-[160px] max-md:pt-[0px]">
      <div className="absolute top-0 right-auto left-auto flex h-full w-full flex-col items-center justify-center">
        <div className="flex h-[1px] items-center pt-[160px] max-md:pt-[120px] max-sm:pt-[0]">
          <Image
            style={{}}
            className="object-cover mix-blend-soft-light"
            width={900}
            src={smoke}
            alt="Background Smoke"
          />
        </div>
        <div className="flex h-[50vh] items-end max-md:h-[1px]">
          <Image width={1200} src={ctaSectionGlow} alt="Background Glow" />
        </div>
      </div>
      <ModalForm isOpen={isOpen} onClose={() => setOpen(false)} />
      <SectionAppearAnimation className="relative top-[175px] z-1 h-[150px] w-[150px] bg-black">
        <Image width={150} src={motiaPlaque} alt="Motia" />
      </SectionAppearAnimation>

      <SectionAppearAnimation className="fade-sides relative z-1 -mb-[25px] flex items-center mix-blend-plus-lighter">
        <RiveAnimation
          className="-mr-[20px] aspect-square h-[200px] max-w-full -rotate-90 mix-blend-plus-lighter max-sm:hidden"
          fit={Fit.Contain}
          alignment={Alignment.Center}
        />
        <div className="h-[150px] w-[150px] bg-black"></div>
        <RiveAnimation
          className="-ml-[20px] aspect-square h-[200px] max-w-full rotate-[90deg] mix-blend-plus-lighter max-sm:hidden"
          fit={Fit.Contain}
          alignment={Alignment.Center}
        />
      </SectionAppearAnimation>
      <SectionAppearAnimation initialY={-20} delay={0.35} className="fade-bottom-large flex gap-[6px]">
        <Ray delay={0.35} />
        <Ray delay={0.75} />
        <Ray delay={0.5} />
        <Ray delay={1} />
      </SectionAppearAnimation>
      <div className="flex w-full flex-col items-center px-[16px] text-center">
        <Title className="max-w-[792px]">Automate everything with Motia&apos;s framework</Title>
        <p className="w-full max-w-[440px] pt-[20px] text-[20px] text-white/60">
          Code in any language. Automate everything. From AI agents to backend ops, Motia runs event-driven workflows
          with zero overhead.
        </p>
      </div>
      {/* CTAs */}
      <SectionAppearAnimation
        className="z-2 mt-[60px] flex w-fit max-w-full flex-wrap-reverse items-center justify-center gap-[16px] px-[16px] max-md:w-full md:gap-[8px]"
        delay={0.35}
      >
        <CopyNPX />
        <ModalCTA variant="secondary" text="Join Beta" />
      </SectionAppearAnimation>
    </div>
  )
}
