'use client'

import React, { FC } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { closeIcon } from './Icons'
import bgBento3 from '@/public/images/landing/bgModalSignUp.webp'
import Image from 'next/image'
import useEarlyAccessForm from '../hooks/useEarlyAccessForm'
import EarlyAccessFormContent from './EarlyAccessFormContent'
import SuccessContent from './SuccessContent'

type ModalFormProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
}

const ModalForm: FC<ModalFormProps> = ({ isOpen, onClose, title }) => {
  const [formState, formAction] = useEarlyAccessForm()

  const { succeeded, errors } = formState

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        >
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
                {succeeded ? (
                  <SuccessContent />
                ) : (
                  <EarlyAccessFormContent formAction={formAction} errors={errors} title={title} />
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
