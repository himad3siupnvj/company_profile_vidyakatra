import { and, eq, isNull } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { articleCategories, articles, auditLogs, users } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"
import { can } from "@/lib/auth"
import { hasArticleTextContent, normalizeArticleDocument } from "@/lib/article-content"
import {
  articleWorkflowPermissions,
  canTransitionArticle,
  getNextArticleStatus,
  isArticleWorkflowAction,
  type ArticleStatus,
} from "@/lib/article-workflow"
import { saveArticleVersion } from "@/lib/article-versioning"
import { revalidatePublicArticles } from "@/lib/public-cache"

export const runtime = "nodejs"

function serializeArticle(row: {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: unknown
  categoryName: string | null
  categorySlug: string | null
  status: ArticleStatus
  authorName: string | null
  displayAuthorName: string | null
  publishedAt: Date | null
  createdAt: Date
  thumbnailUrl: string | null
  thumbnailAlt: string | null
  readTime: string | null
  isFeatured: boolean
  views: number
  rejectedNote: string | null
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: normalizeArticleDocument(row.content, row.excerpt ?? ""),
    category: row.categorySlug ?? row.categoryName ?? "uncategorized",
    categoryLabel: row.categoryName ?? "Uncategorized",
    status: row.status,
    author: row.displayAuthorName ?? row.authorName ?? "Tim Media",
    publishedAt: row.publishedAt?.toISOString().slice(0, 10) ?? null,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    thumbnail: row.thumbnailUrl ?? "/news/default.jpg",
    thumbnailAlt: row.thumbnailAlt ?? row.title,
    image: row.thumbnailUrl ?? "/news/default.jpg",
    readTime: row.readTime ?? "3 min",
    featured: row.isFeatured,
    views: row.views,
    rejectedNote: row.rejectedNote ?? null,
  }
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json()
  const id = String(payload.id ?? "")
  const action = payload.action

  if (!id || !isArticleWorkflowAction(action)) {
    return NextResponse.json({ error: "Valid article id and status action are required" }, { status: 400 })
  }

  const guard = await requireApiPermission(articleWorkflowPermissions[action])
  if (guard.response) return guard.response

  const db = getDb()
  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1)

  if (!article || article.deletedAt) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 })
  }

  if (
    action === "submit" &&
    !can(guard.user, "article.read_all") &&
    article.authorId !== guard.user?.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!canTransitionArticle(article.status, action)) {
    return NextResponse.json({ error: `Cannot ${action} article from ${article.status} status` }, { status: 409 })
  }

  if ((action === "submit" || action === "approve") && (!article.title.trim() || !hasArticleTextContent(article.content))) {
    return NextResponse.json({ error: "Article needs a title and content before status update" }, { status: 400 })
  }

  const rejectedNote = action === "reject" ? String(payload.rejectedNote ?? "").trim() : null

  if (action === "reject" && !rejectedNote) {
    return NextResponse.json({ error: "Rejected note is required" }, { status: 400 })
  }

  const now = new Date()
  const nextStatus = getNextArticleStatus(action)
  const updated = await db.transaction(async (tx) => {
    const [result] = await tx
      .update(articles)
      .set({
        status: nextStatus,
        reviewerId: action === "approve" || action === "reject" ? guard.user?.id ?? null : article.reviewerId,
        rejectedNote: action === "reject" ? rejectedNote : null,
        publishedAt: action === "approve" ? now : action === "restore" ? null : article.publishedAt,
        updatedAt: now,
      })
      .where(
        and(
          eq(articles.id, id),
          eq(articles.status, article.status),
          isNull(articles.deletedAt),
        ),
      )
      .returning()

    if (!result) return null

    if (action === "approve") {
      await saveArticleVersion(tx, article, guard.user?.id ?? null, "publish")
    }

    await tx.insert(auditLogs).values({
      actorId: guard.user?.id ?? null,
      action: `article.${action}`,
      entityType: "article",
      entityId: id,
      metadata: {
        previousStatus: article.status,
        newStatus: nextStatus,
      },
      createdAt: now,
    })

    return result
  })

  if (!updated) {
    return NextResponse.json({ error: "Article status changed. Refresh and try again." }, { status: 409 })
  }

  const [category] = updated.categoryId
    ? await db.select().from(articleCategories).where(eq(articleCategories.id, updated.categoryId)).limit(1)
    : [null]
  const [author] = updated.authorId
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, updated.authorId)).limit(1)
    : [null]

  revalidatePublicArticles()

  return NextResponse.json({
    article: serializeArticle({
      ...updated,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
      authorName: author?.name ?? null,
      displayAuthorName: updated.authorName,
    }),
  })
}
