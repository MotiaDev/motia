'use client'
import Image from 'next/image'
import type React from 'react'
import bentoSectionTitleIcon from '@/public/images/landing/bentoSectionTitleIcon.png'
import AIReady from './AIReady'
import ChooseLanguage from './ChooseLanguage'
import CodeFirst from './CodeFirst'
import SectionAppearAnimation from './SectionAppearAnimation'
import StateAndLogging from './StateAndLogging'
import TestAndDeploy from './TestAndDeploy'
import { TextAppearBlur } from './TextAnimations'
import Title from './Title'

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
        Create workflows with the simplicity of Motia Steps
      </Title>
      <p className="w-[600px] max-w-full text-[17px] text-white opacity-60 max-lg:text-center">
        <TextAppearBlur delay={0.25}>
          API Endpoints, Events, Cron Jobs are all represented by a step each written in the language you need. Connect
          steps to create powerful workflows.
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
