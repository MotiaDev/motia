import { type HandleProps, Position, Handle as RFHandle } from '@xyflow/react'
import clsx from 'clsx'
import type React from 'react'
import type { HTMLAttributes } from 'react'

type Props = HandleProps &
  Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
    isHidden?: boolean
    onTogglePosition?: () => void
  }

export const BaseHandle: React.FC<Props> = (props) => {
  const { isHidden, position, onTogglePosition, ...rest } = props
  const isHorizontal = position === Position.Left || position === Position.Right

  return (
    <div
      className={clsx(
        'absolute w-[6px] h-[6px]',
        position === Position.Top && '-top-[4px]',
        position === Position.Bottom && '-bottom-[4px]',
        position === Position.Left && '-left-[4px]',
        position === Position.Right && '-right-[4px]',
        isHorizontal ? 'top-1/2 -mt-[2px]' : 'left-1/2 -ml-[2px]',
        isHidden && 'hidden',
      )}
      onClick={onTogglePosition}
    >
      <RFHandle
        {...rest}
        position={position}
        style={{ background: 'rgb(30,118,231)' }}
        className="
        bg-white/50
        !static
        !w-[6px]
        !h-[6px]
        !min-w-[6px]
        !min-h-[6px]
        !p-0
        !border-none
        !transform-none
        !rounded-full
        !outline-none
        !shadow-none
      "
      />
    </div>
  )
}
