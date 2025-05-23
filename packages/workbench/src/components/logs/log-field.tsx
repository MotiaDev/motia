import React from 'react'
import { cn } from '../../lib/utils'

type Props = {
  label: string
  value: string | React.ReactNode
  className?: string
}

const Value: React.FC<{ value: unknown }> = ({ value }) => {
  const displayValue = typeof value === 'string' ? value : JSON.stringify(value)

  return <div className="dark:text-gray-400 text-md">{displayValue}</div>
}

const LogValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (React.isValidElement(value)) {
    return value
  }

  if (typeof value === 'object') {
    const valueObject = value as object

    return (
      <div className="flex flex-col gap-4">
        {Object.keys(valueObject).map((key) => (
          <div className="ml-4 flex flex-col gap-2" key={key}>
            <span className="text-md font-semibold">{key}</span>
            <span className="text-md">
              {value ? (
                <LogValue value={valueObject[key as keyof typeof valueObject]} />
              ) : (
                <Value value={valueObject[key as keyof typeof valueObject]} />
              )}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return <Value value={value} />
}

export const LogField = ({ label, value, className }: Props) => {
  return (
    <div className={cn('flex row text-foreground p-2', className)}>
      <div className="flex flex-col gap-2">
        <span className="text-md font-semibold">{label}</span>
        <span className="">{value ? <LogValue value={value} /> : <Value value={value} />}</span>
      </div>
    </div>
  )
}
