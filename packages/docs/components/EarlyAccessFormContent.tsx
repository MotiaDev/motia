'use client'

import React from 'react'
import Image from 'next/image'
import { DialogTitle } from '@headlessui/react'
import { useFormStatus } from 'react-dom'

import motiaLogoWhiteFull from '@/public/images/logoFull.png'
import ButtonPrimary from './ButtonPrimary'
import { chevronRightCircle } from './Icons'
import { FormState } from '../hooks/useEarlyAccessForm'

type Props = {
  formAction: (formData: FormData) => void
  errors: FormState['errors']
  title?: string
}

const FormSubmitButton: React.FC = () => {
  const { pending } = useFormStatus()
  return (
    <ButtonPrimary type="submit" disabled={pending}>
      {pending ? 'Submitting...' : (
        <>
          Get early access to Motia Cloud {chevronRightCircle}
        </>
      )}
    </ButtonPrimary>
  )
}

const EarlyAccessFormContent: React.FC<Props> = ({ formAction, errors, title }) => (
  <form action={formAction}>
    <Image src={motiaLogoWhiteFull} alt="Motia" className="mx-auto w-[120px]" />
    <DialogTitle className="font-tasa pt-[20px] text-center text-[16px] text-white">
      {title || 'Get early access to motia cloud today.'}
    </DialogTitle>
    <div className="flex flex-col gap-[12px] pt-[60px] pb-[40px]">
      <div>
        <input
          id="name"
          name="name"
          placeholder="Full name"
          type="text"
          required
          className="block w-full rounded-[4px] bg-white/15 px-[10px] py-[17px] text-[14px] placeholder-white/60 transition-all duration-200 ease-in-out focus:bg-white/25 focus:text-white focus:ring focus:ring-white focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          className="block w-full rounded-[4px] bg-white/15 px-[10px] py-[17px] text-[14px] placeholder-white/60 transition-all duration-200 ease-in-out focus:bg-white/25 focus:text-white focus:ring focus:ring-white focus:outline-none"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>
    </div>
    <div className="flex justify-center space-x-2 pt-[40px]">
      <FormSubmitButton />
    </div>
  </form>
)

export default EarlyAccessFormContent 