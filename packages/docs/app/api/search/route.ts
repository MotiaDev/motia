import { createFromSource } from 'fumadocs-core/search/server'
import { type NextRequest, NextResponse } from 'next/server'
import { source } from '@/lib/source'

const searchHandler = createFromSource(source)

export async function GET(request: NextRequest) {
  const response = await searchHandler.GET(request)

  // Add noindex headers to prevent search engines from indexing API routes
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  return response
}
