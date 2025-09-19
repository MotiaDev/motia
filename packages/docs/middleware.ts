import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define redirects - add your actual redirects here based on 404 patterns
const redirects: Record<string, string> = {
  // Example redirects - update these based on your actual 404 patterns
  '/old-docs': '/docs',
  '/documentation': '/docs',
  '/guide': '/docs/getting-started',
  '/tutorial': '/docs/getting-started',
  '/api': '/docs',
  '/examples-old': '/docs/examples',
  // Add more redirects based on the 404 errors you're seeing
}

// Patterns that should be normalized (remove trailing slash, query params, etc.)
const normalizeUrl = (url: string): string => {
  // Remove query parameters that cause duplicate content
  const urlObj = new URL(url)
  const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source', 'medium', 'campaign']
  
  paramsToRemove.forEach(param => {
    urlObj.searchParams.delete(param)
  })
  
  let path = urlObj.pathname
  
  // Remove trailing slash except for root
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  
  // Rebuild URL
  return path + (urlObj.search ? urlObj.search : '')
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const url = pathname + search
  
  // Handle redirects
  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], request.url), 301)
  }
  
  // Normalize URLs to prevent duplicate content
  const normalizedUrl = normalizeUrl(request.url)
  const currentUrl = pathname + search
  
  if (normalizedUrl !== currentUrl) {
    return NextResponse.redirect(new URL(normalizedUrl, request.nextUrl.origin), 301)
  }
  
  // Handle case-insensitive routing (optional - for better UX)
  if (pathname !== pathname.toLowerCase()) {
    const newUrl = pathname.toLowerCase() + search
    return NextResponse.redirect(new URL(newUrl, request.url), 301)
  }

  // Add security headers
  const response = NextResponse.next()
  
  // SEO and security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.png|og-image-updated-new.jpg).*)',
  ],
}