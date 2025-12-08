import type { Metadata, ResolvingMetadata } from 'next'
import { DM_Mono, Geist } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/react'
import { RootProvider } from 'fumadocs-ui/provider'
import { headers } from 'next/headers'
import Script from 'next/script'
import PlausibleProvider from 'next-plausible'

const tasaExplorer = localFont({
  src: [
    {
      path: '../public/fonts/TASA/TASAExplorer.woff2',
    },
  ],
  variable: '--font-tasa',
  display: 'swap',
})

const geistSans = Geist({
  weight: ['400', '500', '600'],
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
})

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-P6672CSW'
const ASSET_VERSION = process.env.NEXT_PUBLIC_ASSET_VERSION ?? '2'

const metaTitle = 'Motia - Unified Backend Framework for APIs, Events and AI Agents'
const metaDescription =
  'Multi-language cloud functions runtime for API endpoints, background jobs, and agentic workflows using Motia Steps. Preview them in the Workbench, ship to zero-config infrastructure, and monitor in the Cloud.'

export async function generateMetadata(_props: object, _parent: ResolvingMetadata): Promise<Metadata> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'motia.dev'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const base = `${proto}://${host}`

  const ogImage = `${base}/og-image-updated-new.jpg`

  return {
    metadataBase: new URL(base),
    title: {
      default: metaTitle,
      template: '%s | motia',
    },
    description: metaDescription,
    keywords: [
      'AI',
      'automation',
      'event-driven workflows',
      'software engineering',
      'backend automation',
      'developer tools',
    ],
    openGraph: {
      type: 'website',
      url: base,
      locale: 'en_US',
      siteName: 'Motia',
      title: metaTitle,
      description: metaDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
          type: 'image/jpeg',
        },
      ],
    },
    icons: {
      icon: [{ url: `/icon.png?v=${ASSET_VERSION}`, type: 'image/png' }],
      apple: [{ url: `/favicon.png?v=${ASSET_VERSION}`, type: 'image/png' }],
      other: [
        {
          rel: 'mask-icon',
          url: '/favicon.png',
          color: '#18181b',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@motiadev',
      creator: '@motiadev',
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Additional metadata
    other: {
      // Instagram
      'instagram:card': 'summary_large_image',
      'instagram:title': metaTitle,
      'instagram:description': metaDescription,
      'instagram:image': ogImage,

      // Reddit
      'reddit:title': metaTitle,
      'reddit:description': metaDescription,
      'reddit:image': ogImage,

      // LinkedIn
      'linkedin:card': 'summary_large_image',
      'linkedin:title': metaTitle,
      'linkedin:description': metaDescription,
      'linkedin:image': ogImage,

      // Additional Twitter tags for better iOS compatibility
      'twitter:url': base,
      'twitter:domain': 'motia.dev',
      'twitter:image:alt': metaTitle,

      // iOS Safari specific
      'format-detection': 'telephone=no',
      'apple-mobile-web-app-title': 'Motia',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',

      // PWA related
      'theme-color': '#18181b',
      'application-name': 'motia',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#18181b',

      // Additional meta for better social sharing
      'og:image:secure_url': ogImage,
      'og:image:alt': metaTitle,

      canonical: base,
    },
  }
}

function JsonLd({ id, data }: { id: string; data: Record<string, unknown> }) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleTagManager gtmId={GTM_ID} />
        {/* Start of Reo Javascript */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              !function(){var e,t,n;e="d8f0ce9cae8ae64",t=function(){Reo.init({clientID:"d8f0ce9cae8ae64", source: "internal"})},(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();
            `,
          }}
        />
        {/* End of Reo Javascript */}
        {/* Additional iOS/Safari compatibility */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />

        <JsonLd
          id="website-jsonld"
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: metaTitle,
            description: metaDescription,
            url: 'https://motia.dev',
            image: ['https://motia.dev/og-image-updated-new.jpg'],
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${dmMono.variable} ${tasaExplorer.variable} w-screen overflow-x-hidden antialiased`}
      >
        <PlausibleProvider
          domain="motia.dev"
          customDomain="https://plausible.io"
          scriptProps={{
            src: 'https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js',
          }}
        >
          <RootProvider>
            {children}
            <Analytics />
          </RootProvider>
        </PlausibleProvider>
      </body>
    </html>
  )
}
