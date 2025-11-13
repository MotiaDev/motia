import Link2 from 'lucide-react/icons/link-2'
import { memo } from 'react'

export const EndpointTabLabel = memo(() => (
  <>
    <Link2 aria-hidden="true" />
    <span>Endpoint</span>
  </>
))
EndpointTabLabel.displayName = 'EndpointTabLabel'
