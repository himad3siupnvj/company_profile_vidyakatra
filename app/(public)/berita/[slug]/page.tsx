import { notFound } from "next/navigation"
import { Building2, Calendar, Clock, FileText, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ArticleBackButton } from "@/components/public/article-back-button"
import { ArticleDocumentRenderer } from "@/components/public/article-document-renderer"
import { ShareArticleButton } from "@/components/public/share-article-button"
import type { ArticleDocument } from "@/lib/article-content"
import { getPublicNewsBySlug } from "@/lib/public-articles"
import { newsData } from "@/lib/public-content"

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return newsData.map((news) => ({ slug: news.slug }))
}

export const revalidate = 300

const categoryLabels = {
  berita: "Berita Acara",
  kegiatan: "Kegiatan",
  pengumuman: "Pengumuman",
  prestasi: "Prestasi",
} as const

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params
  const news = await getPublicNewsBySlug(slug)

  if (!news) {
    notFound()
  }

  const document: ArticleDocument =
    news.document ?? {
      type: "doc",
      content: news.content.map((paragraph, index) => ({
        id: `${news.slug}-${index}`,
        type: "paragraph",
        text: paragraph,
      })),
    }

  const categoryLabel = categoryLabels[news.category] ?? "Berita Acara"
  const metaItems = [
    { label: "Tanggal", value: news.date, icon: Calendar },
    ...(news.unitName ? [{ label: "Unit", value: news.unitName, icon: Building2 }] : []),
    { label: "Penulis", value: news.author, icon: User },
    { label: "Waktu baca", value: news.readTime, icon: Clock },
  ]

  return (
    <article className="bg-background">
      <section className="relative overflow-hidden border-b border-border bg-muted/40 py-10 md:py-14">
        <div className="absolute inset-0 bg-radial-glow opacity-50" />
        <div className="absolute inset-0 bg-grid-pattern-sm" />

        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <ArticleBackButton />
              <span className="hidden h-4 w-px bg-border/70 sm:block" />
              <Badge className="gap-1.5 bg-primary/10 px-3 py-1 text-sm text-primary">
                <FileText className="h-3.5 w-3.5" />
                {categoryLabel}
              </Badge>
            </div>
            <ShareArticleButton
              title={news.title}
              text={news.excerpt}
              path={`/berita/${news.slug}`}
              className="w-fit border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Publikasi Resmi HIMA D3 SI UPNVJ
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-balance md:text-5xl text-gradient">
              {news.title}
            </h1>
            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {metaItems.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span>{item.value}</span>
                </span>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-border/80 bg-card px-5 py-7 shadow-soft md:px-8 md:py-10">
            <ArticleDocumentRenderer document={document} />
          </div>
        </div>
      </section>
    </article>
  )
}
