import type { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://motia.dev'

interface RouteInfo {
  url: string
  priority: number
  changeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  lastModified?: Date
}

function getFileModifiedTime(filePath: string): Date {
  try {
    const stats = fs.statSync(filePath)
    return stats.mtime
  } catch {
    return new Date()
  }
}

function getDocsRoutes(): RouteInfo[] {
  const routes: RouteInfo[] = []
  const docsRoot = path.join(process.cwd(), 'content', 'docs')

  const walk = (dir: string, prefix: string) => {
    let entries: string[] = []
    try {
      entries = fs.readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry === 'img') continue
      const fullPath = path.join(dir, entry)
      
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory()) {
          const routePath = `${prefix}/${entry}`
          const indexPath = path.join(fullPath, 'index.mdx')
          if (fs.existsSync(indexPath)) {
            routes.push({
              url: routePath,
              priority: getPriority(routePath),
              changeFreq: getChangeFreq(routePath),
              lastModified: getFileModifiedTime(indexPath),
            })
          }
          walk(fullPath, routePath)
        } else if (entry.endsWith('.mdx') && entry !== 'index.mdx') {
          const routeName = entry.replace(/\.mdx$/, '')
          const routePath = `${prefix}/${routeName}`
          routes.push({
            url: routePath,
            priority: getPriority(routePath),
            changeFreq: getChangeFreq(routePath),
            lastModified: getFileModifiedTime(fullPath),
          })
        }
      } catch {
        // Skip files that can't be accessed
        continue
      }
    }
  }

  if (fs.existsSync(docsRoot)) {
    walk(docsRoot, '/docs')
  }

  return routes
}

function getPriority(route: string): number {
  // Homepage gets highest priority
  if (route === '/') return 1.0
  
  // Important landing pages
  if (route === '/docs' || route === '/manifesto') return 0.9
  
  // Getting started and core concepts
  if (route.includes('/getting-started') || route.includes('/concepts')) return 0.8
  
  // Examples and use cases
  if (route.includes('/examples') || route.includes('/real-world-use-cases')) return 0.7
  
  // Other docs
  if (route.startsWith('/docs')) return 0.6
  
  // Utility pages
  if (route.includes('/privacy-policy') || route.includes('/telemetry') || route.includes('/toc')) return 0.3
  
  return 0.5
}

function getChangeFreq(route: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  // Homepage and landing pages change more frequently
  if (route === '/' || route === '/docs') return 'weekly'
  
  // Getting started guides may update frequently
  if (route.includes('/getting-started')) return 'monthly'
  
  // Examples might update regularly
  if (route.includes('/examples')) return 'monthly'
  
  // Core documentation is more stable
  if (route.includes('/concepts')) return 'monthly'
  
  // Utility pages rarely change
  if (route.includes('/privacy-policy') || route.includes('/telemetry')) return 'yearly'
  
  return 'monthly'
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  
  const baseRoutes: RouteInfo[] = [
    { url: '/', priority: 1.0, changeFreq: 'weekly', lastModified: now },
    { url: '/manifesto', priority: 0.9, changeFreq: 'monthly', lastModified: now },
    { url: '/privacy-policy', priority: 0.3, changeFreq: 'yearly', lastModified: now },
    { url: '/telemetry', priority: 0.3, changeFreq: 'yearly', lastModified: now },
    { url: '/toc', priority: 0.3, changeFreq: 'monthly', lastModified: now },
  ]
  
  // Add docs root if it exists
  const maybeDocsRoot: RouteInfo[] = fs.existsSync(path.join(process.cwd(), 'content', 'docs', 'index.mdx')) 
    ? [{ url: '/docs', priority: 0.9, changeFreq: 'weekly', lastModified: now }] 
    : []

  const docsRoutes = getDocsRoutes()
  const allRoutes = [...baseRoutes, ...maybeDocsRoot, ...docsRoutes]
  
  // Remove duplicates and convert to sitemap format
  const uniqueRoutes = Array.from(
    new Map(allRoutes.map(route => [route.url, route])).values()
  )

  return uniqueRoutes.map((route) => ({
    url: `${SITE_URL}${route.url}`,
    lastModified: route.lastModified || now,
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }))
}