import type { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://motia.dev'

function getDocsRoutes(): string[] {
  const routes: string[] = []
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
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        const routePath = `${prefix}/${entry}`
        const indexPath = path.join(fullPath, 'index.mdx')
        if (fs.existsSync(indexPath)) {
          routes.push(routePath)
        }
        walk(fullPath, routePath)
      } else if (entry.endsWith('.mdx') && entry !== 'index.mdx') {
        const routeName = entry.replace(/\.mdx$/, '')
        routes.push(`${prefix}/${routeName}`)
      }
    }
  }

  if (fs.existsSync(docsRoot)) {
    walk(docsRoot, '/docs')
  }

  return routes
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseRoutes = ['/', '/manifesto', '/privacy-policy', '/telemetry', '/toc']
  const maybeDocsRoot = fs.existsSync(path.join(process.cwd(), 'content', 'docs', 'index.mdx')) ? ['/docs'] : []

  const docsRoutes = getDocsRoutes()
  const allRoutes = Array.from(new Set([...baseRoutes, ...maybeDocsRoot, ...docsRoutes]))

  const now = new Date()
  return allRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
  }))
}
