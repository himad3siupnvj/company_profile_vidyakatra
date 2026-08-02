"use client"

import Image from "next/image"
import { Building2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export type OrganizationChartMember = {
  id: string
  name: string
  position: string
  department: string
  avatar: string
}

export type OrganizationChartUnit = {
  id: string
  name: string
  type: "department" | "bureau"
  imageUrl: string
  color: string
  memberCount: number
}

type OrganizationChartProps = {
  members: OrganizationChartMember[]
  units: OrganizationChartUnit[]
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function normalizePosition(position: string) {
  return position.toLowerCase().replace(/\s+/g, " ").trim()
}

function getCoreLevel(position: string) {
  const normalized = normalizePosition(position)

  if (
    normalized.includes("ketua") &&
    !normalized.includes("kepala") &&
    !normalized.includes("koordinator")
  ) {
    return "executive"
  }
  if (normalized.includes("sekretaris") || normalized.includes("bendahara")) {
    return "secretariat"
  }
  if (normalized.includes("koordinator")) return "coordinator"

  return null
}

function getCoreOrder(position: string) {
  const normalized = normalizePosition(position)

  if (normalized.includes("wakil ketua")) return 1
  if (normalized.includes("ketua")) return 0
  if (normalized.includes("sekretaris")) return 2
  if (normalized.includes("bendahara")) return 3
  if (normalized.includes("wakil koordinator")) return 5
  if (normalized.includes("koordinator")) return 4

  return 99
}

function PersonCard({
  member,
  featured = false,
}: {
  member: OrganizationChartMember
  featured?: boolean
}) {
  return (
    <div
      className={
        featured
          ? "w-full max-w-64 rounded-xl border border-primary/40 bg-primary/[0.06] p-4 text-center shadow-sm"
          : "w-full max-w-56 rounded-xl border border-border/70 bg-background/70 p-4 text-center shadow-sm"
      }
    >
      <Avatar className={featured ? "mx-auto h-14 w-14" : "mx-auto h-12 w-12"}>
        <AvatarImage src={member.avatar} />
        <AvatarFallback className={featured ? "bg-primary text-primary-foreground" : "text-sm"}>
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>
      <p className="mt-3 truncate text-sm font-semibold">{member.name}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{member.position}</p>
    </div>
  )
}

function Connector() {
  return <div className="h-8 w-px bg-border" />
}

export function OrganizationChart({ members, units }: OrganizationChartProps) {
  const coreMembers = members
    .filter((member) => getCoreLevel(member.position) !== null)
    .sort(
      (left, right) =>
        getCoreOrder(left.position) - getCoreOrder(right.position) ||
        left.name.localeCompare(right.name),
    )
  const executives = coreMembers.filter(
    (member) => getCoreLevel(member.position) === "executive",
  )
  const secretariat = coreMembers.filter(
    (member) => getCoreLevel(member.position) === "secretariat",
  )
  const coordinators = coreMembers.filter(
    (member) => getCoreLevel(member.position) === "coordinator",
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="mx-auto flex min-w-[800px] max-w-[1500px] flex-col items-center rounded-2xl border border-border/50 bg-background/30 px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Pimpinan Organisasi
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Struktur kepengurusan Kabinet Vidyakatra
          </p>
        </div>

        {executives.length > 0 && (
          <>
            <div className="flex justify-center gap-5">
              {executives.map((member) => (
                <PersonCard key={member.id} member={member} featured />
              ))}
            </div>
            <Connector />
          </>
        )}

        {secretariat.length > 0 && (
          <>
            <div className="flex justify-center gap-4">
              {secretariat.map((member) => (
                <PersonCard key={member.id} member={member} />
              ))}
            </div>
            <Connector />
          </>
        )}

        {coordinators.length > 0 && (
          <>
            <div className="flex justify-center gap-4">
              {coordinators.map((member) => (
                <PersonCard key={member.id} member={member} featured />
              ))}
            </div>
            <Connector />
          </>
        )}

        <div className="h-px w-[calc(100%-4rem)] bg-border" />
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {units.map((unit) => {
            const unitMembers = members.filter(
              (member) => member.department === unit.name,
            )
            const head =
              unitMembers.find((member) =>
                /kepala|ketua|koordinator/i.test(member.position),
              ) ?? unitMembers[0]

            return (
              <div key={unit.id} className="flex min-w-0 flex-col items-center">
                <div className="h-7 w-px bg-border" />
                <div className="flex h-full w-full min-h-56 flex-col rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-background/60 p-2">
                      {unit.imageUrl ? (
                        <Image
                          src={unit.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {unit.type === "bureau" ? "Biro" : "Departemen"}
                    </Badge>
                  </div>

                  <div
                    className={`mt-4 h-1.5 w-12 rounded-full ${unit.color.startsWith("#") ? "" : unit.color}`}
                    style={unit.color.startsWith("#") ? { backgroundColor: unit.color } : undefined}
                  />
                  <h3 className="mt-3 min-h-10 text-sm font-semibold leading-5">
                    {unit.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {unit.memberCount} anggota
                  </p>

                  <div className="mt-auto flex items-center gap-3 border-t pt-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={head?.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {head ? getInitials(head.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {head?.name ?? "Belum ditentukan"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {head?.position ?? "Kepala unit"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
