import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MemberCarousel } from "@/components/public/member-carousel"
import { getPublicWorkUnits } from "@/lib/public-profile"

type UnitDetailPageProps = {
  params: Promise<{ slug: string }>
}
// Force rebuild to clear cache

export const revalidate = 3600

export async function generateStaticParams() {
  const workUnits = await getPublicWorkUnits()

  return workUnits.map((unit) => ({ slug: unit.slug }))
}

export default async function UnitDetailPage({ params }: UnitDetailPageProps) {
  const { slug } = await params
  const workUnits = await getPublicWorkUnits()
  const unit = workUnits.find((item) => item.slug === slug)
  console.log(`[DEBUG] Slug: ${slug}, Unit:`, JSON.stringify({ logo: unit?.logo, membersCount: unit?.members.length, firstMemberImage: unit?.members[0]?.image }, null, 2))

  if (!unit) {
    notFound()
  }

  return (
    <>
      <section className="border-b border-border bg-muted/40 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Button asChild variant="ghost" className="mb-8 gap-2 pl-0 text-muted-foreground hover:text-primary">
            <Link href="/kabinet#divisi">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Kabinet
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-medium text-primary">{unit.type}</p>
              <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
                {unit.name}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {unit.description}
              </p>
              {/* {unit.programs.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {unit.programs.map((program) => (
                    <Badge key={program} variant="secondary">
                      {program}
                    </Badge>
                  ))}
                </div>
              )} */}
            </div>

            <div className="mx-auto flex aspect-square w-56 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-primary/5 p-8 shadow-soft">
              <Image
                src={unit.logo}
                alt={`Logo ${unit.name}`}
                width={180}
                height={180}
                sizes="224px"
                className="h-full w-full object-contain transition-transform duration-500 hover:scale-110"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Anggota {unit.name}</h2>
            </div>
          </div>

          <MemberCarousel
            members={unit.members}
            centered={slug === "sosial-politik"}
            hideButtons={slug === "sosial-politik"}
          />
        </div>
      </section>

      <section className="border-y border-border bg-muted/40 py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-primary">Program kerja</p>
            <h2 className="text-3xl font-bold tracking-tight">Program kerja {unit.name}</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Rangkaian program kerja yang menjadi fokus {unit.type.toLowerCase()} selama periode Kabinet Vidyakatra.
            </p>
          </div>

          {unit.workPrograms.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {unit.workPrograms.map((program) => (
                <Card key={program.name} className="border-border/80 bg-background shadow-soft hover:shadow-glow-primary transition-all relative overflow-hidden rounded-[1.25rem]">
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="rounded-[1rem] bg-gradient-brand p-2.5 text-primary-foreground shadow-glow-primary-sm">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary">{program.status}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{program.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {program.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Program kerja belum ditambahkan.
            </div>
          )}
        </div>
      </section>
    </>
  )
}
