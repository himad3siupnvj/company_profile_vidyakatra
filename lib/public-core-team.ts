import { getPublicCoreTeamAssets } from "@/lib/core-team-assets"

const coreTeamDefinitions = [
  {
    slug: "sekben",
    type: "Pengurus Inti",
    name: "Sekretaris & Bendahara",
    description:
      "Mengelola administrasi, persuratan, notulensi, serta mengatur pencatatan keuangan dan perencanaan anggaran organisasi.",
    programs: ["Administrasi", "Arsip", "Keuangan", "Anggaran"],
    responsibilities: [],
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
  },
] as const

export async function getPublicCoreTeams() {
  const assets = await getPublicCoreTeamAssets()

  return coreTeamDefinitions.map((team) => ({
    ...team,
    logo: assets[team.slug],
  }))
}

export async function getPublicCoreTeam(slug: string) {
  const teams = await getPublicCoreTeams()
  return teams.find((team) => team.slug === slug)
}
