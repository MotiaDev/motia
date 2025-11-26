'use client'

import React, { useState, useRef, useEffect } from 'react'

interface VideoPlayerProps {
  videoPath: string
  title?: string
  thumbnailPath?: string
  gifPath?: string // Path to the animated GIF preview
  className?: string
}

export function VideoPlayer({ videoPath, title, thumbnailPath, gifPath, className = '' }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handlePlayClick = () => {
    setIsPlaying(true)
    setTimeout(() => {
      videoRef.current?.play()
    }, 100)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
        setIsPaused(false)
      } else {
        videoRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickPosition = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = clickPosition * videoRef.current.duration
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isPaused) setShowControls(false)
    }, 2500)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md overflow-hidden ${isFullscreen ? 'rounded-none border-none' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isPaused && setShowControls(false)}
    >
      <div className={`aspect-video relative bg-gray-200 dark:bg-gray-900 ${isFullscreen ? 'h-screen w-screen aspect-auto' : ''}`}>
        {!isPlaying ? (
          <button
            onClick={handlePlayClick}
            className="group absolute inset-0 w-full h-full block focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={title ? `Play ${title}` : 'Play video'}
          >
            {/* GIF or Thumbnail or Fallback */}
            {gifPath ? (
              <img 
                src={gifPath} 
                alt={title || "Video preview"} 
                className="w-full h-full object-cover"
              />
            ) : thumbnailPath ? (
              <img 
                src={thumbnailPath} 
                alt={title || "Video preview"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black/10 dark:bg-black/40" />
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-20 h-20 bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all shadow-lg">
                <svg
                  className="w-10 h-10 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className={`w-full h-full bg-black ${isFullscreen ? 'object-contain' : 'object-contain'}`}
              autoPlay
              preload="none"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPaused(true)}
              onClick={togglePlayPause}
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Custom Controls Overlay */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Progress Bar */}
              <div 
                className="w-full h-1.5 bg-white/30 rounded-full mb-3 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full relative transition-all"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <button 
                    onClick={togglePlayPause}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label={isPaused ? 'Play' : 'Pause'}
                  >
                    {isPaused ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    )}
                  </button>

                  {/* Mute/Unmute */}
                  <button 
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Fullscreen */}
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Center Play Button (when paused) */}
            {isPaused && (
              <button 
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/30"
              >
                <div className="w-20 h-20 bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all shadow-lg">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
