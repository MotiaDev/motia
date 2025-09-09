import { X } from 'lucide-react'
import type { FC } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import type { ApiEndpoint } from '@/types/endpoint'
import { EndpointBadge } from './endpoint-badge'
import { EndpointCall } from './endpoint-call'
import { EndpointDescription } from './endpoint-description'

type Props = { endpoint: ApiEndpoint; onClose: () => void }

export const EndpointSidePanel: FC<Props> = ({ endpoint, onClose }) => {
  return (
    <Sidebar
      initialWidth={600}
      subtitle={endpoint.description}
      title={
        <div className="flex flex-row gap-2 items-center">
          <EndpointBadge variant={endpoint.method as never}>{endpoint.method.toUpperCase()}</EndpointBadge>
          <span className="text-md font-bold">{endpoint.path}</span>
        </div>
      }
      onClose={onClose}
      tabs={[
        {
          label: 'Details',
          content: <EndpointDescription endpoint={endpoint} />,
          'data-testid': 'endpoint-details-tab',
        },
        {
          label: 'Call',
          content: <EndpointCall endpoint={endpoint} />,
          'data-testid': 'endpoint-call-tab',
        },
      ]}
      actions={[
        {
          icon: <X className="cursor-pointer w-4 h-4" onClick={onClose} />,
          onClick: onClose,
        },
      ]}
    />
  )
}
