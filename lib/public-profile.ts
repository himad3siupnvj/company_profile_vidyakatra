import { unstable_cache } from "next/cache"
import { slugify } from "@/lib/article-content"
import { publicCacheTags } from "@/lib/cache-tags"
import { workUnits, type WorkUnit } from "@/lib/public-content"
import {
  getPublicMembers,
  getPublicOrganizationalUnits,
} from "@/lib/public-directory"

const fallbackBySlug = new Map(workUnits.map((unit) => [unit.slug, unit]))
const fallbackUnit = workUnits[0]

export const getPublicWorkUnits = unstable_cache(
  async function getPublicWorkUnits(): Promise<WorkUnit[]> {
    try {
      const [units, unitMembers] = await Promise.all([
        getPublicOrganizationalUnits(),
        getPublicMembers(),
      ])

      if (!units.length) return workUnits

      return units.map((unit) => {
        const slug = slugify(unit.name)
        const fallback = fallbackBySlug.get(slug) ?? fallbackUnit
        const mappedMembers = unitMembers
          .filter((member) => member.organizationalUnitId === unit.id)
          .map((member, index) => ({
            name: member.name,
            role: member.position,
            image: member.avatarUrl || fallback.members[index % fallback.members.length]?.image || "/placeholder-user.jpg",
          }))

        return {
          slug,
          type: unit.type === "bureau" ? "Biro" : "Departemen",
          name: unit.name,
          description: unit.description ?? fallback.description,
          logo: unit.imageUrl || fallback.logo || "/placeholder-logo.svg",
          programs: unit.workPrograms.map((program) => program.name),
          members: mappedMembers.length ? mappedMembers : fallback.members,
          workPrograms: unit.workPrograms,
        }
      })
    } catch {
      return workUnits
    }
  },
  ["public-work-units"],
  { revalidate: 3600, tags: [publicCacheTags.profile] },
)
