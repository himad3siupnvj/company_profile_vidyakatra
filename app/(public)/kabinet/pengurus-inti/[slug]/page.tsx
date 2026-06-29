import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { getPublicCoreTeam, getPublicCoreTeams } from "@/lib/public-core-team"
import { getPublicMembers } from "@/lib/public-directory"
import { MemberCarousel } from "@/components/public/member-carousel"

type CoreTeamDetailPageProps = {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const teams = await getPublicCoreTeams()
  return teams.map((team) => ({ slug: team.slug }))
}

export async function generateMetadata({ params }: CoreTeamDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const team = await getPublicCoreTeam(slug)

  return team
    ? {
      title: team.name,
      description: team.description,
      alternates: { canonical: `/kabinet/pengurus-inti/${slug}` },
    }
    : {}
}

export default async function CoreTeamDetailPage({ params }: CoreTeamDetailPageProps) {
  const { slug } = await params
  const [team, allMembers] = await Promise.all([
    getPublicCoreTeam(slug),
    getPublicMembers()
  ])

  if (!team) notFound()

  const { name, description, type, logo, programs } = team

  const isSekben = slug === "sekben"

  const mapMember = (m: any) => ({
    name: m.name,
    role: m.position || "",
    image: m.avatarUrl || "/placeholder-user.jpg"
  })

  const sekretarisMembers = isSekben
    ? allMembers.filter((m) => m.position?.toLowerCase().includes("sekretaris")).map(mapMember)
    : []

  const bendaharaMembers = isSekben
    ? allMembers.filter((m) => m.position?.toLowerCase().includes("bendahara")).map(mapMember)
    : []

  const teamMembers = !isSekben
    ? allMembers.filter((m) => m.position?.toLowerCase().includes(slug.toLowerCase())).map(mapMember)
    : []

  return (
    <>
      <section className="border-b border-border bg-muted/40 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Button asChild variant="ghost" className="mb-8 gap-2 pl-0 text-muted-foreground hover:text-primary">
            <Link href="/kabinet#struktur">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Kabinet
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-medium text-primary">{type}</p>
              <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
                {name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {programs.map((program) => (
                  <Badge key={program} variant="secondary">{program}</Badge>
                ))}
              </div>
            </div>

            <div className="mx-auto flex aspect-square w-56 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-8">
              <Image src={logo} alt={name} width={180} height={180} className="h-full w-full object-contain" priority />
            </div>
          </div>
        </div>
      </section>

      {isSekben ? (
        <section className="py-14 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <p className="mb-6 text-3xl font-medium text-primary text-center">Anggota</p>
            <div className="grid gap-x-12 gap-y-12 lg:grid-cols-2">
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-center">Sekretaris</h2>
                </div>
                {sekretarisMembers.length > 0
                  ? <MemberCarousel members={sekretarisMembers} />
                  : <p className="text-sm text-muted-foreground">Belum ada data.</p>
                }
              </div>
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-center">Bendahara</h2>
                </div>
                {bendaharaMembers.length > 0
                  ? <MemberCarousel members={bendaharaMembers} />
                  : <p className="text-sm text-muted-foreground">Belum ada data.</p>
                }
              </div>
            </div>
          </div>
        </section>
      ) : (
        teamMembers.length > 0 && (
          <section className="py-14 md:py-16">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-3 text-sm font-medium text-primary">Anggota</p>
                  <h2 className="text-3xl font-bold tracking-tight">Anggota {name}</h2>
                </div>
              </div>
              <MemberCarousel members={teamMembers} />
            </div>
          </section>
        )
      )}
    </>
  )
}
