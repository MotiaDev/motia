import type { Metadata } from 'next'
import { DM_Mono, Geist } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { RootProvider } from 'fumadocs-ui/provider'
import type { WithContext, Organization } from 'schema-dts'
import { DOMAIN_URL } from '@/utils/constants'

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
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
})

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-P6672CSW'
const SLACK_APP_ID = process.env.NEXT_PUBLIC_SLACK_APP_ID ?? 'YOUR_SLACK_APP_ID'
const YANDEX_VERIFICATION = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? 'YOUR_YANDEX_VERIFICATION'
const BING_VERIFICATION = process.env.NEXT_PUBLIC_BING_VERIFICATION ?? 'YOUR_BING_VERIFICATION'
const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? 'YOUR_GOOGLE_VERIFICATION'

const metaTitle = 'Motia - AI Agent Framework for Software Engineering Teams'
const metaDescription =
  'Multi-language cloud functions runtime for API endpoints, background jobs, and agentic workflows using Motia Steps. Preview them in the Workbench, ship to zero-config infrastructure, and monitor in the Cloud.'
const ogImagePath = '/public/og-image.webp'
const hostedImagePath = DOMAIN_URL + ogImagePath
export const metadata: Metadata = {
  title: {
    template: '%s | motia',
    default: metaTitle,
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
  metadataBase: new URL('https://motia.dev'),

  // Standard OpenGraph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: DOMAIN_URL,
    siteName: 'motia',
    title: metaTitle,
    description: metaDescription,
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: metaTitle,
      },
    ],
  },

  // Twitter/X
  twitter: {
    card: 'summary_large_image',
    site: '@motiadev',
    creator: '@motiadev',
    title: metaTitle,
    description: metaDescription,
    images: [ogImagePath],
  },

  // Icons and PWA
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

  // Additional metadata
  other: {
    // Twitter alt text
    'twitter:image:alt': metaTitle,

    // Instagram
    'instagram:card': 'summary_large_image',
    'instagram:title': metaTitle,
    'instagram:description': metaDescription,
    'instagram:image': 'https://motia.dev/og-image.png',

    // Reddit
    'reddit:title': metaTitle,
    'reddit:description': metaDescription,
    'reddit:image': hostedImagePath,

    // LinkedIn
    'linkedin:card': 'summary_large_image',
    'linkedin:title': metaTitle,
    'linkedin:description': metaDescription,
    'linkedin:image': hostedImagePath,

    // Slack
    'slack-app-id': SLACK_APP_ID,

    // PWA related
    'theme-color': '#18181b',
    'application-name': 'motia',
    'apple-mobile-web-app-title': 'motia',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#18181b',
    'msapplication-config': '/browserconfig.xml',
    'format-detection': 'telephone=no',

    // Search Engine
    'google-site-verification': GOOGLE_VERIFICATION,
    'yandex-verification': YANDEX_VERIFICATION,
    'bing-verification': BING_VERIFICATION,

    // Canonical URL (important for SEO)
    canonical: DOMAIN_URL,
  },

  // Robots
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

  // Verification for webmaster tools
  verification: {
    google: GOOGLE_VERIFICATION,
  },
}

// Define typed JSON-LD structured data using schema-dts Organization type
const structuredData: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Motia',
  url: DOMAIN_URL,
  logo: 'https://motia.dev/logos/logo-black.svg',
  sameAs: ['https://twitter.com/motiadev', 'https://github.com/MotiaDev/motia', 'https://discord.gg/nJFfsH5d6v'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${dmMono.variable} ${tasaExplorer.variable} w-screen overflow-x-hidden antialiased`}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
