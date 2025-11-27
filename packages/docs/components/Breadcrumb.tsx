'use client'

import Link from 'next/link'
import { cn } from 'fumadocs-ui/utils/cn'
export function Breadcrumb({ items }: { items: { name: string; url: string }[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className={cn('grid w-full gap-4', items.length % 3 === 0 ? `grid-cols-3` : `grid-cols-2`)}>
      {items.map((item, i) => (
        <div key={i}>
          {item.url ? (
            <Link href={item.url} className="truncate no-underline">
              <div className="border-zinc-850 dark:border-zinc-150 hover:text-zinc-1000 flex flex-col items-center justify-center rounded-md border bg-gradient-to-br from-zinc-100 to-zinc-200 p-8 transition-colors hover:from-zinc-200 hover:to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 dark:hover:from-zinc-900 dark:hover:to-zinc-800 dark:hover:text-white">
                {item.name}
              </div>
            </Link>
          ) : (
            <div className="border-zinc-850 dark:border-zinc-150 hover:text-zinc-1000 flex flex-col items-center justify-center rounded-md border bg-gradient-to-br from-zinc-100 to-zinc-200 p-8 transition-colors hover:from-zinc-200 hover:to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 dark:hover:from-zinc-900 dark:hover:to-zinc-800 dark:hover:text-white">
              <span className="truncate">{item.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
