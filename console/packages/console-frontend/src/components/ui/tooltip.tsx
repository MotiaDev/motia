import type { ReactNode } from 'react'

export function Tooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded bg-[#1D1D1D] border border-[#2A2A2A] text-[10px] text-[#9CA3AF] tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </div>
    </div>
  )
}
