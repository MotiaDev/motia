'use client'

import { Check, ChevronDown, Copy, ExternalLink } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PageActionsProps {
  pageUrl: string
  title: string
}

const AI_OPTIONS = [
  {
    name: 'View as Markdown',
    getUrl: (pageUrl: string) => `${pageUrl}.mdx`,
    external: false,
  },
  {
    name: 'Open in ChatGPT',
    getUrl: (pageUrl: string) => {
      const fullUrl = `${window.location.origin}${pageUrl}.mdx`
      return `https://chatgpt.com/?q=${encodeURIComponent(`Read and summarize: ${fullUrl}`)}`
    },
    external: true,
  },
  {
    name: 'Open in Claude',
    getUrl: () => 'https://claude.ai/new',
    external: true,
    copyFirst: true,
  },
  {
    name: 'Open in T3 Chat',
    getUrl: (pageUrl: string) => {
      const fullUrl = `${window.location.origin}${pageUrl}.mdx`
      return `https://t3.chat/?q=${encodeURIComponent(`Read and summarize: ${fullUrl}`)}`
    },
    external: true,
  },
]

export function PageActions({ pageUrl, title }: PageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const cacheRef = useRef<string | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchMarkdown = useCallback(async () => {
    if (cacheRef.current) return cacheRef.current
    const res = await fetch(`${pageUrl}.mdx`)
    const text = await res.text()
    cacheRef.current = text
    return text
  }, [pageUrl])

  const handleCopy = async () => {
    try {
      const markdown = await fetchMarkdown()
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOption = async (option: (typeof AI_OPTIONS)[number]) => {
    if (option.copyFirst) {
      const markdown = await fetchMarkdown()
      const content = `I'm reading documentation about "${title}". Here's the content:\n\n${markdown}\n\nPlease help me understand this.`
      await navigator.clipboard.writeText(content)
    }
    const url = option.getUrl(pageUrl)
    if (option.external) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = url
    }
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-2 not-prose">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : 'Copy Markdown'}
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          Open
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-fd-border bg-fd-popover p-1 shadow-lg">
            {AI_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.name}
                onClick={() => handleOption(option)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fd-popover-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
              >
                <span className="flex-1 text-left">{option.name}</span>
                {option.external && <ExternalLink className="h-3 w-3 opacity-50" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
