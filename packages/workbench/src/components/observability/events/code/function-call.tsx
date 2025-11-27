import React from 'react'

type Props = {
  topLevelClassName?: string
  objectName?: string
  functionName: string
  args: Array<string | object | false | undefined>
  callsQuantity?: number
}

export const Argument: React.FC<{ arg: string | object | false }> = ({ arg }) => {
  if (typeof arg === 'string') {
    return <span className="font-mono text-blue-500">'{arg}'</span>
  } else if (arg === false) {
    return <span className="font-mono text-blue-100 font-bold bg-blue-500/50 px-2 rounded-md">value</span>
  }

  const entries = Object.entries(arg)

  return (
    <>
      <span className="font-mono text-green-500">{'{ '}</span>
      {entries.map(([key, value], index) => (
        <span key={key}>
          <span className="font-mono text-green-500">{key}</span>
          <span className="font-mono text-muted-foreground">:</span> <Argument arg={value} />
          {index < entries.length - 1 && <>, </>}
        </span>
      ))}
      <span className="font-mono text-green-500">{' }'}</span>
    </>
  )
}

export const FunctionCall: React.FC<Props> = ({ topLevelClassName, objectName, functionName, args, callsQuantity }) => {
  const hasCalls = callsQuantity && callsQuantity > 1
  const filteredArgs = args.filter((arg) => arg !== undefined)

  return (
    <div>
      {topLevelClassName && (
        <>
          <span className="font-mono text-pink-500">{topLevelClassName}</span>.
        </>
      )}
      {objectName && (
        <>
          <span className="font-mono text-pink-500">{objectName}</span>.
        </>
      )}
      <span className="font-mono text-pink-500">{functionName}</span>
      <span className="font-mono text-emerald-500">(</span>
      {filteredArgs.map((arg, index) => (
        <span key={index}>
          <Argument arg={arg} />
          {index < filteredArgs.length - 1 && <>, </>}
        </span>
      ))}
      <span className="font-mono text-emerald-500">)</span>
      {hasCalls && <span className="font-mono text-muted-foreground"> x{callsQuantity}</span>}
    </div>
  )
}
