import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { NextRequest, NextResponse } from 'next/server';

const searchHandler = createFromSource(source);

export async function GET(request: NextRequest) {
  const response = await searchHandler.GET(request);
  
  // Add noindex headers to prevent search engines from indexing API routes
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  
  return response;
}
