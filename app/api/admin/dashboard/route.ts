import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { requireApiPermission } from "@/lib/api-guard"

export const runtime = "nodejs"

type ArticleStatus = "draft" | "submitted" | "approved" | "rejected" | "published" | "archived"

const statusDefaults: Record<ArticleStatus, number> = {
  draft: 0,
  submitted: 0,
  approved: 0,
  rejected: 0,
  published: 0,
  archived: 0,
}

const dashboardQueryTimeoutMs = 5000

function createEmptyDashboardSummary(warning?: string) {
  return {
    stats: {
      articles: {
        total: 0,
        views: 0,
        byStatus: { ...statusDefaults },
      },
      organization: {
        units: 0,
        departments: 0,
        bureaus: 0,
      },
      users: {
        total: 0,
        active: 0,
        unclaimed: 0,
      },
      members: {
        total: 0,
      },
    },
    editorialQueue: [],
    reviewQueue: [],
    rejectedArticles: [],
    recentActivity: [],
    warning,
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD"
}

function formatAuditAction(action: string) {
  const labels: Record<string, string> = {
    "article.update": "memperbarui artikel",
    "article.submit": "mengajukan artikel",
    "article.approve": "mempublikasikan artikel",
    "article.reject": "menolak artikel",
    "article.archive": "mengarsipkan artikel",
    "asset.upload": "mengunggah media",
    "user.create": "menambahkan user",
    "settings.update": "memperbarui setting",
  }

  return labels[action] ?? action.replace(/\./g, " ")
}

function formatRelativeTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return "baru saja"
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} menit lalu`
  if (diffMs < day) return `${Math.floor(diffMs / hour)} jam lalu`

  return `${Math.floor(diffMs / day)} hari lalu`
}

export async function GET() {
  const guard = await requireApiPermission("article.create")
  if (guard.response) return guard.response

  const db = getDb()

  let rows: Array<{
    articleTotals: { total: number; views: number }
    statusRows: Array<{ status: ArticleStatus; count: number }>
    unitTotals: { total: number; departments: number; bureaus: number }
    userTotals: { total: number; active: number; unclaimed: number }
    memberTotals: { total: number }
    recentArticles: Array<{
      id: string
      title: string
      status: ArticleStatus
      authorName: string | null
      categoryName: string | null
    }>
    reviewArticles: Array<{
      id: string
      title: string
      status: ArticleStatus
      authorName: string | null
    }>
    rejectedArticles: Array<{
      id: string
      title: string
      rejectedNote: string | null
      authorName: string | null
      updatedAt: string
    }>
    recentActivities: Array<{
      id: string
      action: string
      entityType: string | null
      entityId: string | null
      createdAt: Date | string
      actorName: string | null
    }>
  }>

  try {
    rows = await withTimeout(
      db.execute(sql`
        select
          (
            select json_build_object(
              'total', count(*)::int,
              'views', coalesce(sum(views), 0)::int
            )
            from articles
            where deleted_at is null
          ) as "articleTotals",
          (
            select coalesce(json_agg(json_build_object('status', status, 'count', count)), '[]'::json)
            from (
              select status, count(*)::int as count
              from articles
              where deleted_at is null
              group by status
            ) status_counts
          ) as "statusRows",
          (
            select json_build_object(
              'total', count(*)::int,
              'departments', count(*) filter (where type = 'department')::int,
              'bureaus', count(*) filter (where type = 'bureau')::int
            )
            from organizational_units
            where deleted_at is null
          ) as "unitTotals",
          (
            select json_build_object(
              'total', count(*)::int,
              'active', count(*) filter (where status = 'active')::int,
              'unclaimed', count(*) filter (where status = 'unclaimed')::int
            )
            from users
          ) as "userTotals",
          (
            select json_build_object('total', count(*)::int)
            from members
            where deleted_at is null
          ) as "memberTotals",
          (
            select coalesce(json_agg(row_to_json(recent_articles)), '[]'::json)
            from (
              select
                a.id,
                a.title,
                a.status,
                a.author_name as "authorName",
                c.name as "categoryName"
              from articles a
              left join article_categories c on a.category_id = c.id
              where a.deleted_at is null
              order by a.updated_at desc
              limit 5
            ) recent_articles
          ) as "recentArticles",
          (
            select coalesce(json_agg(row_to_json(review_articles)), '[]'::json)
            from (
              select
                id,
                title,
                status,
                author_name as "authorName"
              from articles
              where deleted_at is null and status in ('submitted', 'rejected')
              order by updated_at desc
              limit 5
            ) review_articles
          ) as "reviewArticles",
          (
            select coalesce(json_agg(row_to_json(rejected_articles)), '[]'::json)
            from (
              select
                id,
                title,
                rejected_note as "rejectedNote",
                author_name as "authorName",
                updated_at::text as "updatedAt"
              from articles
              where deleted_at is null and status = 'rejected'
              order by updated_at desc
            ) rejected_articles
          ) as "rejectedArticles",
          (
            select coalesce(json_agg(row_to_json(recent_activity)), '[]'::json)
            from (
              select
                l.id,
                l.action,
                l.entity_type as "entityType",
                l.entity_id as "entityId",
                l.created_at as "createdAt",
                u.name as "actorName"
              from audit_logs l
              left join users u on l.actor_id = u.id
              order by l.created_at desc
              limit 6
            ) recent_activity
          ) as "recentActivities"
      `),
      dashboardQueryTimeoutMs,
      "Dashboard database query timed out",
    )
  } catch (error) {
    console.warn("Dashboard summary fell back to empty data.", error)

    return NextResponse.json(createEmptyDashboardSummary("Dashboard database query timed out"))
  }

  const result = rows[0] ?? createEmptyDashboardSummary()
  const articleTotals = result.articleTotals
  const statusRows = result.statusRows
  const unitTotals = result.unitTotals
  const userTotals = result.userTotals
  const memberTotals = result.memberTotals
  const rejectedArticles = result.rejectedArticles
  const recentArticles = result.recentArticles
  const reviewArticles = result.reviewArticles
  const recentActivities = result.recentActivities

  const byStatus = statusRows.reduce<Record<ArticleStatus, number>>(
    (acc, row) => {
      acc[row.status] = Number(row.count)
      return acc
    },
    { ...statusDefaults },
  )
  const totals = articleTotals ?? { total: 0, views: 0 }
  const units = unitTotals ?? { total: 0, departments: 0, bureaus: 0 }
  const userStats = userTotals ?? { total: 0, active: 0, unclaimed: 0 }
  const memberStats = memberTotals ?? { total: 0 }

  return NextResponse.json({
    stats: {
      articles: {
        total: Number(totals.total),
        views: Number(totals.views),
        byStatus,
      },
      organization: {
        units: Number(units.total),
        departments: Number(units.departments),
        bureaus: Number(units.bureaus),
      },
      users: {
        total: Number(userStats.total),
        active: Number(userStats.active),
        unclaimed: Number(userStats.unclaimed),
      },
      members: {
        total: Number(memberStats.total),
      },
    },
    editorialQueue: recentArticles.map((article) => ({
      id: article.id,
      title: article.title,
      type: article.categoryName ?? "Artikel",
      owner: article.authorName ?? "Tim Media",
      status: article.status,
    })),
    reviewQueue: reviewArticles.map((article) => ({
      id: article.id,
      title: article.title,
      owner: article.authorName ?? "Tim Media",
      status: article.status,
    })),
    rejectedArticles: (rejectedArticles ?? []).map((article) => ({
      id: article.id,
      title: article.title,
      rejectedNote: article.rejectedNote,
      authorName: article.authorName ?? "Tim Media",
      updatedAt: article.updatedAt,
    })),
    recentActivity: recentActivities.map((activity) => {
      const user = activity.actorName ?? "Admin CMS"

      return {
        id: activity.id,
        user,
        avatar: getInitials(user),
        action: formatAuditAction(activity.action),
        target: activity.entityType ?? activity.entityId ?? "CMS",
        time: formatRelativeTime(activity.createdAt),
        type: activity.entityType ?? "cms",
      }
    }),
  })
}
