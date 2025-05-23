import React from 'react'

type Props = {
  color?: string
  id: string
  className?: string
}

export const ArrowHead: React.FC<Props> = (props) => {
  // Use CSS custom property for theme-aware coloring, fallback to provided color
  const strokeColor = props.color || 'var(--arrow-color, #B3B3B3)'

  return (
    <marker
      id={props.id}
      viewBox="-5 -5 10 10"
      markerUnits="strokeWidth"
      markerWidth="10"
      markerHeight="10"
      className={props.className}
    >
      <line x1={0} y1={0} x2={2} y2={-2} stroke={strokeColor} strokeWidth="1" strokeOpacity="1" strokeLinecap="round" />
      <line
        x1={-2}
        y1={-2}
        x2={0}
        y2={0}
        stroke={strokeColor}
        strokeWidth="1"
        strokeOpacity="1"
        strokeLinecap="round"
      />
    </marker>
  )
}
