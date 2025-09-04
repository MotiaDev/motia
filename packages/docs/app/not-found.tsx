'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePlausibleTracking } from '../hooks/usePlausibleTracking'

export default function NotFound() {
  const { track404Error } = usePlausibleTracking()

  useEffect(() => {
    // Track 404 error with the current path
    if (typeof window !== 'undefined') {
      track404Error(window.location.pathname)
    }
  }, [track404Error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h2 className="text-6xl font-bold text-gray-900 mb-4">404</h2>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
