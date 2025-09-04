'use client'
import { AnimatePresence, motion, useScroll } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useGithubStars } from '@/hooks/useGithubStars'
import logoFull from '@/public/images/logoFull.png'
import { DISCORD_HANDLE, GITHUB_LINK } from '@/utils/constants'
import { discordIcon, githubIcon, starIcon } from '../Icons'
import ModalCTA, { ModalCTAVariants } from '../ModalCTA'

export default function Navbar() {
  //Hook for mobile navigation menu to open on clicking the hamburger
  const [isMenuOpen, setMenuOpen] = useState(false)

  //ScrollY offset to change the navbar to a background blur after user scrolls the page
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  //Hook to get live star count
  const { starCount, isLoading } = useGithubStars()

  //Set scroll value to triger the animation
  useEffect(() => {
    return scrollY.onChange((y) => {
      setScrolled(y > 100)
    })
  }, [scrollY])
  const HamburgerMenu: React.FC = () => {
    return (
      <button
        onClick={() => setMenuOpen(!isMenuOpen)}
        className="h-[40px] w-[40px] rounded-[4px] bg-white/10 p-[10px] md:hidden"
      >
        <div className="flex h-full w-full flex-col items-end justify-center space-y-[5px]">
          <motion.div
            className="h-[1.5px] w-[80%] bg-white"
            animate={isMenuOpen ? { width: '100%', rotate: 45, y: 7 } : { width: '80%', rotate: 0, y: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="h-[1.5px] w-full bg-white"
            animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="h-[1.5px] w-[50%] bg-white"
            animate={isMenuOpen ? { width: '100%', rotate: -45, y: -6 } : { width: '50%', rotate: 0, y: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </button>
    )
  }
  return (
    <motion.div
      transition={{ type: 'tween', duration: 0.3 }}
      initial={{ y: -20, opacity: 0 }} // start slightly above
      animate={{
        y: 0,
        opacity: 1,
        backdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
      }}
      className="fixed top-0 z-30 flex w-full justify-center border-b-[1px] border-white/20"
    >
      {/**
       *
       *
       * MOBILE MENU
       *
       *
       *
       * */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ ease: 'easeIn', duration: 0.3 }}
            className="fixed z-1 h-screen w-screen bg-black/80"
          >
            <div onClick={() => setMenuOpen(false)} className="absolute top-0 left-0 h-full w-full"></div>

            <div className="relative flex w-full flex-col gap-[8px] border-b-[1px] border-white/20 bg-black px-[16px] pt-[100px] pb-[18px]">
              {/**
               * Blog Link
               *
               **/}
              <div className="flex w-full flex-col gap-[16px] border-b-[1px] border-white/20 pb-[28px]">
                <Link href="https://blog.motia.dev" target="_blank" className="text-[16px] text-white">
                  Blog
                </Link>
                {/**
                 * Docs Link
                 *
                 **/}
                <Link href="/docs" className="text-[16px] text-white">
                  Docs
                </Link>
                {/**
                 * Manifesto Link
                 *
                 **/}
                <Link href="/manifesto" className="text-[16px] text-white">
                  Manifesto
                </Link>
                {/**
                 * Motia Cloud Sign up
                 *
                 **/}
                <ModalCTA variant={ModalCTAVariants.CLOUD_NAVBAR} />
              </div>

              <div className="flex w-fit flex-col gap-[8px]">
                {/**
                 * Vercel OSS Link
                 **/}
                <Link
                  href="https://vercel.com/blog/summer-2025-oss-program#motia"
                  target="_blank"
                  className="vercel-oss-button gap-2"
                >
                  <svg aria-label="Vercel logomark" height="15" role="img" viewBox="0 0 74 64" className="fill-current">
                    <path d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z" fill="white"></path>
                  </svg>
                  Vercel OSS 2025
                </Link>
                {/**
                 * Discord Link
                 *
                 **/}
                <Link
                  href={DISCORD_HANDLE}
                  target="_blank"
                  className="flex cursor-pointer items-center gap-[16px] py-[8px] text-[16px] text-white"
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
                  className="flex cursor-pointer items-center gap-[16px] py-[8px] text-[16px] text-white"
                >
                  {githubIcon} <p>Contribute on Github </p> <p className="max-md:hidden">|</p>
                  <div className="flex items-center gap-[6px] text-white max-md:hidden">
                    {starIcon}
                    <p>{isLoading ? <span className="inline-block animate-pulse">----</span> : starCount || '----'}</p>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/**
       *
       *
       * DESKTOP MENU
       *
       *
       *
       * */}
      <nav className="z-2 flex w-full max-w-[1200px] items-center justify-between py-[18px] max-xl:px-[16px] max-sm:border-b-[1px] max-sm:border-white/20 max-sm:py-[11px]">
        <div className="flex items-center gap-[54px]">
          <div className="flex w-[94px] flex-col">
            <Link href="/" aria-label="Go To Home">
              {' '}
              <Image priority src={logoFull} alt="Motia Logo" />
            </Link>

            <div className="relative bottom-[-24px] flex items-center gap-[4px]">
              <div className="h-[2px] w-[24px] bg-[#088CFF]"></div>
              <div className="h-[2px] grow bg-white"></div>
            </div>
          </div>
          <div className="flex gap-[24px] max-md:hidden">
            {/**
             * Blog Link
             *
             **/}
            <Link
              href="https://blog.motia.dev"
              target="_blank"
              className="text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
            >
              Blog
            </Link>
            {/**
             * Docs Link
             *
             **/}
            <Link href="/docs" className="text-[16px] text-white/60 transition-colors ease-in-out hover:text-white">
              Docs
            </Link>
            {/**
             * Manifesto Link
             *
             **/}
            <Link
              href="/manifesto"
              className="text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
            >
              Manifesto
            </Link>
            {/**
             * Motia Cloud Sign up
             **/}
            <ModalCTA variant={ModalCTAVariants.CLOUD_NAVBAR} />
          </div>
        </div>

        <div className="flex items-center gap-[14px] max-md:gap-[4px]">
          {/**
           * Vercel OSS Link - Desktop Only
           **/}
          <Link
            href="https://vercel.com/blog/summer-2025-oss-program#motia"
            target="_blank"
            className="vercel-oss-button inline-flex items-center gap-2 max-md:hidden mr-3 leading-none"
          >
            <svg
              aria-label="Vercel logomark"
              height="12"
              role="img"
              viewBox="0 0 74 64"
              className="fill-current block m-0 p-0"
            >
              <path d="M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z" fill="white"></path>
            </svg>
            <span className="max-lg:hidden">Vercel OSS 2025</span>
          </Link>
          {/**
           * Discord Link
           *
           **/}
          <Link
            aria-label="Visit Discord"
            href={DISCORD_HANDLE}
            target="_blank"
            className="flex cursor-pointer items-center gap-[16px] text-[16px] text-white/60 transition-colors ease-in-out hover:text-white max-md:hidden"
          >
            {discordIcon}
          </Link>

          {/**
           * Github Link
           *
           **/}
          <Link
            href={GITHUB_LINK}
            target="_blank"
            className="font-tasa flex cursor-pointer items-center gap-[16px] rounded-[4px] border-[1px] border-white/20 bg-black/40 px-[8px] py-[4px] text-[16px] font-medium tracking-wider text-white transition-colors ease-in-out hover:text-white max-sm:gap-[8px] max-sm:py-[8px] max-sm:text-[14px]"
          >
            {githubIcon}
            <p className="sm:-ml-[8px] max-lg:hidden">Github </p>
            <p className="text-white/40 max-lg:hidden">|</p>
            <div className="flex items-center gap-[6px] text-white">
              {starIcon}
              <p>{isLoading ? <span className="inline-block animate-pulse">----</span> : starCount || '----'}</p>
            </div>
          </Link>
          <HamburgerMenu />
        </div>
      </nav>
    </motion.div>
  )
}
