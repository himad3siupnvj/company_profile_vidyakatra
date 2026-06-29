import { and, asc, eq, isNull, ne } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { divisions, members, organizationalUnits, users } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"
import { writeAuditLog } from "@/lib/audit"
import { getActivePeriodId } from "@/lib/active-period"
import { revalidateProfileContent } from "@/lib/profile-cache"
import { getPublicCoreTeamAssets } from "@/lib/core-team-assets"

export const runtime = "nodejs"

function serializeOrgUnit(row: typeof organizationalUnits.$inferSelect & { memberCount?: number; head?: string }) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    workPrograms: row.workPrograms ?? [],
    head: row.head ?? "-",
    memberCount: row.memberCount ?? 0,
    color: row.color ?? "bg-primary",
    sortOrder: row.sortOrder,
  }
}

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

function serializeDivision(row: typeof divisions.$inferSelect & { unitName?: string | null }) {
  return {
    id: row.id,
    name: row.name,
    organizationalUnitId: row.organizationalUnitId,
    organizationalUnit: row.unitName ?? "Unassigned",
    description: row.description ?? "",
    sortOrder: row.sortOrder,
  }
}

function serializeMember(row: {
  id: string
  name: string
  position: string
  unitName: string | null
  divisionName: string | null
  email: string | null
  avatarUrl: string | null
  joinedAt: Date | null
  createdAt: Date
}) {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    department: row.unitName ?? "Unassigned",
    division: row.divisionName ?? "",
    email: row.email,
    avatar: row.avatarUrl ?? "",
    status: "active" as const,
    joinDate: (row.joinedAt ?? row.createdAt).toISOString().slice(0, 10),
  }
}

async function resolveOrgUnitId(value: unknown) {
  const raw = String(value ?? "").trim()

  if (!raw) return null

  const db = getDb()

  try {
    const [byId] = await db.select().from(organizationalUnits).where(eq(organizationalUnits.id, raw)).limit(1)
    if (byId) return byId.id
  } catch {
    // not a UUID, fall through to name lookup
  }

  const [byName] = await db.select().from(organizationalUnits).where(eq(organizationalUnits.name, raw)).limit(1)

  return byName?.id ?? null
}

async function resolveDivisionId(value: unknown) {
  const raw = String(value ?? "").trim()

  if (!raw) return null

  const db = getDb()

  try {
    const [byId] = await db.select().from(divisions).where(eq(divisions.id, raw)).limit(1)
    if (byId) return byId.id
  } catch {
    // not a UUID, fall through to name lookup
  }

  const [byName] = await db.select().from(divisions).where(eq(divisions.name, raw)).limit(1)

  return byName?.id ?? null
}

