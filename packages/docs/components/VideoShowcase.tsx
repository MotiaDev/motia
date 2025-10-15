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
  columns?: 1 | 2 | 3
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
      <div className="rounded-lg border border-red-200 dark:border-red-800 p-4 text-center">
        <p className="text-red-600 dark:text-red-400">Invalid YouTube URL: {video.url}</p>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className="group rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800">
      <div className="aspect-video relative">
        <iframe
          src={embedUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>
      {(video.title || video.description) && (
        <div className="p-4">
          {video.title && <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{video.title}</h3>}
          {video.description && <p className="text-gray-600 dark:text-gray-300 text-sm">{video.description}</p>}
        </div>
      )}
    </div>
  )
}

export function VideoShowcase({ videos, title = 'Video Showcase', description, columns = 2 }: VideoShowcaseProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <section className="py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
        {description && <p className="text-gray-600 dark:text-gray-300 text-lg">{description}</p>}
      </div>

      <div className={`grid gap-6 ${gridCols[columns]}`}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}

export default VideoShowcase
