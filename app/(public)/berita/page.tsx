import type { Metadata } from "next"
import { LandingHero } from "@/components/public/landing-hero"
import { NewsList } from "@/components/public/news-list"
import { getPublicNews } from "@/lib/public-articles"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Berita",
}

export default async function BeritaPage() {
  const newsItems = await getPublicNews()

  return (
    <>
      <LandingHero
        eyebrow="Publikasi"
        title="Berita dan Kegiatan"
        description="Dokumentasi kegiatan, prestasi, dan pengumuman terbaru dari HIMA D3 Sistem Informasi UPNVJ."
        contentId="berita-list"
      />
      <NewsList newsItems={newsItems} />
    </>
  )
}
