'use client'

import Image from 'next/image'
import type React from 'react'
import bgCloudCard1 from '@/public/images/landing/bgCloudCard1.svg'
import bgMotiaCloud from '@/public/images/landing/bgMotiaCloud.svg'
import motiaCloudFlow from '@/public/images/landing/motiaCloudFlow.webp'
import motiaCloudHeading from '@/public/images/landing/motiaCloudHeading.svg'
import motiaCloudNavLinks from '@/public/images/landing/motiaCloudNavLinks.svg'
import motiaCloudNavSettings from '@/public/images/landing/motiaCloudNavSettings.png'
import logoFull from '@/public/images/logoFull.png'
import { chevronRightCircle, liveCircle } from './Icons'
import ModalCTA from './ModalCTA'
import RiveAnimation from './RiveAnimation'
import SectionAppearAnimation from './SectionAppearAnimation'

const chevronDownIcon = (
  <svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0.5L5.5 5.5L1 0.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/***
 *
 * Dashboard background Navbar
 *
 */
const MotiaNav: React.FC = () => {
  return (
    <div className="flex h-[42px] w-full shrink-0 items-center justify-between rounded-t-[12px] border-b-[1px] border-b-blue-50/20 px-[26px]">
      <div className="flex gap-[32px]">
        <Image width={64} src={logoFull} alt="Motia Logo" className="w-[64px] object-contain" />
        <Image src={motiaCloudNavLinks} alt="Motia Dashboard Mockup" className="h-[45px] max-md:hidden" />
      </div>

      <div className="flex items-center justify-end space-x-[10px] text-[12px] tracking-[0.36px] text-white/40">
        <Image src={motiaCloudNavSettings} alt="Motia Dashboard Mockup Settings" className="w-[110px] max-w-full" />
      </div>
    </div>
  )
}

/***
 *
 * Dropdown UI Element
 *
 */
type DropdownProps = {
  children: React.ReactNode
  className?: string
}
const DropDown: React.FC<DropdownProps> = ({ children, className }) => {
  return (
    <div
      className={`flex w-fit items-center gap-[8px] rounded-[3px] bg-[rgba(255,255,255,0.08)] px-[10px] py-[8px] ${className}`}
    >
      {children}
    </div>
  )
}

/***
 *
 * Bento Cards Layout
 *
 */
type CardProps = {
  children: React.ReactNode
  className?: string
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <SectionAppearAnimation className={`rounded-[8px] border-[0.8px] border-white/15 ${className} overflow-hidden`}>
      {children}
    </SectionAppearAnimation>
  )
}

/***
 *
 * Bento Cards
 *
 */

const CardFlow: React.FC = () => {
  return (
    <Card className="relative flex h-[full] min-h-[235px] w-full items-end justify-center max-md:h-fit md:max-w-[356px]">
      <Image src={bgCloudCard1} alt="bg explorer" className="absolute top-0 left-0 h-full w-full object-cover" />
      <Image
        src={motiaCloudFlow}
        alt="Motia Cloud Flow"
        className="object-fit relative h-[235px] w-auto object-bottom max-md:h-[330px]"
      />
    </Card>
  )
}

const CardDetails: React.FC = () => {
  return (
    <Card className="w-full px-[22px] pt-[22px] pb-[25px]">
      <div className="flex flex-col gap-[28px]">
        <div className="flex flex-col gap-[8px]">
          <p className="text-[12px] leading-none font-medium text-white/40">Development</p>
          <p className="text-[12px] leading-none font-light text-white/90">Version 1.0.13</p>
        </div>

        <div className="flex flex-col gap-[8px]">
          <p className="text-[12px] leading-none font-medium text-white/40">Status</p>
          <div className="flex items-center gap-[8px]">
            {liveCircle}
            <p className="text-[12px] leading-none font-light text-white/90">Ready</p>
          </div>
        </div>

        <div className="flex flex-col gap-[8px]">
          <p className="text-[12px] leading-none font-medium text-white/40">Created On</p>
          <p className="text-[12px] leading-none font-light text-white/90">
            06:30 pm <span className="px-[16px] text-white/25">|</span> Sept 12 2025
          </p>
        </div>

        <DropDown className="text-[12px] text-white">Mark As Spam {chevronDownIcon}</DropDown>
      </div>
    </Card>
  )
}

