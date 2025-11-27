'use client'

import React from 'react'
import Image from 'next/image'
import { DialogTitle } from '@headlessui/react'

import motiaLogoWhiteFull from '@/public/images/logoFull.png'
import successModalTick from '@/public/images/landing/successModalTick.png'
import particles from '@/public/images/landing/particles.svg'
import modalGlow from '@/public/images/landing/sideGlowModal.svg'

const tickShadowStyle: React.CSSProperties = {
  boxShadow:
    '0px 85.867px 23.852px 0px rgba(2, 0, 20, 0.01), 0px 54.859px 21.467px 0px rgba(2, 0, 20, 0.08), 0px 31.007px 17.889px 0px rgba(2, 0, 20, 0.28), 0px 13.119px 13.119px 0px rgba(2, 0, 20, 0.47), 0px 3.578px 7.156px 0px rgba(2, 0, 20, 0.54)',
}

const SuccessContent: React.FC = () => (
  <>
    <Image src={motiaLogoWhiteFull} alt="Motia" className="mx-auto w-[120px]" />
    <div className="relative flex w-full items-center justify-center pt-[35px] pb-[60px]">
      <Image className="absolute -z-0 min-w-[375px]" src={modalGlow} alt="background glow effect" />
      <Image src={particles} alt="Particles in background" width={54} />
      <Image
        style={tickShadowStyle}
        className="relative z-[1]"
        width={150}
        src={successModalTick}
        alt="Success!"
      />
      <Image src={particles} alt="Particles in background" width={54} className="rotate-180" />
    </div>
    <DialogTitle className="text-center text-[24px] font-medium text-white/90">
      Thanks for registering!
    </DialogTitle>
    <p className="mx-auto w-[270px] max-w-full pt-[20px] text-center text-[16px] text-white/60">
      Motia Cloud is coming soon.
    </p>
  </>
)

export default SuccessContent 