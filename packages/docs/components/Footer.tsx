'use client'
import Image from 'next/image'
import bgFooter from '@/public/images/landing/bgFooter.svg'
import footerBlueGlow from '@/public/images/landing/footerBlueGlow.svg'
import footerWordmark from '@/public/images/landing/footerWordmark.svg'
import footerWordmarkGlow from '@/public/images/landing/footerWordmarkGlow.svg'
import { discordIcon, githubIcon, starIcon } from './Icons'
import React from 'react'
import Link from 'next/link'
import { scrollToId } from '@/utils'
import SectionAppearAnimation from './SectionAppearAnimation'
import { GITHUB_LINK, DISCORD_HANDLE } from '@/utils/constants'
import { useGithubStars } from '@/hooks/useGithubStars'
import ModalCTA from './ModalCTA'

const SocialLinks: React.FC = () => {
  const stars = useGithubStars()
  return (
    <div className="flex w-full flex-col gap-[26px]">
      <p className="gradient-text-white font-tasa text-[28px] font-semibold">Join our community</p>
      <div className="w-fit">
        {/**
         * Discord Link
         *
         **/}
        <Link
          href={DISCORD_HANDLE}
          target="_blank"
          className="flex cursor-pointer items-center gap-[16px] py-[8px] text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
        >
          {discordIcon} <p>Join our Discord</p>
        </Link>

        {/**
         * Github Link
         *
         **/}
        <Link
          href={GITHUB_LINK}
          target="_blank"
          className="flex cursor-pointer items-center gap-[16px] py-[8px] text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
        >
          {githubIcon} <p>Contribute on Github </p> <p className="max-sm:hidden">|</p>
          <div className="flex items-center gap-[6px] text-white max-sm:hidden">
            {starIcon} <p>{stars}</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

const HomePageLinks: React.FC = () => {
  type Props = {
    sectionId: string
    linkText: string
  }
  const SectionLink: React.FC<Props> = ({ sectionId, linkText }) => {
    return (
      <p
        onClick={() => scrollToId(sectionId)}
        className="cursor-pointer scroll-smooth text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
      >
        {linkText}
      </p>
    )
  }
  return (
    <div className="flex w-[400px] gap-[32px] max-lg:w-full max-lg:flex-col lg:shrink-0 lg:justify-between">
      <div className="flex w-fit flex-col items-end gap-[24px] max-lg:w-fit max-lg:items-start">
        <SectionLink sectionId="use-cases" linkText="Use Cases" />
        <SectionLink sectionId="integrations" linkText="Integrations" />
        <SectionLink sectionId="motia-cloud" linkText="Motia Cloud" />
      </div>
      <div className="flex w-fit flex-col items-end gap-[24px] max-lg:w-fit max-lg:items-start">
        <Link href="/docs" className="text-[16px] text-white/60 transition-colors ease-in-out hover:text-white">
          Documentation
        </Link>
        <ModalCTA variant="cloud" />
      </div>
    </div>
  )
}

{
  /**
   *
   *
   * MAIN COMPONENT
   *
   **/
}

export default function Footer() {
  return (
    <div className="relative flex w-full max-w-[1920px] justify-center">
      {/**
       *
       *
       * TOP GLOW
       *
       **/}
      <div className="pointer-events-none absolute top-[50px] z-0 flex h-[1px] w-full shrink items-center justify-center">
        <Image src={footerBlueGlow} alt="glow" className="w-full opacity-100" />
      </div>

      {/**
       *
       *
       * Content Container
       *
       **/}
      <div className="relative flex h-[624px] w-[96%] flex-col items-center justify-end rounded-t-[8px] px-[91px] pt-[160px] max-lg:pt-[0px] max-sm:px-[16px]">
        {/**
         *
         * Background
         *
         **/}
        <Image
          src={bgFooter}
          alt="Footer Background"
          className="absolute top-0 left-0 z-0 h-full w-full rounded-t-[8px] object-cover object-top"
        />
        {/**
         * BG Dots Tile
         *
         **/}
        <div className="tile-bg fade-bottom-large absolute top-0 h-full w-full rounded-[inherit] border-[1px] border-white/40 bg-[#18191D] opacity-60"></div>
        {/**
         *
         *
         * Links Container
         *
         **/}
        <div className="relative z-3 flex h-full w-[1200px] max-w-full flex-col justify-between">
          <div className="flex h-full w-full gap-[26px] max-lg:flex-col max-lg:justify-center">
            <SocialLinks />
            <HomePageLinks />
          </div>
          {/**
           *
           *
           * WORDMARK LOGO
           *
           */}
          <div className="relative w-full">
            <SectionAppearAnimation initialY={20}>
              <Image src={footerWordmark} className="object-contain object-bottom" alt="wordmark" />
            </SectionAppearAnimation>
          </div>
        </div>
        {/**
         *
         *
         * Glow near logo
         *
         */}
        <Image
          src={footerWordmarkGlow}
          alt="glow"
          className="pointer-none: absolute right-0 bottom-0 h-full w-[40%] min-w-[290px] object-contain object-right-bottom"
        />
      </div>
    </div>
  )
}
