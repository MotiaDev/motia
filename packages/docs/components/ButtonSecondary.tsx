import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonSecondaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const ButtonSecondary: React.FC<ButtonSecondaryProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      {...props}
      className={`flex cursor-pointer items-center justify-center gap-[10px] rounded-[12px] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm text-[16px] font-medium text-white transition duration-300 ease-in-out ${className} `}
    >
      {children}
    </button>
  )
}

export default ButtonSecondary
