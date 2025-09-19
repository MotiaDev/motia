'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface CanonicalUrlProps {
  url?: string
  baseUrl?: string
}

export function CanonicalUrl({ 
  url, 
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://motia.dev' 
}: CanonicalUrlProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Remove existing canonical link
    const existing = document.querySelector('link[rel="canonical"]')
    if (existing) {
      existing.remove()
    }

    // Create canonical URL
    const canonicalUrl = url || `${baseUrl}${pathname}`
    
    // Clean up the URL (remove query params, trailing slashes, etc.)
    const cleanUrl = canonicalUrl
      .replace(/\?.*$/, '') // Remove query parameters
      .replace(/\/$/, '') // Remove trailing slash (except for root)
      .replace(/\/+/g, '/') // Remove double slashes
    
    // Don't remove trailing slash from root
    const finalUrl = cleanUrl === baseUrl.replace(/\/$/, '') ? baseUrl : cleanUrl

    // Add new canonical link
    const link = document.createElement('link')
    link.rel = 'canonical'
    link.href = finalUrl
    document.head.appendChild(link)

    return () => {
      // Cleanup on unmount
      const toRemove = document.querySelector(`link[rel="canonical"][href="${finalUrl}"]`)
      if (toRemove) {
        toRemove.remove()
      }
    }
  }, [pathname, url, baseUrl])

  return null
}
