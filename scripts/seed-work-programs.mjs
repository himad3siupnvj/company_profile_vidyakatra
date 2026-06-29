import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const envPath = resolve(".env")
const envContent = readFileSync(envPath, "utf8")
const match = envContent.match(/^DATABASE_URL="([^"]+)"/m)

if (!match) throw new Error("DATABASE_URL not found in .env")

const databaseUrl = match[1]
const { default: postgres } = await import("postgres")
const sql = postgres(databaseUrl)

const unitPrograms = {
  "Sosial Politik": [
    "Musyawarah Umum",
    "Podcast (Ngode)",
    "Wicara",
    "AKSES",
    "Informasi Sosial Politik",
  ],
  "Pendidikan": [
    "Sahabat Vol. 1",
    "PILAR",
    "DIGITAL",
    "Sahabat Vol. 2",
    "D3 Punya",
    "Informasi Seputar Pengetahuan (D3 Sistem Informasi) dan Beasiswa",
  ],
  "Hubungan Mahasiswa": [
    "D3 Berbagi",
    "Fun Games",
    "Menfes D3SI & Qna",
    "Informasi Keluarga Mahasiswa",
  ],
  "Media dan Komunikasi": [
    "Studi Banding",
    "Company Profile",
    "Company Visit",
    "Media Partner",
    "Konten Hima",
  ],
  "Pengembangan Sumber Daya Manusia": [
    "Gema Persaudaraan Vol. 1",
    "Mabim",
    "Open Recruitment",
    "Gema Persaudaraan Vol. 2",
    "Apresiasi Bakti dan Inspirasi (Staff)",
    "Monthly Discussion",
    "SIGMA",
  ],
  "Ekonomi Kreatif": [
    "Creasi",
    "Market Day",
    "Cari Sponsor (Jalin Mitra)",
    "Promosi Usaha",
    "FIK Intrepeneur",
  ],
}

const units = await sql`SELECT id, name FROM organizational_units WHERE deleted_at IS NULL`

for (const unit of units) {
  const programs = unitPrograms[unit.name]

  if (!programs) {
    console.log(`SKIP: "${unit.name}" — no programs defined`)
    continue
  }

  const workPrograms = programs.map((name) => ({
    name,
    description: "",
    status: "Rencana",
  }))

  await sql`
    UPDATE organizational_units
    SET work_programs = ${sql.json(workPrograms)}
    WHERE id = ${unit.id}
  `

  console.log(`OK: "${unit.name}" — ${programs.length} programs`)
}

await sql.end()
console.log("\nDone.")
