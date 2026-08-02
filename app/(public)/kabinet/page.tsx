import Image, { type StaticImageData } from "next/image"
import Link from "next/link"
import ketuaLead from "@/assets/lead/sakha-ketum1.jpg"
import wakilLead from "@/assets/lead/latanza-waketum.jpg"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getProfileContent } from "@/lib/profile-content"
import { getPublicWorkUnits } from "@/lib/public-profile"
import { getPublicCoreTeams } from "@/lib/public-core-team"
import { getPublicMembers } from "@/lib/public-directory"
import type { ProfileLeader } from "@/lib/profile-content-data"
import {
  Eye,
  Target,
} from "lucide-react"

export const revalidate = 3600 // Force rebuild to clear cache

type CabinetLeadPerson = {
  name: string
  position: string
  description: string
  image: string | StaticImageData
}

const leaderFallbackImages: Record<ProfileLeader["imageKey"], StaticImageData> = {
  ketuaLead,
  wakilLead,
}

type LeaderProfileProps = {
  person: CabinetLeadPerson
  reversed?: boolean
  featured?: boolean
}

function LeaderPhotoCard({ person, reversed, featured }: LeaderProfileProps) {
  return (
    <div
      className={cn(
        "group relative mx-auto w-full overflow-hidden rounded-[1.5rem] border border-border bg-card p-2 shadow-soft transition-all hover:border-primary/40 hover:shadow-glow-primary",
        featured ? "max-w-72 md:max-w-80" : "max-w-60 md:max-w-64",
        reversed && "md:order-2"
      )}
    >
      <div className="absolute inset-x-8 bottom-5 h-24 rounded-full bg-primary/20 blur-3xl" />
      <div className={cn("relative w-full overflow-hidden rounded-[1.25rem] bg-black/30", featured ? "aspect-[3/4]" : "aspect-[4/5]")}>
        <Image
          src={person.image}
          alt={person.name}
          width={featured ? 400 : 360}
          height={featured ? 533 : 450}
          sizes={featured ? "(max-width: 768px) 70vw, 320px" : "(max-width: 768px) 60vw, 256px"}
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </div>
  )
}

function LeaderBio({ person, reversed, featured }: LeaderProfileProps) {
  return (
    <div className={cn("pt-3 text-center md:text-left", reversed && "md:order-1")}>
      <div>
        <h3 className={cn("font-black tracking-tight text-gradient", featured ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl")}>
          {person.name}
        </h3>
        <p className={cn("mt-1 font-semibold text-muted-foreground tracking-wide", featured ? "text-lg" : "text-base")}>
          {person.position}
        </p>
      </div>
      <p className="mx-auto mt-5 max-w-2xl text-justify text-sm leading-7 text-muted-foreground md:mx-0">
        {person.description}
      </p>
    </div>
  )
}

function LeaderProfile({ person, reversed = false, featured = false }: LeaderProfileProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-8",
        featured
          ? "md:grid-cols-[18rem_minmax(0,1fr)]"
          : reversed
            ? "md:grid-cols-[minmax(0,1fr)_16rem]"
            : "md:grid-cols-[16rem_minmax(0,1fr)]"
      )}
    >
      <LeaderPhotoCard person={person} reversed={reversed} featured={featured} />
      <LeaderBio person={person} reversed={reversed} featured={featured} />
    </div>
  )
}

