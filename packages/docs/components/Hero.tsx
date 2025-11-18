import { Alignment, Fit } from '@rive-app/react-webgl2'
import Image from 'next/image'
import bgHeroDashboard from '@/public/images/landing/bgHeroDashboard.png'
import heroBackgroundRays from '@/public/images/landing/heroBackgroundRays.svg'
import motiaCode from '@/public/images/landing/motiaHeroCode.webp'
import smoke from '@/public/images/landing/smoke.webp'
import CopyNPX from './CopyNpx'
import ModalCTA from './ModalCTA'
import ParticlesBackground from './Particles'
import RiveAnimation from './RiveAnimation'
import { ScaleAnimation } from './ScaleAnimation'
import SectionAppearAnimation from './SectionAppearAnimation'
import Title from './Title'

export default function Hero() {
  return (
    <div className="relative flex w-full max-w-[1200px] gap-[40px] pb-[60px] max-lg:flex-col max-lg:gap-0">
      {/* Title Section and CTAs */}
      <div className="relative z-2 max-w-full pt-[240px] pl-[16px] max-lg:p-[24px] max-lg:pt-[100px] max-lg:pb-0">
        {/* Title and Subtitle */}
        <SectionAppearAnimation className="flex w-[590px] flex-col gap-[20px] max-lg:max-w-full">
          <Title>Build production-grade backends with a single primitive</Title>

          <p className="w-[520px] max-w-full text-[17px] font-light text-white opacity-80">
            Modern backends shouldn&apos;t require juggling frameworks, queues, and services. Motia is a{' '}
            <span className="font-bold">unified framework</span> that combines{' '}
            <span className="font-bold">API endpoints, background jobs, durable workflows, AI agents, streaming, and observability</span>{' '}
            with a single core primitive. All{' '}
            <span className="font-bold">written in any language</span>, with built-in{' '}
            <span className="font-bold">state management</span>.
          </p>
        </SectionAppearAnimation>
        {/* CTAs */}
        <SectionAppearAnimation delay={0.5}>
          <div className="mt-[60px] flex w-fit max-w-full flex-wrap-reverse items-center justify-center gap-[16px] max-md:w-full max-sm:mt-[30px] md:gap-[8px]">
            <CopyNPX />
            <ModalCTA variant="secondary" text="Sign up for Motia Cloud Beta" />
          </div>
        </SectionAppearAnimation>
      </div>
      {/* Rive animation and smoke effect */}
      <div className="flex h-screen max-h-[1000px] w-full flex-col items-end mask-r-from-white mask-r-from-90% mask-r-to-transparent max-lg:items-start max-lg:pl-[16px]">
        <div className="relative -mb-[26px] flex h-[200px] w-full shrink-0 justify-start max-lg:h-[60px]">
          <SectionAppearAnimation
            initialY={20}
            delay={0.5}
            className="absolute z-1 w-full max-lg:hidden max-sm:justify-center max-sm:mix-blend-plus-lighter sm:pl-[11.25%]"
          >
            <video
              autoPlay
              playsInline
              muted
              className="absolute top-0 left-[7.5%] -z-2 h-[200px] w-[150px] max-sm:right-auto max-sm:left-auto max-sm:h-[120px]"
            >
              <source
                src="/rive/beam_video.webm"
                type="video/webm"
                className="h-full w-full object-cover object-center"
              />
            </video>
            {/* <RiveAnimation className="absolute top-0 left-[7.5%] -z-2 h-[200px] w-[150px] max-sm:right-auto max-sm:left-auto max-sm:h-[120px]" /> */}
            <ParticlesBackground />
          </SectionAppearAnimation>
          <div className="-z-0 grow bg-black">
            <Image
              priority={true}
              src={heroBackgroundRays}
              alt={'glow'}
              className="absolute top-0 right-0 min-w-[200%] bg-black max-sm:-top-[15vh] sm:min-w-[140%]"
            />
            <div className="pointer-events-none absolute -top-[15vh] left-0 h-12 w-full bg-gradient-to-b from-black to-transparent lg:hidden"></div>
            <ScaleAnimation className="fade-bottom absolute -top-[40%] right-0 min-w-[50%] rotate-45 opacity-50 mix-blend-soft-light max-lg:w-[200px] max-sm:-top-[15vh] max-sm:w-full">
              <Image priority={true} src={smoke} alt={'smoke'} />
            </ScaleAnimation>
            <ScaleAnimation className="fade-bottom absolute top-[30%] -left-[30%] min-w-[50%] -rotate-90 opacity-50 mix-blend-soft-light max-sm:top-0 max-sm:w-full">
              <Image priority={true} src={smoke} alt={'smoke'} />
            </ScaleAnimation>
          </div>
        </div>
        <div className="fade-bottom relative z-1 flex w-[50vw] max-w-[1000px] overflow-hidden max-lg:w-full max-md:h-[100vh] xl:h-[65vh]">
          <Image
            layout="responsive"
            priority={true}
            placeholder="blur"
            className="fade-right absolute top-0 left-0 w-full rounded-t-[10px] bg-black object-cover object-top-left max-2xl:min-w-[60vw] max-md:min-h-[600px] 2xl:max-w-[1000px]"
            src={bgHeroDashboard}
            alt={'hero'}
          />
          <div className="relative flex h-full w-full items-start gap-y-[20px] px-8 pt-[90px] max-md:flex-col max-md:pt-[60px] lg:justify-between 2xl:max-w-[1000px]">
            <Image
              width={500}
              priority={true}
              className="w-full max-w-[380px] object-contain object-top-left"
              src={motiaCode}
              alt="Code Snippet"
            />
            <RiveAnimation
              className="fade-right aspect-[350/489] max-h-[600px] w-full max-w-[500px] grow"
              src="/rive/motiaHero.riv"
              fit={Fit.Cover}
              alignment={Alignment.TopLeft}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
