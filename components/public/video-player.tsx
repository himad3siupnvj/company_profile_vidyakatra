"use client"

import { useState } from "react"
import { Play } from "lucide-react"

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

type VideoPlayerProps = {
  url: string
  title: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoId = getYouTubeVideoId(url)

  if (!videoId || isPlaying) {
    const separator = url.includes("?") ? "&" : "?"
    const embedUrl = isPlaying && videoId ? `${url}${separator}autoplay=1` : url

    return (
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label={`Putar video: ${title}`}
      className="group relative block h-full w-full"
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={`Pratinjau video: ${title}`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors duration-300 group-hover:bg-black/40">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl transition-transform duration-300 group-hover:scale-110">
          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
        </span>
      </span>
    </button>
  )
}
