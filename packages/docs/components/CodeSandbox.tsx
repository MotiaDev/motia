'use client'

import { useEffect, useRef } from 'react'

interface CodeSandboxProps {
  repo?: string
  path?: string
  module?: string
  template?: string
}

export function CodeSandbox({ repo, path, module, template = 'node' }: CodeSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const sandboxUrl = repo
      ? `https://codesandbox.io/embed/github/${repo}${path ? `?module=${path}&` : '?'}hidedevtools=1&view=editor`
      : `https://codesandbox.io/embed/new?template=${template}${module ? `&module=${module}` : ''}&hidedevtools=1`

    if (iframeRef.current) {
      iframeRef.current.src = sandboxUrl
    }
  }, [repo, path, module, template])

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <iframe
        ref={iframeRef}
        className="absolute inset-0 h-full w-full"
        title="CodeSandbox"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </div>
  )
}
