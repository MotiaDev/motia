'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Copy, ChevronDown, ExternalLink } from 'lucide-react'

interface ArticleActionsProps {
  markdown: string
  title: string
}

const AI_OPTIONS = [
  {
    name: 'Open in ChatGPT',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    ),
    getUrl: (content: string) => `https://chat.openai.com/?q=${encodeURIComponent(content)}`,
  },
  {
    name: 'Open in Claude',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H2.91l-.2.179v2.447c0 .205.166.379.378.379h1.62zM8.662 12l-3.26-5.696c-.166-.282-.103-.641.14-.846L8.5 3.134c.14-.102.345-.128.511-.051l8.32 4.09.282.179-.026.282-1.773 8.744-.154.256-.269.026-6.572-.385-.409-.102.026-.358L8.662 12zm4.605 8.853L5.154 18.53l-.32-.154.064-.345.755-1.568.166-.205h6.188l.205.128 3.234 4.339.051.307-.256.179-1.594.796c-.179.077-.38.051-.38-.154zM21.675 9.046l-1.03-1.67-.23-.154-.243.103-4.32 2.47-.128.205.051.243 1.21 2.829.18.179 4.293.256.256-.103.128-.243.064-3.85c.013-.102-.077-.205-.23-.265zm-2.034 6.803l-2.931-.179-.23.128-.103.23-.908 3.234.077.269.243.128 2.982.154c.205 0 .38-.154.409-.358l.614-3.209c.039-.205-.076-.397-.153-.397zm-.614-9.745L15.717 4.8l-.256.051-.128.205-.486 2.931.103.243.23.128 4.115 1.03.269-.077.128-.256.23-2.699c.013-.103-.064-.205-.205-.252zM14.28 3.005l-3.606-1.03c-.192-.052-.397.064-.448.256l-.627 2.432-.051.269.179.179 2.534 1.363.269.026.205-.154 1.773-2.982c.115-.154.038-.308-.228-.359z" />
      </svg>
    ),
    getUrl: () => 'https://claude.ai/new',
    copyFirst: true,
  },
  {
    name: 'Open in T3 Chat',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">T3</text>
      </svg>
    ),
    getUrl: (content: string) => `https://t3.chat/?q=${encodeURIComponent(content)}`,
  },
]

export function ArticleActions({ markdown, title }: ArticleActionsProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const content = `I'm reading documentation about "${title}". Here's the content:\n\n${markdown}\n\nPlease help me understand this.`

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleOpenAI = async (option: (typeof AI_OPTIONS)[number]) => {
    if (option.copyFirst) {
      await navigator.clipboard.writeText(content)
    }
    window.open(option.getUrl(content), '_blank')
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-2 not-prose">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-3 py-1.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied!' : 'Copy Markdown'}
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
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
                key={option.name}
                onClick={() => handleOpenAI(option)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-fd-popover-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
              >
                {option.icon}
                <span className="flex-1 text-left">{option.name}</span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
