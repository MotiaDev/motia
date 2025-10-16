import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect direct .mdx file access to proper routes
  if (pathname.endsWith('.mdx')) {
    // Remove .mdx extension and redirect to the clean URL
    const cleanPath = pathname.replace('.mdx', '')
    const redirectUrl = new URL(cleanPath, request.url)
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Handle specific problematic URLs found in crawl data
  const redirects: Record<string, string> = {
    // Redirect incomplete URLs
    '/docs/real-': '/docs/real-world-use-cases',
    // Add any other problematic URLs as needed
  }

  if (redirects[pathname]) {
    const redirectUrl = new URL(redirects[pathname], request.url)
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Add noindex headers for API routes (additional safety)
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  // Add noindex headers for static assets with query parameters
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('.css') ||
    pathname.includes('.js') ||
    pathname.includes('favicon.ico')
  ) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
