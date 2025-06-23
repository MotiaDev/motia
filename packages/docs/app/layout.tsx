import type { Metadata, ResolvingMetadata } from 'next'
import { DM_Mono, Geist } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { RootProvider } from 'fumadocs-ui/provider'
import { GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/react'
import { headers } from 'next/headers'

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


const metaTitle = 'Motia: Unified Backend Framework for APIs, Events and AI Agents'

const metaDescription =
  'Multi-language cloud functions runtime for API endpoints, background jobs, and agentic workflows using Motia Steps. Preview them in the Workbench, ship to zero-config infrastructure, and monitor in the Cloud.'

export async function generateMetadata(
  _props: never,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'motia.dev';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const base = `${proto}://${host}`;

  const ogImage = `${base}/og-image-updated.jpg`;

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
      icon: [{ url: '/app/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
      apple: [{ url: '/apple-icon.png', type: 'image/png' }],
      other: [
        {
          rel: 'mask-icon',
          url: '/safari-pinned-tab.svg',
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

      // PWA related
      'theme-color': '#18181b',
      'application-name': 'motia',
      'apple-mobile-web-app-title': 'motia',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#18181b',
      canonical: base,
    },
  };
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
      </head>
      <body
        className={`${geistSans.variable} ${dmMono.variable} ${tasaExplorer.variable} w-screen overflow-x-hidden antialiased`}
      >
        <RootProvider>
          {children}
          <Analytics />
        </RootProvider>
      </body>
    </html>
  )
}
