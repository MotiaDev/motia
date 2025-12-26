import { RootProvider } from 'fumadocs-ui/provider/next'
import './global.css'
import { JetBrains_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  weight: ['300', '400', '500', '600', '700', '800'],
})

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={jetbrainsMono.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
