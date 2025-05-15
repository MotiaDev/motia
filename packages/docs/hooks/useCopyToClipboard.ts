import { useState } from 'react'

export function useCopyToClipboard(text: string, timeout = 2000) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return { copied, copyToClipboard }
}
