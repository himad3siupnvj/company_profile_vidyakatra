import { eq } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { getDb } from "@/db"
import { siteSettings } from "@/db/schema"
import { publicCacheTags } from "@/lib/cache-tags"
import koordinatorLogo from "@/assets/organ/koor dept.png"
import sekbenLogo from "@/assets/organ/sekben.png"

export const coreTeamAssetsKey = "organizationCoreTeamAssets"

export type CoreTeamAssets = {
  sekben: string
  koordinator: string
}

export const defaultCoreTeamAssets: CoreTeamAssets = {
  sekben: sekbenLogo.src,
  koordinator: koordinatorLogo.src,
}

export function normalizeCoreTeamAssets(value: unknown): CoreTeamAssets {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultCoreTeamAssets
  }

  const record = value as Record<string, unknown>
  return {
    sekben:
      typeof record.sekben === "string"
        ? record.sekben
        : typeof record.sekretaris === "string"
        ? record.sekretaris
        : typeof record.bendahara === "string"
        ? record.bendahara
        : defaultCoreTeamAssets.sekben,
    koordinator:
      typeof record.koordinator === "string"
        ? record.koordinator
        : defaultCoreTeamAssets.koordinator,
  }
}

export const getPublicCoreTeamAssets = unstable_cache(
  async function getPublicCoreTeamAssets() {
    try {
      const db = getDb()
      const [row] = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, coreTeamAssetsKey))
        .limit(1)

      return normalizeCoreTeamAssets(row?.value)
    } catch {
      return defaultCoreTeamAssets
    }
  },
  ["organization-core-team-assets"],
  { revalidate: 3600, tags: [publicCacheTags.profile] },
)
