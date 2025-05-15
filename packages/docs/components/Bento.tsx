'use client'
import React from 'react'
import Image from 'next/image'
import bentoSectionTitleIcon from '@/public/images/landing/bentoSectionTitleIcon.png'
import SectionAppearAnimation from './SectionAppearAnimation'
import Title from './Title'
import { TextAppearBlur } from './TextAnimations'
import CodeFirst from './CodeFirst'
import ChooseLanguage from './ChooseLanguage'
import TestAndDeploy from './TestAndDeploy'
import AIReady from './AIReady'
import StateAndLogging from './StateAndLogging'

const BentoLayout: React.FC = () => (
  <div className="w-full max-w-[1200px] max-xl:p-[24px]">
    {/**
     *
     * Title and Header Icon
     *
     */}
    <div className="flex flex-col gap-[20px] max-lg:items-center">
      <SectionAppearAnimation>
        <Image src={bentoSectionTitleIcon} alt="Features" />
      </SectionAppearAnimation>
      <Title className="w-[650px] max-w-full max-lg:text-center max-md:w-[470px]">
        Power of real code with simplicity of a visual tool
      </Title>
      <p className="w-[600px] max-w-full text-[16px] text-white opacity-60 max-lg:text-center">
        <TextAppearBlur delay={0.25}>
          Write in any language. Automate anything. From AI agents to backend automation, Motia runs event-driven
          workflows with zero overhead.
        </TextAppearBlur>
      </p>
    </div>
    {/**
     *
     * Bento
     *
     */}
    <div className="flex flex-col items-center gap-[20px] pt-[80px]">
      <div className="flex w-[1200px] max-w-full gap-[20px] max-lg:w-[520px] max-lg:flex-col">
        {/* Card 1*/}
        <CodeFirst />

        {/* Card 2*/}
        <StateAndLogging />
      </div>

      <div className="flex w-[1200px] max-w-full gap-[20px] max-lg:w-[520px] max-lg:flex-col">
        {/* Card 3*/}
        <ChooseLanguage />
        {/* Card 4*/}
        <TestAndDeploy />
        {/* Card 5*/}
        <AIReady />
      </div>
    </div>
  </div>
)

export default BentoLayout
