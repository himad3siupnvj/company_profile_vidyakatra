"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Building2, Clock, Search, User } from "lucide-react"
import type { PublicNews } from "@/lib/public-content"

const categories = [
  { id: "all", label: "Semua" },
  { id: "berita", label: "Berita Acara" },
  { id: "kegiatan", label: "Kegiatan" },
  { id: "pengumuman", label: "Pengumuman" },
  { id: "prestasi", label: "Prestasi" },
]

type NewsListProps = {
  newsItems: PublicNews[]
}

export function NewsList({ newsItems }: NewsListProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredNews = newsItems.filter((news) => {
    const matchesCategory = activeCategory === "all" || news.category === activeCategory
    const matchesSearch =
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.excerpt.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  function NewsCard({ news, featured = false, styleIdx = 0 }: { news: PublicNews; featured?: boolean; styleIdx?: number }) {
    const style = featured ? 'default' : (styleIdx % 2 === 0 ? 'default' : 'overlay')

    return (
      <Link href={`/berita/${news.slug}`} className="group h-full">
        {style === 'overlay' ? (
          <Card className="relative h-full overflow-hidden border-border/50 bg-card p-0 shadow-soft transition-all group-hover:border-primary/40 group-hover:shadow-glow-primary rounded-[1.25rem]">
            <div className="relative h-full min-h-[22rem]">
              <Image
                src={news.image}
                alt={news.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              <CardContent className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="bg-white/20 text-xs capitalize text-white backdrop-blur-sm hover:bg-white/30">
                    {news.category}
                  </Badge>
                  <span className="text-xs text-white/70">{news.date}</span>
                </div>
                <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-white">
                  {news.title}
                </h3>
                <p className="line-clamp-2 text-sm text-white/70">{news.excerpt}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {news.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {news.readTime}
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        ) : (
          // default style
          <Card className={cn(
            "h-full gap-0 overflow-hidden border-border/50 bg-card p-0 shadow-soft transition-all group-hover:border-primary/40 group-hover:shadow-glow-primary rounded-[1.25rem] relative",
            featured && "sm:grid sm:grid-cols-2 sm:gap-0"
          )}>
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn("relative overflow-hidden bg-muted", featured ? "aspect-[16/9] sm:aspect-auto sm:h-full" : "aspect-[16/10]")}>
              <Image
                src={news.image}
                alt={news.title}
                width={featured ? 600 : 400}
                height={featured ? 340 : 250}
                sizes={featured ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
                className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <CardContent className={cn("p-4", featured && "flex flex-col justify-center sm:p-6")}>
              <div className="mb-2 flex items-center gap-2">
                <Badge className="bg-secondary/20 text-xs capitalize text-secondary hover:bg-secondary/30">
                  {news.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{news.date}</span>
              </div>
              <h3 className={cn("mb-2 font-semibold leading-tight transition-colors group-hover:text-primary", featured ? "line-clamp-3 text-lg" : "line-clamp-2")}>
                {news.title}
              </h3>
              <p className={cn("text-sm text-muted-foreground", featured ? "line-clamp-3" : "line-clamp-2")}>{news.excerpt}</p>
              <div className={"mt-3 flex items-center gap-3 text-xs text-muted-foreground" + (news.unitName ? "" : " hidden")}>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {news.unitName}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {news.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {news.readTime}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </Link>
    )
  }

  return (
    <>
      <section className="border-b border-border/50 bg-muted/40 py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-40" />
        <div className="mx-auto max-w-7xl px-4 md:px-6 relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Publikasi</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl text-gradient">
              Berita dan kegiatan HIMA D3 SI
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Dokumentasi kegiatan, prestasi, dan pengumuman terbaru dari organisasi.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-background py-12 md:py-16">
        <div className="mx-auto max-w-full px-8 md:px-14 lg:px-20">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
              <TabsList className="h-auto flex-wrap border border-border/40 bg-muted/50 p-1 rounded-[1.25rem]">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari berita acara..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="border-border/50 bg-muted/50 pl-9 focus:border-primary/50 rounded-[1.25rem]"
              />
            </div>
          </div>

          {filteredNews.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Tidak ada berita acara yang ditemukan</p>
            </div>
          ) : filteredNews.length === 1 ? (
            <div className="mx-auto max-w-4xl">
              <NewsCard news={filteredNews[0]} featured />
            </div>
          ) : filteredNews.length === 2 ? (
            <div className="grid gap-8 md:grid-cols-2">
              {filteredNews.map((news, idx) => (
                <NewsCard key={news.id} news={news} featured styleIdx={idx} />
              ))}
            </div>
          ) : filteredNews.length === 3 ? (
            <div className="grid gap-8">
              <NewsCard news={filteredNews[0]} featured />
              <div className="grid gap-8 md:grid-cols-2">
                <NewsCard news={filteredNews[1]} styleIdx={1} />
                <NewsCard news={filteredNews[2]} styleIdx={2} />
              </div>
            </div>
          ) : (
            <div className="grid gap-8">
              <div className="mx-auto w-full max-w-6xl">
                <NewsCard news={filteredNews[0]} featured />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredNews.slice(1).map((news, idx) => (
                  <NewsCard key={news.id} news={news} styleIdx={idx + 1} />
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
