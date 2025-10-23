'use client'

import { motion } from 'framer-motion'
import type React from 'react'
import type { MouseEventHandler, ReactNode } from 'react'
import { AGENT_GMAIL, AGENT_ICONS, AGENT_TABS } from './constants/agentExplorer'

const transition = {
  type: 'spring' as const,
  mass: 0.15,
  damping: 20,
  stiffness: 100,
}
interface AgentTab {
  variant?: string
  children: ReactNode
  onClick: MouseEventHandler<HTMLButtonElement>
}
export const AgentTab: React.FC<AgentTab> = ({ variant = 'inactive', children, onClick }) => {
  return (
    <motion.button
      whileHover={{
        backgroundImage: `radial-gradient(ellipse farthest-side at center bottom,
        rgba(255, 255, 255,1) 13%,
        rgba(77, 109, 255, 0) 50%,
        rgba(77, 109, 255, 0) 100%)`,
      }}
      onClick={onClick}
      animate={variant}
      transition={transition}
      variants={{
        inactive: {
          border: 'solid 1px rgba(255,255,255,0.2)',
          backgroundImage: `radial-gradient(ellipse farthest-side at center bottom,
    rgba(255, 255, 255,0) 13%,
    rgba(77, 109, 255, 0) 50%,
    rgba(77, 109, 255, 0) 100%)`,
        },
        active: {
          border: 'solid 1px rgba(255,255,255,0)',
          backgroundImage: `radial-gradient(ellipse farthest-side at center bottom,
          rgba(255, 255, 255,1) 13%,
          rgba(77, 109, 255, 0.53) 50%,
          rgba(77, 109, 255, 0.53) 100%)`,
        },
      }}
      className="h-fit w-full cursor-pointer rounded-[12px] p-[1px]"
    >
      <motion.div
        animate={variant}
        transition={transition}
        variants={{
          inactive: {
            boxShadow: '0px 28px 35.8px -18px rgba(14, 72, 196, 0)',

            backgroundImage:
              'radial-gradient(136.33% 100% at 50% 0%, rgba(13, 20, 54,0) 0%, rgba(8, 24, 101, 0) 71.63%, rgba(5, 28, 138, 0) 100%) ',
          },
          active: {
            boxShadow: '0px 28px 35.8px -18px rgba(14, 72, 196, 0.6)',
            backgroundImage:
              'radial-gradient(136.33% 100% at 50% 0%, rgba(13, 20, 54,1) 0%, rgba(8, 24, 101, 1) 71.63%, rgba(5, 28, 138, 1) 100%)',
          },
        }}
        className="font-tasa flex items-center justify-center gap-3 rounded-[inherit] bg-black p-[12px] text-[16px] font-medium tracking-[0.48px] text-white"
      >
        {children}
      </motion.div>
    </motion.button>
  )
}

interface IconWrapper {
  children?: ReactNode
  variant?: string
  tab?: string
}

const IconWrapper: React.FC<IconWrapper> = ({ children, variant, tab }) => {
  return (
    <motion.div
      animate={variant}
      transition={transition}
      variants={{
        active: {
          boxShadow:
            tab === AGENT_GMAIL
              ? ' 0px 15px 6px -6px rgba(5, 1, 49, 0.2)'
              : '0px 15px 6px -6px rgba(255, 237, 220, 0.2)',
          backgroundColor: tab === AGENT_GMAIL ? '#fff' : 'rgba(0,0,0,1)',
          filter: tab === AGENT_GMAIL ? 'invert(0%)' : 'invert(100%)',
        },
        inactive: { boxShadow: '0px 15px 6px -6px rgba(255, 237, 220, 0)', backgroundColor: 'rgba(0,0,0,0)' },
      }}
      className="flex h-[32px] w-[32px] items-center justify-center rounded-[4px]"
    >
      {children}
    </motion.div>
  )
}

type setAgentFunction = (a: string) => void

interface TabSelector {
  agent?: string
  setAgent?: setAgentFunction
}
export const TabSelector: React.FC<TabSelector> = ({ agent, setAgent = () => {} }) => {
  return (
    <div className="scrollbar-hide mt-[80px] mb-[10px] w-full overflow-x-auto px-[16px]">
      <div className="flex w-full gap-[16px] pb-[30px] max-md:w-[320%] max-md:max-w-[1000px]">
        {AGENT_TABS.map((tab, i) => {
          return (
            <AgentTab
              variant={tab === agent ? 'active' : 'inactive'}
              key={tab}
              onClick={() => {
                setAgent(tab)
              }}
            >
              <IconWrapper tab={tab} variant={tab === agent ? 'active' : 'inactive'}>
                <div className="w-full max-w-[22px]">{AGENT_ICONS[i]}</div>
              </IconWrapper>

              {tab}
            </AgentTab>
          )
        })}
      </div>
    </div>
  )
}
