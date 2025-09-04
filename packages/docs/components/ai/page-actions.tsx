'use client'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover'
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { Check, ChevronDown, Copy, ExternalLinkIcon, Search as SearchIcon } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'

const cache = new Map<string, string>()

export function LLMCopyButton({ markdownUrl }: { markdownUrl: string }) {
  const [isLoading, setLoading] = useState(false)
  const [checked, onClick] = useCopyButton(async () => {
    const cached = cache.get(markdownUrl)
    if (cached) return navigator.clipboard.writeText(cached)

    setLoading(true)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': fetch(markdownUrl).then(async (res) => {
            const content = await res.text()
            cache.set(markdownUrl, content)
            return content
          }),
        }),
      ])
    } finally {
      setLoading(false)
    }
  })

  return (
    <button
      disabled={isLoading}
      className={cn(
        buttonVariants({
          color: 'secondary',
          size: 'sm',
          className: 'gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground',
        }),
      )}
      onClick={onClick}
    >
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </button>
  )
}

const optionClasses =
  'text-sm p-2 rounded-lg inline-flex items-center gap-2 hover:text-fd-accent-foreground hover:bg-fd-accent [&_svg]:size-4'

export function ViewOptions({ markdownUrl, githubUrl }: { markdownUrl: string; githubUrl: string }) {
  const items = useMemo(() => {
    const fullMarkdownUrl = typeof window !== 'undefined' ? new URL(markdownUrl, window.location.origin) : 'loading'
    const q = `Read ${fullMarkdownUrl}, I want to ask questions about it.`

    return [
      {
        title: 'Open in GitHub',
        href: githubUrl,
        icon: (
          <svg fill="currentColor" role="img" viewBox="0 0 24 24">
            <title>GitHub</title>
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        ),
      },
      {
        title: 'Open in ChatGPT',
        href: `https://chatgpt.com/?${new URLSearchParams({ hints: 'search', q })}`,
        icon: <Image src="/icons/chatgpt-4.svg" alt="ChatGPT" width={16} height={16} />,
      },
      {
        title: 'Open in Claude',
        href: `https://claude.ai/new?${new URLSearchParams({ q })}`,
        icon: <Image src="/icons/claude-logo.svg" alt="Claude" width={16} height={16} />,
      },
      {
        title: 'Open in T3 Chat',
        href: `https://t3.chat/new?${new URLSearchParams({ q })}`,
        icon: <SearchIcon />,
      },
      {
        title: 'Open in Scira AI',
        href: `https://scira.ai/?${new URLSearchParams({ q })}`,
        icon: <Image src="/icons/scira.png" alt="Scira AI" width={16} height={16} />,
      },
    ]
  }, [githubUrl, markdownUrl])

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'gap-2',
          }),
        )}
      >
        Open
        <ChevronDown className="size-3.5 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col overflow-auto">
        {items.map((item) => (
          <a key={item.href} href={item.href} rel="noreferrer noopener" target="_blank" className={cn(optionClasses)}>
            {item.icon}
            {item.title}
            <ExternalLinkIcon className="text-fd-muted-foreground size-3.5 ms-auto" />
          </a>
        ))}
      </PopoverContent>
    </Popover>
  )
}
