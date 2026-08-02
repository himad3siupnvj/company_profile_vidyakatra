"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { UnitMember } from "@/lib/public-content"

type MemberCarouselProps = {
  members: UnitMember[]
  centered?: boolean
  hideButtons?: boolean
}

const autoplayDelayMs = 3500

export function MemberCarousel({ members, centered, hideButtons }: MemberCarouselProps) {
  const align = centered ? "center" : "start"
  const [api, setApi] = useState<CarouselApi>()
  const [isPaused, setIsPaused] = useState(false)
  const slides = members

  useEffect(() => {
    if (!api || members.length < 2 || isPaused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const intervalId = window.setInterval(() => api.scrollNext(), autoplayDelayMs)

    return () => window.clearInterval(intervalId)
  }, [api, isPaused, members.length])

  if (centered || members.length <= 4) {
    return (
      <div className={`flex justify-center gap-4 sm:gap-6 ${centered ? "flex-nowrap" : "flex-wrap"}`}>
        {members.map((member, index) => (
          <div
            key={`${member.name}-${index}`}
            className="w-[calc(50%-0.5rem)] min-[480px]:w-[12rem] sm:w-[14rem]"
          >
            <Card className="group h-full gap-0 overflow-hidden border-border/50 bg-card py-0 shadow-soft transition-all hover:border-primary/40 hover:shadow-glow-primary rounded-[1.25rem]">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 479px) 50vw, 224px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardContent className="flex h-24 flex-col items-center justify-center p-3 text-center sm:p-4">
                <h3 className="w-full truncate text-sm font-semibold leading-snug sm:text-base">{member.name}</h3>
                <p className="mt-1 w-full truncate text-xs leading-relaxed text-primary/80 sm:text-sm">{member.role}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Carousel
      opts={{ align, loop: members.length > 4 }}
      setApi={setApi}
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsPaused(false)
        }
      }}
      onPointerDown={() => setIsPaused(true)}
      onPointerUp={() => setIsPaused(false)}
      onPointerCancel={() => setIsPaused(false)}
    >
      <CarouselContent className="-ml-3 sm:-ml-4">
        {slides.map((member, index) => (
          <CarouselItem
            key={`${member.name}-${index}`}
            className="basis-[72%] pl-3 min-[480px]:basis-[48%] sm:basis-[14rem] sm:pl-4"
          >
            <Card className="group h-full gap-0 overflow-hidden border-border/50 bg-card py-0 shadow-soft transition-all hover:border-primary/40 hover:shadow-glow-primary rounded-[1.25rem]">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 479px) 72vw, (max-width: 639px) 48vw, 224px"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardContent className="flex h-24 flex-col items-center justify-center p-3 text-center sm:p-4">
                <h3 className="w-full truncate text-sm font-semibold leading-snug sm:text-base">{member.name}</h3>
                <p className="mt-1 w-full truncate text-xs leading-relaxed text-primary/80 sm:text-sm">{member.role}</p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      {!hideButtons && members.length > 1 && (
        <>
          <CarouselPrevious className="-top-12 left-auto right-11 translate-y-0" />
          <CarouselNext className="-top-12 right-0 translate-y-0" />
        </>
      )}
    </Carousel>
  )
}
