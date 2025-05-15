'use client'
/**
 * This is a custom component
 * built for the infinite slideshow of logos
 * in the supercharge AI section
 * The animation is handled using useAnimation from framer-motion
 * The time delay between each slide and the updating of offset values
 * is handled with a function scroll() inside the useEffect
 * Scaling of the logos is handled using variants by
 * comparing the current active index to the logo's index
 * If they are equal then the variant is set to active
 * This triggers the scale up transition
 * Vice verse for scale down
 */
import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  const [offset, setOffset] = useState(0) //Scroll offset state

  const totalLogos = logos.length
  const LIST_MID_POINT = totalLogos * 2 + Math.ceil(totalLogos / 2) - 1 //The index of the center logo and hence the first item in focus of the slideshow
  const LOOP_REPEAT_INDEX = LIST_MID_POINT + totalLogos //After which index the slideshow should reset to the beginning
  const SCROLL_STEP = 100 // 72px logo + 28px gap
  const SLIDE_INTERVAL = 2000

  const [currentActive, setCurrentActive] = useState(LIST_MID_POINT)

  //Infinite loop logic
  useEffect(() => {
    const scroll = async () => {
      console.log(offset)
      while (true) {
        await new Promise((res) => setTimeout(res, SLIDE_INTERVAL))
        setOffset((prev) => {
          const newOffset = prev - SCROLL_STEP
          controls.start({
            x: newOffset,
            transition: {
              type: 'spring',
              damping: 30,
              stiffness: 200,
              mass: 0.15,
            },
          })

          setCurrentActive((prev) => {
            const newActive = prev + 1
            if (newActive > LOOP_REPEAT_INDEX) {
              controls.set({ x: 0 })
              controls.start({ x: -SCROLL_STEP, transition: { duration: 0.4 } })
              setOffset(() => {
                return -SCROLL_STEP
              })
              return LIST_MID_POINT + 1
            }
            return newActive
          })

          return newOffset
        })
      }
    }

    scroll()
  }, [totalLogos])

  return (
    <motion.div
      ref={containerRef}
      animate={controls}
      className="flex w-screen justify-center gap-[28px] overflow-visible"
    >
      {[...logos, ...logos, ...logos, ...logos, ...logos].map((src, i) => (
        <div
          key={i}
          className="flex aspect-square w-[72px] shrink-0 items-center justify-center overflow-visible rounded-full bg-white"
        >
          <motion.div
            style={logoContainerStyle}
            animate={
              i === LIST_MID_POINT && currentActive >= LOOP_REPEAT_INDEX
                ? 'active'
                : currentActive === i
                  ? 'active'
                  : 'inactive'
            }
            variants={{
              active: { scale: 1.25, transition: { duration: 0.4 } },
              inactive: { scale: 0.95, transition: { duration: 0.4 } },
            }}
          >
            <Image src={src} alt={`Logo ${i}`} className="w-[36px] object-contain object-bottom" />
          </motion.div>
        </div>
      ))}
    </motion.div>
  )
}
