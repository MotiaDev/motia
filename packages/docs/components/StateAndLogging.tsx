'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type React from 'react'
import bento2Glow from '@/public/images/landing/bento2Glow.svg'
import bgBento2 from '@/public/images/landing/bgBento2.webp'
import statsLogsGif from '@/public/images/landing/Stats&logs-GIF.gif'
import stateLoggingDefault from '@/public/images/landing/stateandlogsbg.png'
import { BentoCard, CardText } from './BentoCard'

const transition = { type: 'spring' as const, bounce: 0, duration: 0.6 }
const childVariants = {
  logsTab: {
    initial: { opacity: 0 },
    hover: { opacity: 1, y: 0 },
    transition,
  },
  codeScreen: { initial: { filter: 'blur(0)' }, hover: { filter: 'blur(2px)' }, transition },
  dashboardStroke: { initial: { opacity: 1 }, hover: { opacity: 1 }, transition },
  dashboard: {
    initial: { y: 0 },
    hover: { y: -60 },
    transition,
  },
}
const loggerStyle: React.CSSProperties = {
  boxShadow:
    '0px -251px 70px 0px rgba(0, 0, 0, 0.02), 0px -160px 64px 0px rgba(0, 0, 0, 0.14), 0px -90px 54px 0px rgba(0, 0, 0, 0.47), 0px -40px 40px 0px rgba(0, 0, 0, 0.80), 0px -10px 22px 0px rgba(0, 0, 0, 0.92)',
  background: 'linear-gradient(180deg, rgba(12, 12, 16, 0.80) 29.08%, rgba(0, 0, 0, 0.80) 100%)',
}
export default function StateAndLogging() {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className="overflow-clip rounded-[12px] max-lg:w-full lg:h-[480px] lg:basis-2/3"
    >
      <BentoCard bg={bgBento2} stroke="bento2-stroke">
        <div className="fade-bottom relative h-full w-full overflow-hidden p-[28px] pb-0 max-md:p-[12px]">
          <motion.div variants={childVariants.codeScreen} className="w-full">
            <Image width={800} src={stateLoggingDefault} alt="Logging Dashboard" className="w-full backdrop-blur-xl" />
          </motion.div>

          <motion.div
            variants={childVariants.dashboard}
            transition={transition}
            className="relative mt-[-20%] h-full w-full p-[10px]"
          >
            <motion.p
              variants={childVariants.logsTab}
              transition={transition}
              className="font-tasa relative z-1 mb-[8px] w-fit rounded-[14px] bg-white px-[18px] py-[6px] text-[10px] font-semibold text-black max-md:!opacity-100"
            >
              Logs
            </motion.p>
            <div
              className="fade-bottom w-full overflow-clip rounded-[12px] border-[1px] border-white/20 backdrop-blur-md"
              style={loggerStyle}
            >
              <Image src={bento2Glow} alt="Background Glow" className="absolute top-0 left-0 z-0" />
              <motion.div transition={transition} variants={childVariants.dashboardStroke} className="relative w-full">
                <Image src={statsLogsGif} alt="Stats and Logs Animation" className="w-full" />
              </motion.div>
            </div>
          </motion.div>
        </div>
        <CardText
          title="Observability baked-in"
          subtitle="Motia workbench comes with a built-in observability tool to help you track and visualize all your steps, events, and state changes. See exactly what happened after an endpoint is triggered, all the subsequent steps that were emitted, track the time it took to execute each step, and more."
        />
      </BentoCard>
    </motion.div>
  )
}
