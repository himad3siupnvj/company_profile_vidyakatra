import Link from "next/link";
import Image from "next/image";
import kabinetImage from "@/assets/kabinet.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicNews } from "@/lib/public-articles";
import { getPublicHomeStats } from "@/lib/public-home-stats";
import { getPublicSiteSettings } from "@/lib/public-site-settings";
import {
  Users,
  Calendar,
  Building2,
  Newspaper,
  ArrowRight,
  Play,
  User,
  Clock,
} from "lucide-react";

import logoKabinet from "@/assets/logoKabinet.png";
import { getProfileContent } from "@/lib/profile-content";

export const revalidate = 300;

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    berita: "Berita",
    kegiatan: "Kegiatan",
    pengumuman: "Pengumuman",
    prestasi: "Prestasi",
  };

  return labels[category] ?? "Berita";
}

export default async function HomePage() {
  const [news, homeStats, settings, profileContent] = await Promise.all([
    getPublicNews(),
    getPublicHomeStats(),
    getPublicSiteSettings(),
    getProfileContent(),
  ]);
  const latestNews = news.slice(0, 3);
  const { homeContent } = settings;
  const stats = [
    { label: "Anggota Aktif", value: homeStats.activeMembers, icon: Users },
    { label: "Unit Kerja Aktif", value: homeStats.activeUnits, icon: Building2 },
    { label: "Berita Terbit", value: homeStats.publishedArticles, icon: Newspaper },
    { label: "Periode Aktif", value: homeStats.activePeriod, icon: Calendar },
  ];

  return (
    <>
      {/* Cabinet Banner — full bleed */}
      <section>
        <div className="relative mx-auto w-full max-w-7xl aspect-[21/9] overflow-hidden border-b border-border shadow-lg shadow-black/5">
          <Image
            src={homeContent.hero.backgroundImage || kabinetImage}
            alt="Foto kabinet HIMA D3 SI"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
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

      {/* Cabinet Section */}
      <section className="py-12 md:py-16 relative overflow-hidden">
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
                    className="h-48 w-48 md:h-64 md:w-64 object-contain transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-8 md:p-14">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary mb-5">
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

      {/* Company Profile Video */}
      <section className="border-y border-border bg-muted/40 py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
                <Play className="h-4 w-4" />
                Video profil
              </div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {homeContent.video.title}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {homeContent.video.description}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xl shadow-black/5">
              <div className="aspect-video">
                <iframe
                  src={homeContent.video.url}
                  className="h-full w-full"
                  title="Video company profile HIMA D3 Sistem Informasi UPNVJ Kabinet Vidyakatra"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-sm">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Berita terbaru</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Kegiatan &amp; Berita Acara
              </h2>
            </div>
            <Link href="/berita">
              <Button
                variant="outline"
                className="gap-2 border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((news) => (
              <Link key={news.id} href={`/berita/${news.slug}`} className="min-w-0">
                <Card className="group h-full gap-0 overflow-hidden border-border bg-card p-0 shadow-md shadow-black/[0.03] transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <Image
                      src={news.image}
                      alt={news.title}
                      width={800}
                      height={500}
                      className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-xs">
                        {getCategoryLabel(news.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {news.date}
                      </span>
                    </div>
                    <h3 className="mb-2 line-clamp-2 font-semibold leading-tight text-primary transition-colors">
                      {news.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {news.excerpt}
                    </p>
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
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
