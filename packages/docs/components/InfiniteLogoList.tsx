'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

import sheets from '@/public/images/landing/sheets.png'
import discord from '@/public/images/landing/discord.png'
import outlook from '@/public/images/landing/outlook.png'
import telegram from '@/public/images/landing/telegram.png'
import openai from '@/public/images/landing/openai.png'
import slack from '@/public/images/landing/slack.png'
import trello from '@/public/images/landing/trello.png'
import drive from '@/public/images/landing/drive.png'
import asana from '@/public/images/landing/asana.png'
import googleCalendar from '@/public/images/landing/calendar.png'
import salesforce from '@/public/images/landing/salesforce.png'
import mailchimp from '@/public/images/landing/mailchimp.png'
import bubble from '@/public/images/landing/bubbleio.png'
import gemini from '@/public/images/landing/gemini.png'
import airtable from '@/public/images/landing/airtable.png'

const logos = [
  sheets,
  discord,
  outlook,
  telegram,
  openai,
  slack,
  trello,
  drive,
  asana,
  googleCalendar,
  salesforce,
  mailchimp,
  bubble,
  gemini,
  airtable,
]

const logoContainerStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  background: '#fff',
  borderRadius: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow:
    '0px 57px 16px 0px rgba(0, 1, 31, 0.00), 0px 37px 15px 0px rgba(0, 1, 31, 0.02), 0px 21px 12px 0px rgba(0, 1, 31, 0.06), 0px 9px 9px 0px rgba(0, 1, 31, 0.11), 0px 2px 5px 0px rgba(0, 1, 31, 0.13)',
  backdropFilter: 'blur(10px)',
}

export default function InfiniteLogoList() {
  const SCROLL_STEP = 100 // logo + gap
  const loopedLogos = [...logos, ...logos, ...logos] // Make sure it's long enough for seamless looping

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        className="flex w-max gap-[28px]"
        animate={{
          x: ['0%', `-${logos.length * SCROLL_STEP}px`],
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
          duration: 20,
        }}
      >
        {loopedLogos.map((src, i) => (
          <div
            key={i}
            className="flex aspect-square w-[72px] shrink-0 items-center justify-center overflow-visible rounded-full bg-white"
          >
            <div style={logoContainerStyle}>
              <Image src={src} alt={`Logo ${i}`} className="w-[36px] object-contain object-bottom" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
