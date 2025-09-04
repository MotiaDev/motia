import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'

const badgeVariants = cva('text-xs font-medium tracking-wide rounded-full h-[6px] w-[6px] m-[4px] outline-[2px]', {
  variants: {
    variant: {
      info: 'bg-[#2862FE] outline-[#2862FE]/20',
      trace: 'bg-[#2862FE] outline-[#2862FE]/20',
      debug: 'bg-[#2862FE] outline-[#2862FE]/20',
      error: 'bg-[#E22A6D] outline-[#E22A6D]/20',
      fatal: 'bg-[#E22A6D] outline-[#E22A6D]/20',
      warn: 'bg-[#F59F0B] outline-[#F59F0B]/20',
    },
  },
})

export const LogLevelDot: React.FC<{ level: string }> = ({ level }) => {
  return (
    <div
      className={badgeVariants({
        variant: level as VariantProps<typeof badgeVariants>['variant'],
      })}
    />
  )
}