const CardInvocations: React.FC = () => {
  return (
    <Card className="flex h-[208px] w-full flex-col bg-[rgba(186,183,255,0.06)] max-md:h-fit">
      <div className="px-[14px] pt-[16px]">
        <p className="text-[12px] leading-none font-light text-white/90"> Invocations</p>
        <div className="mt-[8px] w-fit rounded-[60px] bg-[rgba(137,255,105,0.10)] px-[8px] py-[6px] text-[12px] leading-[0.9em] font-medium text-[#00FF38]">
          +15%
        </div>
      </div>
      <RiveAnimation className="w-full max-md:h-[calc(45vw)] md:h-[170px]" src={'/rive/motiaCloudGraphBlue.riv'} />
    </Card>
  )
}
const CardStateUsage: React.FC = () => {
  return (
    <Card className="flex h-[208px] w-full flex-col bg-[rgba(186,183,255,0.06)] max-md:h-fit">
      <div className="px-[14px] pt-[16px]">
        <p className="text-[12px] leading-none font-light text-white/90"> State Usage</p>
        <div className="mt-[8px] w-fit rounded-[60px] bg-[rgba(137,255,105,0.10)] px-[8px] py-[6px] text-[12px] leading-[0.9em] font-medium text-[#00FF38]">
          +0.05%
        </div>
      </div>
      <RiveAnimation className="w-full max-md:h-[calc(45vw)] md:h-[174px]" src={'/rive/motiaCloudGraphYellow.riv'} />
    </Card>
  )
}

const CardStats: React.FC = () => {
  return (
    <Card className="flex h-[208px] w-full flex-col gap-[18px] bg-[rgba(186,183,255,0.06)] px-[18px] py-[21px]">
      <div className="flex w-full justify-between">
        <p className="text-[14px] leading-none font-medium text-white"> API</p>
        <p className="text-[14px] leading-none font-medium text-white/40"> 04</p>
      </div>
      {/**Divider */}
      <div className="h-[1px] w-full bg-white/15"></div>
      <div className="flex w-full justify-between">
        <p className="text-[14px] leading-none font-medium text-white"> Event</p>
        <p className="text-[14px] leading-none font-medium text-white/40"> 16</p>
      </div>
      {/**Divider */}
      <div className="h-[1px] w-full bg-white/15"></div>
      <div className="flex w-full justify-between">
        <p className="text-[14px] leading-none font-medium text-white"> Cron</p>
        <p className="text-[14px] leading-none font-medium text-white/40"> 24</p>
      </div>
    </Card>
  )
}

/***
 *
 * MAIN RETURN FUNCTION
 *
 */
export default function MotiaCloud() {
  return (
    <div id="motia-cloud" className="w-full max-w-[1200px] px-[16px] max-md:pt-[80px]">
      <SectionAppearAnimation>
        <Image priority={true} src={motiaCloudHeading} className="mx-auto w-[990px] max-w-[full]" alt="Motia Cloud" />
      </SectionAppearAnimation>

      <div className="relative w-full">
        {/*
         * *Background
         *
         */}
        <Image src={bgMotiaCloud} alt="bg explorer" className="motia-cloud-shadow absolute top-0 left-0 w-full" />
        {/**
         *
         * Dashboard Layout
         *
         * */}
        <div className="relative flex h-full w-full flex-col items-center rounded-[12px] p-[1px] pt-[2px] pr-[2px]">
          <MotiaNav />
          <div className="h-full w-full max-w-[944px] px-[16px] pt-[45px] pb-[80px]">
            {/**
             *
             * Header Title
             *
             * */}
            <div className="flex w-full items-center justify-between">
              <p className="text-[18px] tracking-[0.65px] text-white/60">
                <span className="font-medium text-white">Automation</span>/Gmail Manager
              </p>
              <DropDown>
                <p className="leading-[1em] font-light text-white">Logs</p>
                <div> {chevronDownIcon}</div>
              </DropDown>
            </div>
            {/**
             *
             * Bento First row with Flow and Log Data
             *
             * */}
            <div className="flex w-full gap-[16px] pt-[20px] max-md:flex-col">
              <CardFlow />
              <CardDetails />
            </div>
            {/**
             *
             * Divider
             *
             * */}
            <div className="mt-[60px] mb-[32px] h-[1px] w-full bg-white/15"></div>
            {/**
             *
             * Bento Second row with graphs
             *
             * */}
            <div className="flex w-full items-end gap-[20px]">
              <div className="flex w-full items-center gap-[20px]">
                <p className="text-[18px] font-medium tracking-[0.65px] text-white">Analytics</p>
                <DropDown className="text-[14px]">
                  <p className="leading-[1em] font-light text-white">Today</p>
                  <div> {chevronDownIcon}</div>
                </DropDown>
              </div>
              <div className="w-full"></div>
              <div className="w-full">
                <p className="text-[18px] font-medium tracking-[0.65px] text-white max-md:hidden">Steps</p>
              </div>
            </div>

            <div className="flex w-full items-center gap-[16px] pt-[20px] max-md:flex-col">
              <CardInvocations />
              <CardStateUsage />
              <CardStats />
            </div>
          </div>
          <ModalCTA variant="primary" text="Get early access to Motia Cloud" icon={chevronRightCircle} />
        </div>
      </div>
    </div>
  )
}
