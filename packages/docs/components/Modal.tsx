'use client'

import React, { FC } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, ValidationError } from '@formspree/react'
import { chevronRightCircle, closeIcon } from './Icons'
import motiaLogoWhiteFull from '@/public/images/logoFull.png'
import bgBento3 from '@/public/images/landing/bgBento3.webp'
import Image from 'next/image'
import ButtonPrimary from './ButtonPrimary'
import successModalTick from '@/public/images/landing/successModalTick.png'
import particles from '@/public/images/landing/particles.svg'
import modalGlow from '@/public/images/landing/sideGlowModal.svg'

const tickShadowStyle: React.CSSProperties = {
  boxShadow:
    '0px 85.867px 23.852px 0px rgba(2, 0, 20, 0.01), 0px 54.859px 21.467px 0px rgba(2, 0, 20, 0.08), 0px 31.007px 17.889px 0px rgba(2, 0, 20, 0.28), 0px 13.119px 13.119px 0px rgba(2, 0, 20, 0.47), 0px 3.578px 7.156px 0px rgba(2, 0, 20, 0.54)',
}

type ModalFormProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
}

const ModalForm: FC<ModalFormProps> = ({ isOpen, onClose, title }) => {
  const [state, handleSubmit] = useForm('mqaerbdp')

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        >
          {/* backdrop with blur and 30% opacity */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-[10px]"
          />

          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0 }}
            className="relative w-[367px] max-w-[calc(100%_-_32px)] bg-black"
          >
            <Image
              src={bgBento3}
              className="fade-bottom pointer-events-none absolute top-0 left-0 z-0 h-full w-full rounded-[8px] border-[1px] border-white/20 object-cover object-top"
              alt="Modal Background"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <DialogPanel className="relative w-full max-w-md rounded-lg px-[28px] py-[32px] pb-[60px] shadow-lg">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Form"
                  className="absolute top-[-52px] right-0 cursor-pointer rounded-full bg-[#111821] p-[14px] text-sm font-medium transition-all ease-in hover:scale-95"
                >
                  {closeIcon}
                </button>
                {state.succeeded ? (
                  <>
                    <Image src={motiaLogoWhiteFull} alt="Motia" className="mx-auto w-[120px]" />
                    <div className="relative flex w-full items-center justify-center pt-[35px] pb-[60px]">
                      <Image className="absolute -z-0 min-w-[375px]" src={modalGlow} alt="background glow effect" />
                      <Image src={particles} alt="Particles in background" width={54} />
                      <Image
                        style={tickShadowStyle}
                        className="relative z-1"
                        width={150}
                        src={successModalTick}
                        alt="Succes!"
                      />
                      <Image src={particles} alt="Particles in background" width={54} className="rotate-180" />
                    </div>
                    <DialogTitle className="text-center text-[24px] font-medium text-white/90">
                      Thanks for registering!
                    </DialogTitle>
                    <p className="mx-auto w-[270px] max-w-full pt-[20px] text-center text-[16px] text-white/60">
                      You’ll receive the details via email in the next 24hrs.
                    </p>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} className="">
                    <Image src={motiaLogoWhiteFull} alt="Motia" className="mx-auto w-[120px]" />
                    <DialogTitle className="font-tasa pt-[20px] text-center text-[16px] text-white">
                      {title || 'Get early access to motia today.'}
                    </DialogTitle>
                    <div className="flex flex-col gap-[12px] pt-[60px] pb-[40px]">
                      <div>
                        <input
                          id="name"
                          name="name"
                          placeholder="Full name"
                          type="text"
                          required
                          disabled={state.submitting}
                          className="block w-full rounded-[4px] bg-white/15 px-[10px] py-[17px] text-[14px] placeholder-white/60 transition-all duration-200 ease-in-out focus:bg-white/25 focus:text-white focus:ring focus:ring-white focus:outline-none"
                        />
                        <ValidationError
                          prefix="Name"
                          field="name"
                          errors={state.errors}
                          className="mt-1 text-sm text-red-600"
                        />
                      </div>

                      <div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Email"
                          required
                          disabled={state.submitting}
                          className="block w-full rounded-[4px] bg-white/15 px-[10px] py-[17px] text-[14px] placeholder-white/60 transition-all duration-200 ease-in-out focus:bg-white/25 focus:text-white focus:ring focus:ring-white focus:outline-none"
                        />
                        <ValidationError
                          prefix="Email"
                          field="email"
                          errors={state.errors}
                          className="mt-1 text-sm text-red-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-center space-x-2 pt-[40px]">
                      <ButtonPrimary type="submit" disabled={state.submitting}>
                        {state.submitting ? 'Submitting...' : <>Join Beta {chevronRightCircle}</>}
                      </ButtonPrimary>
                    </div>
                  </form>
                )}
              </DialogPanel>
            </motion.div>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

export default ModalForm
