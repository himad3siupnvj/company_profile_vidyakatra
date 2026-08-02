import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const envPath = resolve(".env")
const envContent = readFileSync(envPath, "utf8")
const match = envContent.match(/^DATABASE_URL="([^"]+)"/m)

if (!match) throw new Error("DATABASE_URL not found in .env")

const databaseUrl = match[1]
const { default: postgres } = await import("postgres")
const sql = postgres(databaseUrl)

const coreTeams = [
  {
    slug: "sekben",
    name: "Sekretaris & Bendahara",
    type: "Pengurus Inti",
    description:
      "Mengelola administrasi, persuratan, notulensi, serta mengatur pencatatan keuangan dan perencanaan anggaran organisasi.",
    workPrograms: [
      { name: "Administrasi", description: "", status: "Rutin" },
      { name: "Arsip", description: "", status: "Rutin" },
      { name: "Keuangan", description: "", status: "Rutin" },
      { name: "Anggaran", description: "", status: "Rutin" },
    ],
    sortOrder: 0,
  },
  {
    slug: "koordinator",
    name: "Koordinator",
    type: "Pengurus Inti",
    description:
      "Menjaga sinkronisasi antarbidang, mengawal ritme program kerja, dan memastikan koordinasi kabinet berjalan efektif.",
    workPrograms: [
      { name: "Koordinasi Bidang", description: "", status: "Rutin" },
      { name: "Monitoring Program", description: "", status: "Rutin" },
      { name: "Evaluasi Kerja", description: "", status: "Berjalan" },
    ],
    sortOrder: 1,
  },
]

for (const team of coreTeams) {
  const [existing] = await sql`
    SELECT id FROM core_teams WHERE slug = ${team.slug}
  `

  if (existing) {
    console.log(`SKIP: "${team.slug}" — already exists`)
    continue
  }

  await sql`
    INSERT INTO core_teams (slug, name, type, description, work_programs, sort_order)
    VALUES (
      ${team.slug},
      ${team.name},
      ${team.type},
      ${team.description},
      ${sql.json(team.workPrograms)},
      ${team.sortOrder}
    )
  `

  console.log(`OK: "${team.slug}" — ${team.name}`)
}

await sql.end()
console.log("\nDone.")
