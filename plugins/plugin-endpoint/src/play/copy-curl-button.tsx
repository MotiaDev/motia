import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@motiadev/ui'
import { Check, Copy } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { getBodySelector, getHeadersSelector, useEndpointConfiguration } from '../hooks/use-endpoint-configuration'
import { usePathUrl } from '../hooks/use-path-url'
import { generateCurl } from './utils/generate-curl'

type CopyCurlButtonProps = {
  method: string
  path: string
}

export const CopyCurlButton = memo(({ method, path }: CopyCurlButtonProps) => {
  const headers = useEndpointConfiguration(useShallow(getHeadersSelector))
  const body = useEndpointConfiguration(useShallow(getBodySelector))
  const pathUrl = usePathUrl(path)
  const [copied, setCopied] = useState(false)

  const onClick = useCallback(async () => {
    const _headers = Object.values(headers)
      .filter((header) => header.active && header.name !== '' && header.value !== '')
      .reduce(
        (acc, header) => {
          acc[header.name] = header.value
          return acc
        },
        {} as Record<string, string>,
      )

    const curl = generateCurl({
      method,
      url: pathUrl,
      headers: _headers,
      body,
    })

    try {
      await navigator.clipboard.writeText(curl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [method, pathUrl, headers, body])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onClick}
          data-testid="endpoint-copy-curl-button"
        >
          {copied ? <Check /> : <Copy />}
          <span>cURL</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy as cURL command</TooltipContent>
    </Tooltip>
  )
})
