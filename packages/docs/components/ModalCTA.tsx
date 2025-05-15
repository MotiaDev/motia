'use client'

import { ReactNode, useState } from 'react'
import ModalForm from './Modal'
import ButtonPrimary from './ButtonPrimary'
import ButtonSecondary from './ButtonSecondary'

type ModalCTA = {
  variant: 'primary' | 'secondary' | 'cloud'
  text?: string
  icon?: ReactNode
}

export default function ModalCTA({ variant, text, icon }: ModalCTA) {
  const [isOpen, setOpen] = useState(false)
  const showModal = () => {
    setOpen(true)
  }
  return (
    <>
      <ModalForm isOpen={isOpen} onClose={() => setOpen(false)} />
      {variant === 'primary' && (
        <ButtonPrimary onClick={showModal} className="w-fit max-lg:w-full">
          {text ?? 'Join Now'} {icon ?? ''}
        </ButtonPrimary>
      )}{' '}
      {variant === 'secondary' && (
        <ButtonSecondary onClick={showModal} className="w-fit max-lg:w-full">
          {text ?? 'Join Now'} {icon ?? ''}
        </ButtonSecondary>
      )}
      {variant === 'cloud' && (
        <div
          onClick={showModal}
          className="flex cursor-pointer gap-[4px] text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
        >
          <p>Motia Cloud</p>
          <div className="rounded-[4px] bg-[#20ABFC]/12 px-[6px] text-[#088CFF]">Coming Soon</div>
        </div>
      )}
    </>
  )
}
