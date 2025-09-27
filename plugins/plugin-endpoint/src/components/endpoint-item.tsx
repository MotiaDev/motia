import { cn } from '@motiadev/ui'
import { EndpointPath } from './endpoint-path'
import { ApiEndpoint } from '../types/endpoint'
import { FC } from 'react'

type EndpointItemProps = {
  endpoint: ApiEndpoint
  isSelected: boolean
  isLast: boolean
  onSelect: (id: string) => void
}

export const EndpointItem: FC<EndpointItemProps> = ({ endpoint, isSelected, isLast, onSelect }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr] items-center justify-center px-4 select-none hover:bg-muted-foreground/10 cursor-pointer',
        isSelected && 'bg-muted-foreground/10',
      )}
    >
      {isLast ? (
        <svg width="14" height="34" viewBox="0 0 12 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.5 16.5C6.50006 19.2614 8.7386 21.4999 11.5 21.5C11.7759 21.5003 12 21.724 12 22C12 22.276 11.7759 22.4997 11.5 22.5C8.18632 22.4999 5.50006 19.8137 5.5 16.5V0H6.5V16.5Z"
            fill="white"
            fillOpacity="0.3"
          />
        </svg>
      ) : (
        <svg width="14" height="34" viewBox="0 0 12 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.5 0V11.5C6.50007 14.2614 8.73861 16.4999 11.5 16.5C11.7759 16.5003 12 16.724 12 17C12 17.276 11.7759 17.4997 11.5 17.5C9.41273 17.5 7.57486 16.4335 6.5 14.8164V34H5.5V0H6.5Z"
            fill="white"
            fillOpacity="0.3"
          />
        </svg>
      )}

      <div data-testid={`endpoint-${endpoint.method}-${endpoint.path}`} onClick={() => onSelect(endpoint.id)}>
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 px-2">
          <EndpointPath method={endpoint.method} path={endpoint.path} />
          <span className="text-sm text-muted-foreground truncate">{endpoint.description}</span>
        </div>
      </div>
    </div>
  )
}
