"use client"

import { ChevronDown } from "lucide-react"

type LandingHeroProps = {
  eyebrow: string
  title: string
  description: string
  contentId: string
}

export function LandingHero({ eyebrow, title, description, contentId }: LandingHeroProps) {
  function scrollToContent() {
    document.getElementById(contentId)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden border-b border-border bg-muted/40">
      <div className="absolute inset-0 bg-radial-glow opacity-50" />
      <div className="absolute inset-0 bg-grid-pattern-sm" />

      <div className="relative mx-auto w-full max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
          <h1 className="text-4xl font-black tracking-tight text-balance md:text-6xl text-gradient">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToContent}
        aria-label="Scroll ke konten"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-card/60 p-3 text-muted-foreground shadow-soft backdrop-blur-sm transition-all hover:border-primary/50 hover:text-primary animate-bounce motion-reduce:animate-none"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </section>
  )
}
