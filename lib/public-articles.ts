import { and, desc, eq, isNull, sql } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { getDb } from "@/db"
import { articleCategories, articles, periods } from "@/db/schema"
import { getArticleReadTime, normalizeArticleDocument } from "@/lib/article-content"
import { publicCacheTags } from "@/lib/cache-tags"
import { newsData, type PublicNews } from "@/lib/public-content"

function formatPublicDate(value: Date | null) {
  const date = value ?? new Date()

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function getDocumentParagraphs(document: ReturnType<typeof normalizeArticleDocument>) {
  return document.content
    .filter((block) => block.type !== "image")
    .map((block) => block.text)
    .filter(Boolean)
}

async function getPublishedArticleRows(slug?: string) {
  const db = getDb()
  const filters = [
    eq(articles.status, "published"),
    eq(periods.status, "active"),
    isNull(articles.deletedAt),
    ...(slug ? [eq(articles.slug, slug)] : []),
  ]

  const query = db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      content: articles.content,
      categoryName: articleCategories.name,
      categorySlug: articleCategories.slug,
      authorName: articles.authorName,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      thumbnailUrl: articles.thumbnailUrl,
      readTime: articles.readTime,
      isFeatured: articles.isFeatured,
      unitName: articles.unitName,
    })
    .from(articles)
    .innerJoin(periods, eq(articles.periodId, periods.id))
    .leftJoin(articleCategories, eq(articles.categoryId, articleCategories.id))
    .where(and(...filters))
    .orderBy(desc(articles.publishedAt), desc(articles.createdAt))

  return slug ? query.limit(1) : query
}

function serializePublicArticle(row: Awaited<ReturnType<typeof getPublishedArticleRows>>[number]): PublicNews {
  const document = normalizeArticleDocument(row.content, row.excerpt ?? "")
  const category = row.categorySlug ?? "berita"

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: getDocumentParagraphs(document),
    document,
    date: formatPublicDate(row.publishedAt ?? row.createdAt),
    readTime: row.readTime ?? getArticleReadTime(document),
    author: row.authorName ?? "Tim Media",
    category: category === "kegiatan" || category === "pengumuman" || category === "prestasi" ? category : "berita",
    image: row.thumbnailUrl ?? "/news/default.jpg",
    featured: row.isFeatured,
    unitName: row.unitName ?? "",
  }
}

async function getPublicNewsFromStore() {
  try {
    const rows = await getPublishedArticleRows()

    return rows.map(serializePublicArticle)
  } catch {
    // Public pages stay available with curated fallback content when the database is unavailable.
    return newsData
  }
}

const getCachedPublicNews = unstable_cache(
  getPublicNewsFromStore,
  ["public-news"],
  { revalidate: 300, tags: [publicCacheTags.articles] },
)

const getCachedPublicNewsBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const rows = await getPublishedArticleRows(slug)

      return rows[0] ? serializePublicArticle(rows[0]) : undefined
    } catch {
      return newsData.find((item) => item.slug === slug)
    }
  },
  ["public-news-by-slug"],
  { revalidate: 300, tags: [publicCacheTags.articles] },
)

export async function getPublicNews() {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return getPublicNewsFromStore()
  }

  return getCachedPublicNews()
}

export async function getPublicNewsBySlug(slug: string) {
  try {
    const db = getDb()
    await db.update(articles).set({ views: sql`${articles.views} + 1` }).where(and(eq(articles.slug, slug), eq(articles.status, "published"), isNull(articles.deletedAt)))
  } catch {
    // Silently fail — view count is not critical
  }

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    try {
      const rows = await getPublishedArticleRows(slug)

      return rows[0] ? serializePublicArticle(rows[0]) : undefined
    } catch {
      return newsData.find((item) => item.slug === slug)
    }
  }

  return getCachedPublicNewsBySlug(slug)
}
