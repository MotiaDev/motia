'use client'

import { useEffect, useState } from 'react'

import { formatters } from '@/components/site/count-up'
import type { CommunityStats } from '@/lib/community'

type Counts = { stars: number | null; members: number | null }

const CACHE_KEY = 'iii:community-counts'
const CACHE_TTL_MS = 5 * 60 * 1000

function readCache(): Counts | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as (Counts & { at: number }) | null
    return cached && Date.now() - cached.at < CACHE_TTL_MS ? cached : null
  } catch {
    return null
  }
}

function writeCache(counts: Counts) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...counts, at: Date.now() }))
  } catch {
    return
  }
}

async function getCount<T>(url: string, pick: (body: T) => unknown, signal: AbortSignal): Promise<number | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
    if (!res.ok) return null
    const count = pick((await res.json()) as T)
    return typeof count === 'number' ? count : null
  } catch {
    return null
  }
}

async function loadCounts(signal: AbortSignal): Promise<Counts> {
  const [stars, members] = await Promise.all([
    getCount<{ stargazers_count?: number }>(
      'https://api.github.com/repos/iii-hq/iii',
      (repo) => repo.stargazers_count,
      signal,
    ),
    getCount<{ approximate_member_count?: number }>(
      'https://discord.com/api/v10/invites/iiidev?with_counts=true',
      (invite) => invite.approximate_member_count,
      signal,
    ),
  ])
  return { stars, members }
}

export function useLiveCommunityStats(initial: CommunityStats): CommunityStats {
  const [live, setLive] = useState<Counts | null>(null)

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setLive(cached)
      return
    }
    const controller = new AbortController()
    loadCounts(controller.signal).then((counts) => {
      if (controller.signal.aborted || (counts.stars === null && counts.members === null)) return
      writeCache(counts)
      setLive(counts)
    })
    return () => controller.abort()
  }, [])

  const stars = live?.stars ?? initial.starsCount
  const members = live?.members ?? initial.membersCount
  return {
    ...initial,
    stars: stars === null ? null : formatters.plain(stars),
    starsCount: stars,
    members: members === null ? null : formatters.compact(members),
    membersCount: members,
  }
}
