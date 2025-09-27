import { FC, useMemo } from 'react'
import { EndpointBadge } from './endpoint-badge'
import { ApiRouteMethod } from '../types/endpoint'

interface EndpointPathProps {
  method: string
  path: string
}

const PathSeparator = () => {
  return <div className="text-muted-foreground">/</div>
}

export const EndpointPath: FC<EndpointPathProps> = ({ method, path }) => {
  const pathView = useMemo(() => {
    const parts = path.split('/').filter(Boolean)
    const partsLength = parts.length - 1
    return parts.flatMap((part, index) => {
      const isLast = index === partsLength
      const separator = isLast ? undefined : <PathSeparator />

      if (part.startsWith(':')) {
        return [
          <div className="bg-[#2862FE]/20 text-[#2862FE] rounded-sm px-1 py-0.5 text-sm font-mono font-bold font-medium">
            {part}
          </div>,
          separator,
        ]
      }
      return [part, separator]
    })
  }, [path])

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
      <EndpointBadge variant={method as ApiRouteMethod}>{method}</EndpointBadge>
      <span className="font-mono font-bold whitespace-nowrap flex flex-row gap-2 items-center truncate">
        <PathSeparator />
        {pathView}
      </span>
    </div>
  )
}
