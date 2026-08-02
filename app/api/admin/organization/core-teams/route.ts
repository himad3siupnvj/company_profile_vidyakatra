import { asc, eq, isNull } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { coreTeams } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"
import { writeAuditLog } from "@/lib/audit"
import { getActivePeriodId } from "@/lib/active-period"
import { revalidateProfileContent } from "@/lib/profile-cache"

export const runtime = "nodejs"

type WorkProgramInput = {
  name: string
  description: string
  status: "Rutin" | "Berjalan" | "Rencana"
}

function parseWorkPrograms(value: unknown): WorkProgramInput[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const record = item as Record<string, unknown>
      const name = String(record.name ?? "").trim()
      const description = String(record.description ?? "").trim()
      const status: WorkProgramInput["status"] =
        record.status === "Rutin" || record.status === "Berjalan" || record.status === "Rencana"
          ? record.status
          : "Rencana"

      return name ? { name, description, status } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function serializeCoreTeam(row: typeof coreTeams.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    workPrograms: row.workPrograms ?? [],
    sortOrder: row.sortOrder,
    periodId: row.periodId,
  }
}

export async function GET() {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const db = getDb()
  const rows = await db
    .select()
    .from(coreTeams)
    .where(isNull(coreTeams.deletedAt))
    .orderBy(asc(coreTeams.sortOrder), asc(coreTeams.id))

  return NextResponse.json({ coreTeams: rows.map(serializeCoreTeam) })
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const payload = await request.json()
  const slug = String(payload.slug ?? "").trim()
  const name = String(payload.name ?? "").trim()

  if (!slug || !name) {
    return NextResponse.json({ error: "Slug dan nama wajib diisi." }, { status: 400 })
  }

  const db = getDb()
  const activePeriodId = await getActivePeriodId()
  const now = new Date()

  const [created] = await db
    .insert(coreTeams)
    .values({
      slug,
      name,
      type: String(payload.type ?? "Pengurus Inti"),
      description: String(payload.description ?? ""),
      imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : null,
      workPrograms: parseWorkPrograms(payload.workPrograms),
      sortOrder: Number(payload.sortOrder ?? 0),
      periodId: activePeriodId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  await writeAuditLog({
    actorId: guard.user?.id,
    action: "core_team.create",
    entityType: "core_team",
    entityId: created.id,
    metadata: { slug },
  })
  revalidateProfileContent()

  return NextResponse.json({ coreTeam: serializeCoreTeam(created) })
}

export async function PUT(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const payload = await request.json()
  const id = String(payload.id ?? "").trim()

  if (!id) {
    return NextResponse.json({ error: "Valid id wajib diisi." }, { status: 400 })
  }

  const name = String(payload.name ?? "").trim()
  const slug = String(payload.slug ?? "").trim()

  if (!name || !slug) {
    return NextResponse.json({ error: "Slug dan nama wajib diisi." }, { status: 400 })
  }

  const db = getDb()
  const now = new Date()

  const [updated] = await db
    .update(coreTeams)
    .set({
      slug,
      name,
      type: String(payload.type ?? "Pengurus Inti"),
      description: String(payload.description ?? ""),
      imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : undefined,
      workPrograms: parseWorkPrograms(payload.workPrograms),
      sortOrder: Number(payload.sortOrder ?? 0),
      updatedAt: now,
    })
    .where(eq(coreTeams.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: "Core team not found." }, { status: 404 })

  await writeAuditLog({ actorId: guard.user?.id, action: "core_team.update", entityType: "core_team", entityId: id })
  revalidateProfileContent()

  return NextResponse.json({ coreTeam: serializeCoreTeam(updated) })
}

export async function DELETE(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Valid id wajib diisi." }, { status: 400 })
  }

  const db = getDb()
  const now = new Date()

  const [deleted] = await db
    .update(coreTeams)
    .set({ deletedAt: now, deletedBy: guard.user?.id ?? null, updatedAt: now })
    .where(eq(coreTeams.id, id))
    .returning()

  if (!deleted) return NextResponse.json({ error: "Core team not found." }, { status: 404 })

  await writeAuditLog({ actorId: guard.user?.id, action: "core_team.delete", entityType: "core_team", entityId: id })
  revalidateProfileContent()

  return NextResponse.json({ ok: true })
}