export default async function ProfilPage() {
  const profileContent = await getProfileContent()
  const [workUnits, coreTeams, publicMembers] = await Promise.all([
    getPublicWorkUnits(),
    getPublicCoreTeams(),
    getPublicMembers(),
  ])
  const activeMissions = profileContent.missions.filter((mission) => mission.enabled)
  const activeLeaders = profileContent.leaders.filter((leader) => leader.enabled)
  const leaderPhoto = (leader: ProfileLeader) =>
    publicMembers.find(
      (member) => member.name.toLowerCase().trim() === leader.name.toLowerCase().trim(),
    )?.avatarUrl || leaderFallbackImages[leader.imageKey]


  return (
    <>
      <section className="border-b border-border bg-muted/40 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Profil Kabinet
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-balance">
              {profileContent.intro.cabinetName}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground uppercase font-semibold tracking-widest text-primary">
              {profileContent.intro.tagline}
            </p>
          </div>
        </div>
      </section>


      <section id="struktur" className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Struktur kabinet</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-gradient">Pengurus Inti</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Ketua, wakil ketua, koordinator, sekretaris, dan bendahara yang mengawal arah gerak serta tata kelola kabinet.
            </p>
          </div>

          <div className="mx-auto max-w-5xl space-y-12">
            {activeLeaders.map((leader, index) => (
              <LeaderProfile
                key={leader.id}
                person={{
                  name: leader.name,
                  position: leader.position,
                  description: leader.description,
                  image: leaderPhoto(leader),
                }}
                reversed={index % 2 === 1}
                featured={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">

          <div id="visi-misi" className="mt-16 pt-16 border-t border-border">
            <div className="grid gap-8 lg:grid-cols-2">
              {profileContent.vision.enabled && (
                <Card className="border-primary/30 bg-primary/5 transition-all hover:border-primary/60 hover:shadow-glow-primary rounded-[1.5rem]">
                  <CardContent className="p-8">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-brand shadow-glow-primary-sm">
                      <Eye className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h2 className="mb-4 text-2xl font-bold text-gradient">{profileContent.vision.title}</h2>
                    <p className="text-lg leading-relaxed text-muted-foreground text-justify">
                      {profileContent.vision.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-secondary/30 bg-secondary/5 transition-all hover:border-secondary/60 hover:shadow-glow-primary rounded-[1.5rem]">
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-brand shadow-glow-primary-sm">
                    <Target className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h2 className="mb-4 text-2xl font-bold text-gradient">Misi</h2>
                  <ul className="space-y-3">
                    {activeMissions.map((mission, index) => (
                      <li key={mission.id} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-glow-primary-sm">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground text-justify">{mission.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-16 mb-8 text-center">
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl text-gradient">Pengurus Inti</h2>
          </div>

          <div className="mt-8 pt-16 border-t border-border space-y-6">
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {coreTeams.slice(0, 2).map((unit) => (
                <Link key={unit.name} href={`/kabinet/pengurus-inti/${unit.slug}`} className="group">
                  <Card className="h-full border-border/80 bg-card shadow-soft transition-all hover:border-primary/40 hover:shadow-glow-primary py-0 gap-0 relative overflow-hidden rounded-[1.25rem]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/60 to-transparent" />
                    <div className="flex items-center gap-4 border-b border-border/50 bg-muted/30 px-6 py-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-2 transition-all group-hover:bg-primary/10 group-hover:scale-105">
                        <Image
                          src={unit.logo}
                          alt={`Logo ${unit.name}`}
                          width={64}
                          height={64}
                          sizes="64px"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold transition-colors group-hover:text-primary">
                          {unit.name}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {unit.description}
                      </p>
                      {unit.programs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {unit.programs.map((program) => (
                            <Badge key={program} variant="outline" className="text-xs text-muted-foreground border-muted-foreground/20">
                              {program}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mx-auto grid max-w-md gap-6">
              {coreTeams.slice(2).map((unit) => (
                <Link key={unit.name} href={`/kabinet/pengurus-inti/${unit.slug}`} className="group">
                  <Card className="h-full border-border/80 bg-card shadow-soft transition-all hover:border-primary/40 hover:shadow-glow-primary py-0 gap-0 relative overflow-hidden rounded-[1.25rem]">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
                    <div className="flex items-center gap-4 border-b border-border/50 bg-muted/30 px-6 py-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-2 transition-all group-hover:bg-primary/10 group-hover:scale-105">
                        <Image
                          src={unit.logo}
                          alt={`Logo ${unit.name}`}
                          width={64}
                          height={64}
                          sizes="64px"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold transition-colors group-hover:text-primary">
                          {unit.name}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {unit.description}
                      </p>
                      {unit.programs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {unit.programs.map((program) => (
                            <Badge key={program} variant="outline" className="text-xs text-muted-foreground border-muted-foreground/20">
                              {program}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="divisi" className="border-t border-border bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Unit kerja kabinet</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Departemen & Biro
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Empat departemen dan dua biro yang menjalankan program kerja sesuai kebutuhan organisasi.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workUnits.map((unit) => (
              <Link key={unit.name} href={`/kabinet/${unit.slug}`} className="group">
                <Card className="h-full border-border/80 bg-card shadow-soft transition-all group-hover:border-primary/40 group-hover:shadow-glow-primary py-0 gap-0 rounded-[1.25rem] relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                  <div className="flex items-center gap-4 border-b border-border/50 bg-muted/30 px-6 py-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-2 transition-all group-hover:bg-primary/10 group-hover:scale-105">
                      <Image
                        src={unit.logo}
                        alt={`Logo ${unit.name}`}
                        width={64}
                        height={64}
                        sizes="64px"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {unit.type}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-semibold transition-colors group-hover:text-primary">
                        {unit.name}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {unit.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {unit.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {unit.workPrograms.length} Program Kerja
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        {unit.members.length} Anggota
                      </span>
                    </div>
                    {unit.programs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {unit.programs.slice(0, 4).map((program) => (
                          <Badge key={program} variant="secondary" className="text-xs">
                            {program}
                          </Badge>
                        ))}
                        {unit.programs.length > 4 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            +{unit.programs.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
