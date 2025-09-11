import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { GITHUB_LINK } from '../../utils/constants'
import { githubIcon, starIcon } from '../Icons'
import { useStreamItem } from '@motiadev/stream-client-react'

// Single digit reel
function Reel({ digit }: { digit: number }) {
  return (
    <div className="overflow-hidden h-6 w-[10px] font-mono font-bold flex justify-center items-center rounded-md text-center">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={digit}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className=""
        >
          {digit}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export const StarCount = () => {
  const { data } = useStreamItem<{ stars: number }>({
    streamName: 'stars',
    groupId: 'MotiaDev',
    id: 'motia',
  })
  const digits = String(data?.stars).split('').map(Number)

  return (
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
        <div className="flex gap-1">{data ? digits.map((d, i) => <Reel key={i} digit={d} />) : '---'}</div>
      </div>
    </Link>
  )
}
