'use client'

import React from 'react'

interface VideoItem {
  id: string
  title: string
  description?: string
  url: string
}

interface VideoShowcaseProps {
  videos: VideoItem[]
  title?: string
  description?: string
}

// Extract YouTube video ID from various YouTube URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

function VideoCard({ video }: { video: VideoItem }) {
  const videoId = extractYouTubeId(video.url)

  if (!videoId) {
    return (
      <div className="rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 text-center">
        <p className="text-red-700 dark:text-red-300 font-bold">Invalid YouTube URL: {video.url}</p>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`

  return (
    <div className="group flex flex-col h-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden">
      <div className="aspect-video relative bg-gray-200 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
        <iframe
          src={embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full absolute inset-0"
          loading="lazy"
        />
      </div>
      {(video.title || video.description) && (
        <div className="p-6 flex flex-col flex-grow bg-white dark:bg-gray-800">
          {video.title && (
            <h3 className="font-bold text-xl leading-snug mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {video.title}
            </h3>
          )}
          {video.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {video.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function VideoShowcase({ videos, title = 'Video Showcase', description }: VideoShowcaseProps) {
  return (
    <section className="py-10 w-full max-w-[1600px] mx-auto">
      <div className="mb-10 border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">{title}</h2>
        {description && <p className="text-xl text-gray-700 dark:text-gray-300 max-w-4xl leading-relaxed">{description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

export default VideoShowcase
