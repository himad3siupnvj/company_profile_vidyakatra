import { describe, expect, it } from "vitest"
import { createArticleSnapshot } from "@/lib/article-versioning"

describe("article versioning", () => {
  it("creates a stable JSON snapshot of editable article data", () => {
    const createdAt = new Date("2026-06-01T08:00:00.000Z")
    const updatedAt = new Date("2026-06-02T09:00:00.000Z")
    const publishedAt = new Date("2026-06-03T10:00:00.000Z")

    const snapshot = createArticleSnapshot({
      id: "article-1",
      title: "Judul Lama",
      slug: "judul-lama",
      excerpt: "Ringkasan",
      content: { type: "doc", content: [] },
      categoryId: null,
      status: "submitted",
      authorId: "user-1",
      authorName: "Tim Media",
      reviewerId: null,
      organizationalUnitId: null,
      unitName: null,
      divisionId: null,
      periodId: "period-1",
      thumbnailUrl: null,
      thumbnailAlt: null,
      seoTitle: null,
      seoDescription: null,
      canonicalUrl: null,
      ogImageUrl: null,
      readTime: "2 min",
      views: 12,
      isFeatured: false,
      rejectedNote: null,
      publishedAt,
      createdAt,
      updatedAt,
      deletedAt: null,
      deletedBy: null,
    })

    expect(snapshot).toMatchObject({
      title: "Judul Lama",
      status: "submitted",
      periodId: "period-1",
      views: 12,
      publishedAt: publishedAt.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    })
    expect(snapshot).not.toHaveProperty("deletedAt")
  })
})
