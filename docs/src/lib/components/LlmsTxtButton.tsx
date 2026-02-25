'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function LlmsTxtButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/llms.txt`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground shadow-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      title="Copy llms.txt URL"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'llms.txt'}
    </button>
  )
}
