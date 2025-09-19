import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist. Explore Motia documentation and examples.',
  robots: {
    index: false,
    follow: false,
  },
}

const suggestedPages = [
  { title: 'Documentation Home', href: '/docs', description: 'Start with the main documentation' },
  { title: 'Getting Started', href: '/docs/getting-started', description: 'Learn how to build your first app' },
  { title: 'Examples', href: '/docs/examples', description: 'Explore real-world examples' },
  { title: 'Concepts', href: '/docs/concepts', description: 'Understand core framework concepts' },
  { title: 'Real-world Use Cases', href: '/docs/real-world-use-cases', description: 'Industry applications' },
]

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track with these helpful resources.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {suggestedPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {page.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
        
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Browse Docs
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please{' '}
            <a
              href="https://github.com/MotiaDev/motia/issues"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              report it on GitHub
            </a>
          </p>
        </div>
      </div>

      {/* Add structured data for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: '404 - Page Not Found',
            description: 'The page you are looking for does not exist.',
            url: 'https://motia.dev/404',
            mainEntity: {
              '@type': 'Thing',
              name: 'Page Not Found',
              description: 'The requested page could not be found.',
            },
          }),
        }}
      />
    </div>
  )
}