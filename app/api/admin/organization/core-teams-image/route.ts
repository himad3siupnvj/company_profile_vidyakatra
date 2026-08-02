import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets, coreTeams } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"
import { writeAuditLog } from "@/lib/audit"
import { revalidateProfileContent } from "@/lib/profile-cache"
import {
  createStoragePath,
  uploadFileToStorage,
  validateUploadFile,
} from "@/lib/storage"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const formData = await request.formData()
  const coreTeamId = String(formData.get("coreTeamId") ?? "")
  const file = formData.get("file")

  if (!coreTeamId) {
    return NextResponse.json({ error: "coreTeamId wajib diisi." }, { status: 400 })
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Pilih file gambar." }, { status: 400 })
  }

  const validation = await validateUploadFile(file, "organization-image")
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const db = getDb()
  const [existing] = await db
    .select()
    .from(coreTeams)
    .where(eq(coreTeams.id, coreTeamId))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: "Core team tidak ditemukan." }, { status: 404 })
  }

  const path = createStoragePath(file, "organization-image", {
    category: "core-team",
    kind: existing.slug,
  })
  const url = await uploadFileToStorage(file, path)
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(coreTeams)
      .set({ imageUrl: url, updatedAt: now })
      .where(eq(coreTeams.id, coreTeamId))
    await tx.insert(assets).values({
      url,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedBy: guard.user?.id ?? null,
      createdAt: now,
    })
  })

  await writeAuditLog({
    actorId: guard.user?.id,
    action: "core_team.image.upload",
    entityType: "core_team",
    entityId: coreTeamId,
    metadata: { slug: existing.slug, url },
  })
  revalidateProfileContent()

  return NextResponse.json({ coreTeamId, url })
}
