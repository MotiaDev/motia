import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`flex cursor-pointer items-center justify-center gap-[10px] rounded-[12px] border border-white bg-[radial-gradient(153.04%_109.45%_at_50%_0%,_#EFF3FF_0%,_#FFF5EA_100%)] px-4 py-3 text-[16px] font-medium text-black shadow-[inset_0px_-1.5px_2px_0px_#FFF,_0px_29px_37.1px_-6px_rgba(0,1,78,0.3)] transition duration-300 ease-in-out ${className} `}
    >
      {children}
    </button>
  )
}

export default ButtonPrimary
