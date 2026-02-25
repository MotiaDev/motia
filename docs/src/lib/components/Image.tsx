'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../utils'

type ImageProps = {
  src: string
  alt: string
  className?: string
}

function getThemedSrc(defaultSrc: string, isDark: boolean): string {
  const lastDotIndex = defaultSrc.lastIndexOf('.')
  const imageName = defaultSrc.slice(0, lastDotIndex)
  const extension = defaultSrc.slice(lastDotIndex + 1)
  return isDark ? `${imageName}-dark.${extension}` : `${imageName}-light.${extension}`
}

export const Image: React.FC<ImageProps> = ({ src: defaultSrc, alt, className }) => {
  const [isZoomed, setIsZoomed] = useState(false)
  const [isGrow, setIsGrow] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState(defaultSrc)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const updateSrc = () => {
      const isDark = html.classList.contains('dark')
      setResolvedSrc(getThemedSrc(defaultSrc, isDark))
    }

    updateSrc()

    const observer = new MutationObserver(updateSrc)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [defaultSrc])

  const handleError = () => {
    setResolvedSrc(defaultSrc)
  }

  useEffect(() => {
    if (!isZoomed) {
      setIsGrow(false)
      return
    }

    const timeout = setTimeout(() => setIsGrow(true), 15)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomed(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isZoomed])

  return (
    <>
      <img
        src={resolvedSrc}
        alt={alt}
        suppressHydrationWarning
        onError={handleError}
        className={cn('w-full h-auto cursor-pointer transition-transform active:scale-95', className)}
        onClick={() => setIsZoomed(true)}
      />
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsZoomed(false)}
          aria-modal="true"
          role="dialog"
        >
          <button
            ref={closeButtonRef}
            onClick={() => setIsZoomed(false)}
            aria-label="Close image preview"
            className="absolute top-6 right-6 md:top-10 md:right-10 z-10 rounded-full p-1.5 text-white bg-black/60 hover:bg-black/80 transition shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
            tabIndex={0}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={resolvedSrc}
            alt={alt}
            className={cn(
              'max-w-full max-h-full object-contain shadow-xl bg-white/5 rounded-lg',
              'transition-transform duration-300 ease-in-out',
              isGrow ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
            )}
            style={{ transitionProperty: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  )
}
