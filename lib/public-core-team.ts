import { asc, isNull } from "drizzle-orm"
import { getDb } from "@/db"
import { coreTeams } from "@/db/schema"
import koordinatorLogo from "@/assets/organ/koor dept.png"
import sekbenLogo from "@/assets/organ/sekben.png"

const coreTeamDefaults = [
  {
    slug: "sekben",
    type: "Pengurus Inti",
    name: "Sekretaris & Bendahara",
    description:
      "Mengelola administrasi, persuratan, notulensi, serta mengatur pencatatan keuangan dan perencanaan anggaran organisasi.",
    programs: ["Administrasi", "Arsip", "Keuangan", "Anggaran"],
    responsibilities: [],
    logo: sekbenLogo.src,
  },
  {
    slug: "koordinator",
    type: "Pengurus Inti",
    name: "Koordinator",
    description:
      "Menjaga sinkronisasi antarbidang, mengawal ritme program kerja, dan memastikan koordinasi kabinet berjalan efektif.",
    programs: ["Koordinasi Bidang", "Monitoring Program", "Evaluasi Kerja"],
    responsibilities: [
      "Menghubungkan kebutuhan koordinasi antarunit kerja.",
      "Memantau kemajuan dan hambatan program kerja kabinet.",
      "Mendorong evaluasi berkala serta tindak lanjut hasil rapat.",
    ],
    logo: koordinatorLogo.src,
  },
] as const

export async function getPublicCoreTeams() {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(coreTeams)
      .where(isNull(coreTeams.deletedAt))
      .orderBy(asc(coreTeams.sortOrder), asc(coreTeams.id))

    if (rows.length > 0) {
      return rows.map((row) => ({
        slug: row.slug,
        type: row.type,
        name: row.name,
        description: row.description ?? "",
        programs: (row.workPrograms ?? []).map((p) => p.name),
        responsibilities: [],
        logo: row.imageUrl || coreTeamDefaults.find((d) => d.slug === row.slug)?.logo || "",
      }))
    }
  } catch {
    // Fall through to defaults if DB query fails
  }

  return coreTeamDefaults.map((team) => ({
    ...team,
    logo: team.logo,
  }))
}

export async function getPublicCoreTeam(slug: string) {
  const teams = await getPublicCoreTeams()
  return teams.find((team) => team.slug === slug)
}
