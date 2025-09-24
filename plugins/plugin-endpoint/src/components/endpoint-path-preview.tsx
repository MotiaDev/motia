import { usePathUrl } from '../hooks/use-path-url'
import { FC, useState } from 'react'
import { Button, cn } from '@motiadev/ui'
import { Copy, Check } from 'lucide-react'
import { ApiRouteMethod } from '../types/endpoint'
import { EndpointBadge } from './endpoint-badge'

interface EndpointPathPreviewProps {
  path: string
  method: ApiRouteMethod
  baseUrl?: string
}

export const EndpointPathPreview: FC<EndpointPathPreviewProps> = ({
  path,
  method,
  baseUrl = window.location.origin,
}) => {
  const pathUrl = usePathUrl(path)
  const fullUrl = `${baseUrl}${pathUrl}`
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <div className="flex items-center px-5 relative border-b border-border">
      <div className="border-r border-border pr-5 py-2">
        <EndpointBadge variant={method}>{method}</EndpointBadge>
      </div>

      <div className="flex-1 bg-muted-foreground/10 box-border flex gap-1 ml-5 h-6 items-center px-2 py-1 rounded border border-border">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs text-muted-foreground truncate">{fullUrl}</div>
        </div>

        <Button
          onClick={handleCopy}
          className={cn(
            'w-3 h-3 flex items-center justify-center transition-colors cursor-pointer',
            copied ? 'text-green-400' : 'text-muted-foreground',
          )}
          variant="icon"
          size="small"
          aria-label="Copy URL"
        >
          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
        </Button>
      </div>
    </div>
  )
}
