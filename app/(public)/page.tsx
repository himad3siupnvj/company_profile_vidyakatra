import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Suspense } from "react";
import kabinetImage from "@/assets/kabinet.jpg";
import logoKabinet from "@/assets/logoKabinet.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/public/video-player";
import { SectionSkeleton } from "@/components/public/section-skeleton";
import { cn } from "@/lib/utils";
import { getPublicNews } from "@/lib/public-articles";
import { getPublicSiteSettings } from "@/lib/public-site-settings";
import { getProfileContent } from "@/lib/profile-content";
import {
  Users,
  Building2,
  ArrowRight,
  Play,
  User,
  Clock,
} from "lucide-react";
import type { PublicNews } from "@/lib/public-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Beranda",
};

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    berita: "Berita",
    kegiatan: "Kegiatan",
    pengumuman: "Pengumuman",
    prestasi: "Prestasi",
  };

  return labels[category] ?? "Berita";
}

function HomeNewsCard({ news, featured = false, styleIdx = 0 }: { news: PublicNews; featured?: boolean; styleIdx?: number }) {
  const style = featured ? 'default' : (styleIdx % 2 === 0 ? 'default' : 'overlay')

  if (style === 'overlay') {
    return (
      <Link href={`/berita/${news.slug}`} className="group h-full">
        <Card className="relative h-full min-h-[24rem] overflow-hidden border-border bg-card p-0 shadow-soft transition-all hover:border-primary/50 hover:shadow-glow-primary">
          <Image src={news.image} alt={news.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <CardContent className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end p-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Badge className="bg-white/20 text-xs capitalize text-white backdrop-blur-sm hover:bg-white/30">
                {getCategoryLabel(news.category)}
              </Badge>
              <span className="text-xs text-white/70">{news.date}</span>
            </div>
            <h3 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-white">{news.title}</h3>
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
    <Link href={`/berita/${news.slug}`} className={cn("group min-w-0", featured && "md:col-span-2 lg:col-span-2")}>
      <Card className={cn("group h-full gap-0 overflow-hidden border-border bg-card p-0 shadow-soft transition-all hover:border-primary/50 hover:shadow-glow-primary", featured && "md:grid md:grid-cols-2")}>
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
        <CardContent className={cn("flex flex-col justify-center p-6", !featured && "")}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Badge className="bg-primary/10 text-xs capitalize text-primary hover:bg-primary/20">
              {getCategoryLabel(news.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">{news.date}</span>
          </div>
          <h3 className={cn("mb-2 font-bold leading-tight text-primary transition-colors", featured ? "text-xl line-clamp-2" : "text-base line-clamp-2")}>
            {news.title}
          </h3>
          <p className={cn("text-sm text-muted-foreground", featured ? "line-clamp-2" : "line-clamp-2")}>{news.excerpt}</p>
          {news.unitName && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{news.unitName}</span>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{news.author}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {news.readTime}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

async function HeroSection() {
  const { homeContent } = await getPublicSiteSettings()

  return (
    <section>
      <div className="relative mx-auto w-full max-w-7xl aspect-[21/9] overflow-hidden border-b border-border shadow-lg shadow-black/5">
        <Image
          src={homeContent.hero.backgroundImage || kabinetImage}
          alt="Foto kabinet HIMA D3 SI"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          fetchPriority="high"
          placeholder={homeContent.hero.backgroundImage ? "empty" : "blur"}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-6 flex flex-col items-center px-4 text-center md:top-8 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-bold leading-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-2xl md:text-4xl">
              {homeContent.hero.title}
            </h2>
            <p className="mt-2 text-xl font-semibold text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-2xl md:text-4xl">
              {homeContent.hero.subtitle}
            </p>
            <p className="mt-2 text-xl font-semibold text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-2xl md:text-4xl">
              {homeContent.hero.year}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

async function CabinetIntroSection() {
  const profileContent = await getProfileContent()

  return (
    <section className="py-12 md:py-16 relative overflow-hidden bg-radial-glow">
      <div className="mx-auto max-w-5xl px-4 md:px-6 relative z-10">
        <Card className="overflow-hidden rounded-[2rem] border-border shadow-xl shadow-black/5">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[20rem_1fr] items-center">
              <div className="flex justify-center p-12 md:p-16 h-full md:border-r border-border">
                <Image
                  src={logoKabinet}
                  alt={profileContent.intro.cabinetName}
                  width={320}
                  height={320}
                  sizes="(max-width: 768px) 192px, 256px"
                  className="h-48 w-48 md:h-64 md:w-64 object-contain transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-8 md:p-14">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gradient mb-5">
                  {profileContent.intro.cabinetName}
                </h2>
                <div className="space-y-4">
                  <p className="text-base md:text-lg leading-relaxed text-muted-foreground text-justify line-clamp-3">
                    {profileContent.intro.description}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-border">
                  <Link
                    href="/kabinet#struktur"
                    className="group inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-6 py-2.5 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    Lihat Struktur Kabinet
                    <Users className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

async function VideoSection() {
  const { homeContent } = await getPublicSiteSettings()

  return (
    <section className="border-y border-border bg-muted/40 py-14 md:py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow-secondary opacity-60" />
      <div className="mx-auto max-w-7xl px-4 md:px-6 relative">
        <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
              <Play className="h-4 w-4" />
              Video profil
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-gradient">
              {homeContent.video.title}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {homeContent.video.description}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xl shadow-black/5">
            <div className="aspect-video">
              <VideoPlayer url={homeContent.video.url} title={homeContent.video.title} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

async function NewsSection() {
  const news = await getPublicNews()
  const latestNews = news.slice(0, 3)

  return (
    <section className="border-y border-border bg-muted/30 py-16 md:py-20">
      <div className="mx-auto max-w-full px-8 md:px-14 lg:px-20">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Berita terbaru</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-gradient">
              Kegiatan &amp; Berita Acara
            </h2>
          </div>
          <Link href="/berita">
            <Button
              className="gap-2 border border-primary/30 bg-primary/10 px-6 py-5 text-sm font-semibold text-primary shadow-soft hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow-primary transition-all duration-300"
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        {latestNews.length <= 1 ? (
          <div className="mx-auto max-w-4xl">
            {latestNews.map((news) => (
              <HomeNewsCard key={news.id} news={news} featured />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((news, idx) => (
              <div key={news.id} className={cn("min-w-0", idx === 0 && "md:col-span-2 lg:col-span-2")}>
                <HomeNewsCard news={news} featured={idx === 0} styleIdx={idx} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<SectionSkeleton variant="hero" />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CabinetIntroSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <VideoSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <NewsSection />
      </Suspense>
    </>
  )
}