export async function GET() {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const db = getDb()
  const coreTeamAssets = await getPublicCoreTeamAssets()

  const [adminUser] = await db
    .select({ memberId: users.memberId })
    .from(users)
    .where(eq(users.role, "administrator"))
    .limit(1)
  const excludeMemberId = adminUser?.memberId

  const orgUnitRows = await db
    .select()
    .from(organizationalUnits)
    .where(isNull(organizationalUnits.deletedAt))
    .orderBy(asc(organizationalUnits.sortOrder), asc(organizationalUnits.id))
  const divisionRows = await db
    .select({
      id: divisions.id,
      name: divisions.name,
      organizationalUnitId: divisions.organizationalUnitId,
      periodId: divisions.periodId,
      description: divisions.description,
      sortOrder: divisions.sortOrder,
      createdAt: divisions.createdAt,
      updatedAt: divisions.updatedAt,
      deletedAt: divisions.deletedAt,
      deletedBy: divisions.deletedBy,
      unitName: organizationalUnits.name,
    })
    .from(divisions)
    .leftJoin(organizationalUnits, eq(divisions.organizationalUnitId, organizationalUnits.id))
    .where(isNull(divisions.deletedAt))
    .orderBy(asc(divisions.sortOrder), asc(divisions.id))
  const memberRows = await db
    .select({
      id: members.id,
      name: members.name,
      position: members.position,
      unitName: organizationalUnits.name,
      divisionName: divisions.name,
      email: members.email,
      avatarUrl: members.avatarUrl,
      joinedAt: members.joinedAt,
      createdAt: members.createdAt,
    })
    .from(members)
    .leftJoin(organizationalUnits, eq(members.organizationalUnitId, organizationalUnits.id))
    .leftJoin(divisions, eq(members.divisionId, divisions.id))
    .where(and(
      isNull(members.deletedAt),
      excludeMemberId ? ne(members.id, excludeMemberId) : undefined,
    ))
    .orderBy(asc(members.sortOrder), asc(members.id))

  const unitSummaries = orgUnitRows.map((unit) => {
    const unitMembers = memberRows.filter((member) => member.unitName === unit.name)
    const head = unitMembers.find((member) => /ketua|koordinator|kepala|head/i.test(member.position))?.name

    return serializeOrgUnit({
      ...unit,
      head,
      memberCount: unitMembers.length,
    })
  })

  return NextResponse.json({
    organizationalUnits: unitSummaries,
    departments: unitSummaries,
    divisions: divisionRows.map(serializeDivision),
    members: memberRows.map(serializeMember),
    coreTeamAssets,
  })
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const payload = await request.json()
  const type = String(payload.type ?? "member")
  const now = new Date()
  const db = getDb()
  const activePeriodId = await getActivePeriodId()

  if (!activePeriodId) {
    return NextResponse.json({ error: "No active organization period is configured" }, { status: 409 })
  }

  if (type === "organizational-unit" || type === "department") {
    const name = String(payload.name ?? "").trim()
    const unitType = payload.unitType === "bureau" || payload.orgUnitType === "bureau" ? "bureau" : "department"

    if (!name) {
      return NextResponse.json({ error: "Organizational unit name is required" }, { status: 400 })
    }

    const [created] = await db
      .insert(organizationalUnits)
      .values({
        name,
        type: unitType,
        periodId: activePeriodId,
        description: String(payload.description ?? ""),
        imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : null,
        workPrograms: parseWorkPrograms(payload.workPrograms),
        color: String(payload.color ?? "bg-primary"),
        sortOrder: Number(payload.sortOrder ?? 0),
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await writeAuditLog({
      actorId: guard.user?.id,
      action: "org_unit.create",
      entityType: "organizational_unit",
      entityId: created.id,
      metadata: { type: unitType },
    })
    revalidateProfileContent()

    return NextResponse.json({ organizationalUnit: serializeOrgUnit(created), department: serializeOrgUnit(created) })
  }

  if (type === "division") {
    const name = String(payload.name ?? "").trim()

    if (!name) {
      return NextResponse.json({ error: "Division name is required" }, { status: 400 })
    }

    const organizationalUnitId = await resolveOrgUnitId(payload.organizationalUnitId ?? payload.organizationalUnit)
    const [created] = await db
      .insert(divisions)
      .values({
        name,
        organizationalUnitId,
        periodId: activePeriodId,
        description: String(payload.description ?? ""),
        sortOrder: Number(payload.sortOrder ?? 0),
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await writeAuditLog({
      actorId: guard.user?.id,
      action: "division.create",
      entityType: "division",
      entityId: created.id,
      metadata: { organizationalUnitId },
    })
    revalidateProfileContent()

    return NextResponse.json({ division: serializeDivision({ ...created, unitName: null }) })
  }

  if (type !== "member") {
    return NextResponse.json({ error: "Unsupported organization payload" }, { status: 400 })
  }

  const name = String(payload.name ?? "").trim()
  const position = String(payload.position ?? "").trim()

  if (!name || !position) {
    return NextResponse.json({ error: "Name and position are required" }, { status: 400 })
  }

  const organizationalUnitId = await resolveOrgUnitId(payload.organizationalUnitId ?? payload.department)
  const divisionId = await resolveDivisionId(payload.divisionId ?? payload.division)
  const [unit] = organizationalUnitId
    ? await db.select().from(organizationalUnits).where(eq(organizationalUnits.id, organizationalUnitId)).limit(1)
    : []
  const [division] = divisionId
    ? await db.select().from(divisions).where(eq(divisions.id, divisionId)).limit(1)
    : []

  const [created] = await db
    .insert(members)
    .values({
      name,
      position,
      organizationalUnitId,
      divisionId,
      periodId: activePeriodId,
      email: null,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  await writeAuditLog({
    actorId: guard.user?.id,
    action: "member.create",
    entityType: "member",
    entityId: created.id,
    metadata: { organizationalUnitId, divisionId },
  })
  revalidateProfileContent()

  return NextResponse.json({
    member: serializeMember({
      ...created,
      unitName: unit?.name ?? null,
      divisionName: division?.name ?? null,
    }),
  })
}

export async function PUT(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const payload = await request.json()
  const type = String(payload.type ?? "member")
  const id = String(payload.id ?? "").trim()
  const now = new Date()
  const db = getDb()

  if (!id) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 })
  }

  if (type === "organizational-unit" || type === "department") {
    const name = String(payload.name ?? "").trim()
    const unitType = payload.unitType === "bureau" || payload.orgUnitType === "bureau" ? "bureau" : "department"

    if (!name) {
      return NextResponse.json({ error: "Organizational unit name is required" }, { status: 400 })
    }

    const [updated] = await db
      .update(organizationalUnits)
      .set({
        name,
        type: unitType,
        description: String(payload.description ?? ""),
        imageUrl: typeof payload.imageUrl === "string" ? payload.imageUrl : undefined,
        workPrograms: parseWorkPrograms(payload.workPrograms),
        color: String(payload.color ?? "bg-primary"),
        sortOrder: Number(payload.sortOrder ?? 0),
        updatedAt: now,
      })
      .where(eq(organizationalUnits.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Organizational unit not found" }, { status: 404 })

    await writeAuditLog({ actorId: guard.user?.id, action: "org_unit.update", entityType: "organizational_unit", entityId: id })
    revalidateProfileContent()

    return NextResponse.json({ organizationalUnit: serializeOrgUnit(updated), department: serializeOrgUnit(updated) })
  }

  if (type === "division") {
    const name = String(payload.name ?? "").trim()

    if (!name) {
      return NextResponse.json({ error: "Division name is required" }, { status: 400 })
    }

    const organizationalUnitId = await resolveOrgUnitId(payload.organizationalUnitId ?? payload.organizationalUnit)
    const [updated] = await db
      .update(divisions)
      .set({
        name,
        organizationalUnitId,
        description: String(payload.description ?? ""),
        sortOrder: Number(payload.sortOrder ?? 0),
        updatedAt: now,
      })
      .where(eq(divisions.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: "Division not found" }, { status: 404 })

    await writeAuditLog({ actorId: guard.user?.id, action: "division.update", entityType: "division", entityId: id })
    revalidateProfileContent()

    return NextResponse.json({ division: serializeDivision({ ...updated, unitName: null }) })
  }

  const name = String(payload.name ?? "").trim()
  const position = String(payload.position ?? "").trim()

  if (!name || !position) {
    return NextResponse.json({ error: "Name and position are required" }, { status: 400 })
  }

  const organizationalUnitId = await resolveOrgUnitId(payload.organizationalUnitId ?? payload.department)
  const divisionId = await resolveDivisionId(payload.divisionId ?? payload.division)
  const [unit] = organizationalUnitId
    ? await db.select().from(organizationalUnits).where(eq(organizationalUnits.id, organizationalUnitId)).limit(1)
    : []
  const [division] = divisionId
    ? await db.select().from(divisions).where(eq(divisions.id, divisionId)).limit(1)
    : []

  const [updated] = await db
    .update(members)
    .set({
      name,
      position,
      organizationalUnitId,
      divisionId,
      email: null,
      avatarUrl: payload.avatarUrl || payload.avatar || null,
      updatedAt: now,
    })
    .where(eq(members.id, id))
    .returning()

  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  await writeAuditLog({ actorId: guard.user?.id, action: "member.update", entityType: "member", entityId: id })
  revalidateProfileContent()

  return NextResponse.json({
    member: serializeMember({
      ...updated,
      unitName: unit?.name ?? null,
      divisionName: division?.name ?? null,
    }),
  })
}

export async function DELETE(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const id = request.nextUrl.searchParams.get("id")
  const type = request.nextUrl.searchParams.get("type") ?? "member"

  if (!id) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 })
  }

  const db = getDb()
  const now = new Date()

  if (type === "organizational-unit" || type === "department") {
    await db.transaction(async (tx) => {
      await tx
        .update(members)
        .set({ organizationalUnitId: null, divisionId: null, updatedAt: now })
        .where(eq(members.organizationalUnitId, id))
      await tx
        .update(divisions)
        .set({ organizationalUnitId: null, updatedAt: now })
        .where(eq(divisions.organizationalUnitId, id))
      await tx
        .update(organizationalUnits)
        .set({ deletedAt: now, deletedBy: guard.user?.id ?? null, updatedAt: now })
        .where(eq(organizationalUnits.id, id))
    })
    await writeAuditLog({ actorId: guard.user?.id, action: "org_unit.delete", entityType: "organizational_unit", entityId: id })
    revalidateProfileContent()

    return NextResponse.json({ ok: true })
  }

  if (type === "division") {
    await db
      .update(divisions)
      .set({ deletedAt: now, deletedBy: guard.user?.id ?? null, updatedAt: now })
      .where(eq(divisions.id, id))
    await writeAuditLog({ actorId: guard.user?.id, action: "division.delete", entityType: "division", entityId: id })
    revalidateProfileContent()

    return NextResponse.json({ ok: true })
  }

  await db
    .update(members)
    .set({ deletedAt: now, deletedBy: guard.user?.id ?? null, updatedAt: now })
    .where(eq(members.id, id))
  await writeAuditLog({ actorId: guard.user?.id, action: "member.delete", entityType: "member", entityId: id })
  revalidateProfileContent()

  return NextResponse.json({ ok: true })
}
