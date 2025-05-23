import { cva, VariantProps } from 'class-variance-authority'
import { SquareMinus, SquarePlus } from 'lucide-react'
import React, { ReactNode, useState } from 'react'
import { cn } from '../../lib/utils'

const valueVariants = cva('text-muted-foreground text-sm py-2', {
  variants: {
    variant: {
      boolean: 'text-sky-400',
      number: 'text-teal-400',
      undefined: 'text-muted-foreground',
      string: 'text-muted-foreground',
      object: 'text-gray-800',
    },
  },
  defaultVariants: {
    variant: 'string',
  },
})

const Value: React.FC<{ value: ReactNode; label?: string } & VariantProps<typeof valueVariants>> = ({
  value,
  variant,
  label,
}) => {
  const displayValue = typeof value === 'string' ? value : JSON.stringify(value)

  return (
    <div className="flex flex-col gap-1">
      {label && <div className="text-md font-semibold py-2">{label}</div>}
      <div className={valueVariants({ variant })}>{displayValue}</div>
    </div>
  )
}

type Props = {
  value: unknown
  isRoot?: boolean
  label?: string
}

export const StateValue: React.FC<Props> = ({ value, label, isRoot = false }) => {
  const [isOpen, setIsOpen] = useState(true)
  const toggle = () => setIsOpen(!isOpen)

  if (React.isValidElement(value)) {
    return value
  }

  if (typeof value === 'boolean') {
    return <Value label={label} variant="boolean" value={value ? 'true' : 'false'} />
  }

  if (typeof value === 'number') {
    return <Value label={label} variant="number" value={value} />
  }

  if (typeof value === 'undefined') {
    return <Value label={label} variant="undefined" value={value} />
  }

  if (typeof value === 'string') {
    return <Value label={label} variant="string" value={value} />
  }

  const isArray = Array.isArray(value)
  const [openBracket, closeBracket] = isRoot ? [] : isArray ? ['[', ']'] : ['{', '}']

  if (typeof value === 'object' && !!value) {
    const valueObject = value as object

    return (
      <div className="flex flex-col gap-2">
        {(label || openBracket) && (
          <div
            className="flex gap-1 items-center text-md font-semibold hover:bg-gray-800 rounded-md py-2"
            onClick={toggle}
          >
            {isOpen ? (
              <SquareMinus className="w-4 h-4 text-muted-foreground" />
            ) : (
              <SquarePlus className="w-4 h-4 text-muted-foreground" />
            )}
            {label}{' '}
            {!isRoot && (
              <span className="text-muted-foreground text-sm">
                {openBracket}
                {!isOpen && ` ... ${closeBracket}`}
              </span>
            )}
          </div>
        )}
        {isOpen &&
          !!valueObject &&
          Object.keys(valueObject).map((key) => (
            <div className={cn('flex flex-col gap-2', !isRoot && 'ml-4')} key={key}>
              <span className="text-md">
                <StateValue label={isArray ? undefined : key} value={valueObject[key as keyof typeof valueObject]} />
              </span>
            </div>
          ))}
        {!isRoot && isOpen && <span className="text-muted-foreground text-sm">{closeBracket}</span>}
      </div>
    )
  }

  return <Value value={undefined} variant="object" />
}
