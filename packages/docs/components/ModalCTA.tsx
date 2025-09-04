'use client'

import { type ReactNode, useState } from 'react'
import ButtonPrimary from './ButtonPrimary'
import ButtonSecondary from './ButtonSecondary'
import { twinkleStarsIcon } from './Icons'
import ModalForm from './Modal'

export const ModalCTAVariants = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  CLOUD_COMING_SOON: 'cloudComingSoon',
  CLOUD_NAVBAR: 'cloudNavbar',
} as const

export type ModalCTAVariant = (typeof ModalCTAVariants)[keyof typeof ModalCTAVariants]

type ModalCTA = {
  variant: ModalCTAVariant
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
      {variant === ModalCTAVariants.PRIMARY && (
        <ButtonPrimary onClick={showModal} className="w-fit max-lg:w-full">
          {text ?? 'Join Now'} {icon ?? ''}
        </ButtonPrimary>
      )}{' '}
      {variant === ModalCTAVariants.SECONDARY && (
        <ButtonSecondary onClick={showModal} className="w-fit max-lg:w-full">
          {text ?? 'Join Now'} {icon ?? ''}
        </ButtonSecondary>
      )}
      {variant === ModalCTAVariants.CLOUD_COMING_SOON && (
        <button
          aria-label="Click To Register For Motia Cloud"
          onClick={showModal}
          className="flex cursor-pointer gap-[4px] font-sans text-[16px] text-white/60 transition-colors ease-in-out hover:text-white"
        >
          <div className="rounded-[4px] bg-[#20ABFC]/12 px-[6px] text-[#088CFF]">Join Beta</div>
          <p>Motia Cloud</p>
        </button>
      )}
      {variant === ModalCTAVariants.CLOUD_NAVBAR && (
        <button
          onClick={showModal}
          className="flex cursor-pointer items-center gap-[4px] bg-linear-to-r from-[#53B4FF] to-white bg-clip-text font-sans text-[16px] font-medium text-transparent"
          aria-label="Click To Register For Motia Cloud "
        >
          <p>Motia Cloud</p> {twinkleStarsIcon}
        </button>
      )}
    </>
  )
}
