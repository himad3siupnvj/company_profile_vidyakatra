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

    if (style === 'overlay') {
      return (
        <Link href={`/berita/${news.slug}`} className="group h-full">
          <Card className="relative h-full min-h-[24rem] overflow-hidden border-border bg-card p-0 shadow-soft transition-all hover:border-primary/50 hover:shadow-glow-primary rounded-[1.25rem]">
            <Image
              src={news.image}
              alt={news.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <CardContent className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-6">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge className="bg-white/20 text-xs capitalize text-white backdrop-blur-sm hover:bg-white/30">
                  {news.category}
                </Badge>
                <span className="text-xs text-white/70">{news.date}</span>
              </div>
              <h3 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-white">
                {news.title}
              </h3>
              <p className="line-clamp-2 text-sm text-white/70">{news.excerpt}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {news.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {news.readTime}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      )
    }

    return (
      <Link href={`/berita/${news.slug}`} className={cn("group h-full min-w-0", featured && "md:col-span-2 lg:col-span-2")}>
        <Card className={cn(
          "h-full gap-0 overflow-hidden border-border bg-card p-0 shadow-soft transition-all hover:border-primary/50 hover:shadow-glow-primary rounded-[1.25rem]",
          featured && "md:grid md:grid-cols-2"
        )}>
          <div className={cn("relative overflow-hidden bg-muted", featured ? "aspect-[16/10] md:aspect-auto md:h-full" : "aspect-[16/10]")}>
            <Image
              src={news.image}
              alt={news.title}
              width={featured ? 800 : 600}
              height={500}
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
              className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <CardContent className="flex flex-col justify-center p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Badge className="bg-primary/10 text-xs capitalize text-primary hover:bg-primary/20">
                {news.category}
              </Badge>
              <span className="text-xs text-muted-foreground">{news.date}</span>
            </div>
            <h3 className={cn("mb-2 font-bold leading-tight text-primary transition-colors", featured ? "text-xl line-clamp-2" : "text-base line-clamp-2")}>
              {news.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{news.excerpt}</p>
            {news.unitName && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {news.unitName}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {news.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {news.readTime}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <section id="berita-list" className="border-y border-border/50 bg-background py-12 md:py-16">
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
            <div className="grid gap-6 md:grid-cols-2">
              {filteredNews.map((news, idx) => (
                <NewsCard key={news.id} news={news} styleIdx={idx} />
              ))}
            </div>
          ) : filteredNews.length === 3 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNews.map((news, idx) => (
                <NewsCard key={news.id} news={news} styleIdx={idx} />
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredNews.map((news, idx) => (
                <NewsCard key={news.id} news={news} featured={idx === 0} styleIdx={idx} />
              ))}
            </div>
          )}

        </div>
      </section>
  )
}
