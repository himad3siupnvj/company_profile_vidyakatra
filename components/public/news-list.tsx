"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  return (
    <>
      <section className="border-b border-border/50 bg-card/30 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Publikasi</p>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Berita dan kegiatan HIMA D3 SI
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Dokumentasi kegiatan, prestasi, dan pengumuman terbaru dari organisasi.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/30 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
              <TabsList className="h-auto flex-wrap border border-border/50 bg-muted/50">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
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
                className="border-border/50 bg-muted/50 pl-9 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredNews.map((news) => (
              <Link key={news.id} href={`/berita/${news.slug}`} className="group">
                <Card className="h-full gap-0 overflow-hidden border-border/50 bg-card p-0 transition-colors group-hover:border-primary/40">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <Image
                      src={news.image}
                      alt={news.title}
                      width={400}
                      height={250}
                      className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-secondary/20 text-xs capitalize text-secondary hover:bg-secondary/30">
                        {news.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{news.date}</span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 font-semibold leading-tight transition-colors group-hover:text-primary">
                      {news.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{news.excerpt}</p>
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
              </Link>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Tidak ada berita acara yang ditemukan</p>
            </div>
          )}

        </div>
      </section>
    </>
  )
}
