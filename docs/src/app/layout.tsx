import type React from 'react'
import { RootProvider } from 'fumadocs-ui/provider/next'
import './global.css'
import { Chivo_Mono } from 'next/font/google'
import Script from 'next/script'
import type { Metadata } from 'next'
import { LlmsTxtButton } from '@/lib/components/LlmsTxtButton'

const chivoMono = Chivo_Mono({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'iii Docs', template: '%s | iii Docs' },
  icons: {
    icon: [
      { url: '/docs/favicon/favicon.ico', sizes: 'any' },
      { url: '/docs/favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/docs/favicon/apple-touch-icon.png',
  },
  manifest: '/docs/favicon/site.webmanifest',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={chivoMono.className} suppressHydrationWarning>
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-E4G8GW1J2Q" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E4G8GW1J2Q');
          `}
        </Script>
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <LlmsTxtButton />
      </body>
    </html>
  )
}
