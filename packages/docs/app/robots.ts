import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://motia.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/docs/', '/manifesto', '/privacy-policy', '/telemetry', '/toc'],
        disallow: ['/_next/static/', '/_next/', '/static/', '/api/', '/*.mdx$', '/favicon.ico?*', '*.css?*', '*.js?*'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
