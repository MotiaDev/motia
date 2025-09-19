'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

interface StructuredDataProps {
  type?: 'WebSite' | 'WebPage' | 'TechArticle' | 'SoftwareApplication' | 'Organization'
  title?: string
  description?: string
  author?: string
  datePublished?: string
  dateModified?: string
  url?: string
}

export function StructuredData({
  type = 'WebPage',
  title,
  description,
  author = 'Motia',
  datePublished,
  dateModified,
  url,
}: StructuredDataProps) {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://motia.dev'
  const pageUrl = url || `${baseUrl}${pathname}`
  
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      url: pageUrl,
      name: title || 'Motia - Unified Backend Framework',
      description: description || 'Multi-language cloud functions runtime for API endpoints, background jobs, and agentic workflows using Motia Steps.',
    }

    switch (type) {
      case 'WebSite':
        return {
          ...baseData,
          '@type': 'WebSite',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Motia',
            url: baseUrl,
            logo: `${baseUrl}/icon.png`,
          },
        }

      case 'TechArticle':
        return {
          ...baseData,
          '@type': 'TechArticle',
          author: {
            '@type': 'Organization',
            name: author,
            url: baseUrl,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Motia',
            url: baseUrl,
            logo: `${baseUrl}/icon.png`,
          },
          datePublished: datePublished || new Date().toISOString(),
          dateModified: dateModified || new Date().toISOString(),
          mainEntityOfPage: pageUrl,
          headline: title,
        }

      case 'SoftwareApplication':
        return {
          ...baseData,
          '@type': 'SoftwareApplication',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Cross-platform',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          downloadUrl: 'https://www.npmjs.com/package/motia',
          softwareVersion: 'latest',
          programmingLanguage: ['TypeScript', 'JavaScript', 'Python'],
        }

      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Motia',
          url: baseUrl,
          logo: `${baseUrl}/icon.png`,
          description: 'Unified backend framework for APIs, events and AI agents',
          sameAs: [
            'https://github.com/MotiaDev/motia',
            'https://twitter.com/motiadev',
          ],
          foundingDate: '2024',
          founders: [
            {
              '@type': 'Person',
              name: 'Motia Team',
            },
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            url: `${baseUrl}/contact`,
          },
        }

      default:
        return {
          ...baseData,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Motia',
            url: baseUrl,
          },
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: generateBreadcrumbList(pathname),
          },
        }
    }
  }

  const generateBreadcrumbList = (path: string) => {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@id': baseUrl,
          name: 'Home',
        },
      },
    ]

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      breadcrumbs.push({
        '@type': 'ListItem',
        position: index + 2,
        item: {
          '@id': `${baseUrl}${currentPath}`,
          name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        },
      })
    })

    return breadcrumbs
  }

  return (
    <Script
      id={`structured-data-${type.toLowerCase()}-${pathname.replace(/[^a-zA-Z0-9]/g, '-')}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData()),
      }}
    />
  )
}
