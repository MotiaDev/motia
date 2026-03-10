import { source } from '@/lib/source'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://iii.dev'

export function GET() {
  const urls = source.getPages().map((page) => {
    const loc = `${BASE_URL}${page.url}`
    return `  <url><loc>${loc}</loc></url>`
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n')

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
