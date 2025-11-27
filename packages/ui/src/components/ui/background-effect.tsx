import React, { CSSProperties } from 'react'

type PatternType = 'subtle'

type BackgroundEffectProps = {
  patternType?: PatternType
}

const types: Record<PatternType, CSSProperties> = {
  subtle: {
    width: '100%',
    height: '100%',
  },
}

export const BackgroundEffect: React.FC<BackgroundEffectProps> = ({ patternType = 'subtle' }) => {
  const style = types[patternType]

  return (
    <div
      aria-hidden="true"
      className="absolute top-0 h-full w-full inset-x-0 -z-10 transform-gpu overflow-hidden pointer-events-none"
    >
      <div
        style={style}
        className="relative -z-10 aspect-1155/678 bg-linear-to-br from-white/60 to-[#050505] opacity-10 pointer-events-none"
      ></div>
    </div>
  )
}
