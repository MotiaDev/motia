import React, { CSSProperties } from 'react'

type PatternType = 'strong' | 'subtle'

type BackgroundEffectProps = {
  patternType?: PatternType
}

const types: Record<PatternType, CSSProperties> = {
  subtle: {
    width: '100%',
    height: '100%',
  },
  strong: {
    left: '0',
    bottom: '0px',
    rotate: '0deg',
    width: '50%',
    height: '70%',
    clipPath:
      'polygon(-16.9% -59.9%, 2% 80.6%, 99.5% 83.9%, 58.5% 3.1%, -40.3% 20%, 29.5% 23.5%, 49.2% 78.4%, 42.4% 84.1%, 31.5% 55.3%, 16.2% 33.5%, 63.5% 59.7%, -17.9% 47.9%, 30.9% 96%, 25.6% 85.8%, 49.1% 46.7%, 62.1% 77.1%)',
  },
}

export const BackgroundEffect: React.FC<BackgroundEffectProps> = ({ patternType = 'subtle' }) => {
  const style = types[patternType]

  return (
    <div
      aria-hidden="true"
      className="absolute top-0 h-full w-full inset-x-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none"
    >
      <div
        style={style}
        className="relative -z-10 aspect-1155/678 bg-linear-to-br from-white/60 to-[#050505] opacity-20 pointer-events-none"
      ></div>
    </div>
  )
}
