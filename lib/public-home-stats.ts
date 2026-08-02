import { and, count, eq, isNull, sql } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { getDb } from "@/db"
import { articles, members, organizationalUnits, periods } from "@/db/schema"
import { publicCacheTags } from "@/lib/cache-tags"

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export const getPublicHomeStats = unstable_cache(
  async function getPublicHomeStats() {
    try {
      const db = getDb()
      const [memberRows, unitRows, articleRows, activePeriods, monthRows] = await Promise.all([
        db
          .select({ value: count() })
          .from(members)
          .innerJoin(periods, eq(members.periodId, periods.id))
          .where(and(eq(periods.status, "active"), isNull(members.deletedAt))),
        db
          .select({ value: count() })
          .from(organizationalUnits)
          .innerJoin(periods, eq(organizationalUnits.periodId, periods.id))
          .where(and(eq(periods.status, "active"), isNull(organizationalUnits.deletedAt))),
        db
          .select({ value: count() })
          .from(articles)
          .innerJoin(periods, eq(articles.periodId, periods.id))
          .where(
            and(
              eq(periods.status, "active"),
              eq(articles.status, "published"),
              isNull(articles.deletedAt),
            ),
          ),
        db
          .select({ name: periods.name })
          .from(periods)
          .where(eq(periods.status, "active"))
          .limit(1),
        db
          .select({
            month: sql<string>`to_char(${articles.publishedAt}, 'MM')`,
            value: count(),
          })
          .from(articles)
          .innerJoin(periods, eq(articles.periodId, periods.id))
          .where(
            and(
              eq(periods.status, "active"),
              eq(articles.status, "published"),
              isNull(articles.deletedAt),
              sql`${articles.publishedAt} >= now() - interval '6 months'`,
            ),
          )
          .groupBy(sql`to_char(${articles.publishedAt}, 'MM')`),
      ])

      const now = new Date()
      const countsByMonth = new Map(monthRows.map((row) => [row.month, row.value]))
      const articlesByMonth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const key = String(date.getMonth() + 1).padStart(2, "0")
        return {
          month: MONTH_LABELS[date.getMonth()],
          count: countsByMonth.get(key) ?? 0,
        }
      })

      return {
        activeMembers: memberRows[0]?.value ?? 0,
        activeUnits: unitRows[0]?.value ?? 0,
        publishedArticles: articleRows[0]?.value ?? 0,
        activePeriod: activePeriods[0]?.name ?? "-",
        articlesByMonth,
      }
    } catch {
      const now = new Date()
      return {
        activeMembers: 0,
        activeUnits: 0,
        publishedArticles: 0,
        activePeriod: "-",
        articlesByMonth: Array.from({ length: 6 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          return { month: MONTH_LABELS[date.getMonth()], count: 0 }
        }),
      }
    }
  },
  ["public-home-stats"],
  { revalidate: 300, tags: [publicCacheTags.articles, publicCacheTags.profile] },
)
