'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import ButtonPrimary from '@/components/ButtonPrimary'
import ButtonSecondary from '@/components/ButtonSecondary'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-2xl px-6 text-center">
        <div className="mb-8">
          <h2 className="mb-4 bg-gradient-to-r from-blue-400 via-white to-blue-300 bg-clip-text text-8xl font-bold text-transparent">
            404
          </h2>
          <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        </div>

        <div className="mb-12">
          <h1 className="mb-4 text-3xl font-semibold text-white">Page Not Found</h1>
          <p className="mx-auto max-w-lg text-lg leading-relaxed text-white/70">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/">
            <ButtonPrimary className="gap-2 px-6 py-3 text-base hover:scale-105">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </ButtonPrimary>
          </Link>

          <Link href="/docs">
            <ButtonSecondary className="gap-2 px-6 py-3 text-base hover:scale-105 hover:bg-[rgba(255,255,255,0.12)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Browse Docs
            </ButtonSecondary>
          </Link>
        </div>
      </div>
    </div>
  )
}
