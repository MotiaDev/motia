import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://motia.dev'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Block common crawl-heavy directories
        disallow: [
          '/api/',
          '/_next/',
          '/static/',
          '/.well-known/',
          // Block temp/build files
          '/tmp/',
          '/node_modules/',
          '/dist/',
          '/build/',
          // Block admin/internal paths
          '/admin/',
          '/internal/',
          '/debug/',
          // Block query parameters that create duplicate content
          '/*?*utm_*',
          '/*?*ref=*',
          '/*?*source=*',
          '/*?*medium=*',
          '/*?*campaign=*',
          // Block draft/preview content
          '/draft/',
          '/preview/',
          '/temp/',
        ],
      },
      // Allow specific search engines full access
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/static/',
          '/tmp/',
          '/node_modules/',
          '/admin/',
          '/internal/',
          '/debug/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/static/',
          '/tmp/',
          '/node_modules/',
          '/admin/',
          '/internal/',
          '/debug/',
        ],
      },
      // Block AI training crawlers if desired
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}