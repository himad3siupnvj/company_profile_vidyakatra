import { asc, isNull } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getDb } from "@/db"
import { organizationalUnits } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"

export const runtime = "nodejs"

export async function GET() {
  const guard = await requireApiPermission("article.create")
  if (guard.response) return guard.response

  const db = getDb()
  const rows = await db
    .select({ id: organizationalUnits.id, name: organizationalUnits.name, type: organizationalUnits.type })
    .from(organizationalUnits)
    .where(isNull(organizationalUnits.deletedAt))
    .orderBy(asc(organizationalUnits.sortOrder), asc(organizationalUnits.name))

  return NextResponse.json(rows)
}
