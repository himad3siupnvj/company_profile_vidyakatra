import { and, eq, isNull } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { assets, members } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"
import { getActivePeriodId } from "@/lib/active-period"
import { writeAuditLog } from "@/lib/audit"
import { revalidateProfileContent } from "@/lib/profile-cache"
import {
  createStoragePath,
  uploadFileToStorage,
  validateUploadFile,
} from "@/lib/storage"

export const runtime = "nodejs"

function normalizeName(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/\b(foto|photo|profile|profil|anggota|member)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "")
}

function findMatchingMember(
  fileName: string,
  memberRows: Array<typeof members.$inferSelect>,
) {
  const normalizedFile = normalizeName(fileName)
  const matches = memberRows.filter(
    (member) => normalizeName(member.name) === normalizedFile,
  )

  return matches.length === 1 ? matches[0] : null
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("member.manage")
  if (guard.response) return guard.response

  const activePeriodId = await getActivePeriodId()
  if (!activePeriodId) {
    return NextResponse.json(
      { error: "No active organization period is configured" },
      { status: 409 },
    )
  }

  const formData = await request.formData()
  const requestedMemberId = String(formData.get("memberId") ?? "").trim()
  const skipMember = formData.get("skipMember") === "true"
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0)
  if (!files.length) {
    return NextResponse.json({ error: "Pilih minimal satu foto anggota." }, { status: 400 })
  }

  const db = getDb()
  const memberRows = await db
    .select()
    .from(members)
    .where(and(eq(members.periodId, activePeriodId), isNull(members.deletedAt)))
  const uploaded: Array<{
    fileName: string
    memberId: string
    memberName: string
    url: string
  }> = []
  const unmatched: Array<{ fileName: string; reason: string }> = []

  for (const file of files) {
    const member = skipMember
      ? null
      : requestedMemberId
        ? memberRows.find((row) => row.id === requestedMemberId) ?? null
        : findMatchingMember(file.name, memberRows)
    if (!member) {
      unmatched.push({
        fileName: file.name,
        reason: "Nama file belum cocok dengan tepat ke satu anggota.",
      })
      continue
    }

    const validation = await validateUploadFile(file, "organization-image")
    if (!validation.ok) {
      unmatched.push({ fileName: file.name, reason: validation.error })
      continue
    }

    try {
      const path = createStoragePath(file, "organization-image", {
        category: "members",
        kind: member.name,
      })
      const url = await uploadFileToStorage(file, path)
      const now = new Date()

      await db.transaction(async (tx) => {
        if (member) {
          await tx
            .update(members)
            .set({ avatarUrl: url, updatedAt: now })
            .where(eq(members.id, member.id))
        }
        await tx.insert(assets).values({
          url,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          uploadedBy: guard.user?.id ?? null,
          createdAt: now,
        })
      })

      uploaded.push({
        fileName: file.name,
        memberId: member?.id ?? "",
        memberName: member?.name ?? "(baru)",
        url,
      })
    } catch (error) {
      unmatched.push({
        fileName: file.name,
        reason: error instanceof Error ? error.message : "Upload gagal.",
      })
    }
  }

  await writeAuditLog({
    actorId: guard.user?.id,
    action: "member.images.upload",
    entityType: "member",
    metadata: {
      uploaded: uploaded.map(({ fileName, memberId }) => ({ fileName, memberId })),
      unmatched,
    },
  })
  if (uploaded.length) revalidateProfileContent()

  return NextResponse.json({ uploaded, unmatched })
}
