"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  FileX2,
  Network,
  Newspaper,
  PenLine,
  Users,
} from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { RecentActivity } from "@/components/admin/recent-activity"
import { QuickActions } from "@/components/admin/quick-actions"
import { LiveDateTime } from "@/components/admin/live-date-time"
import { OrganizationChart } from "@/components/admin/organization-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminUser } from "@/components/admin/admin-user-context"
import { hasPermission } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type { RecentActivityItem } from "@/components/admin/recent-activity"

const dashboardRequestTimeoutMs = 8000

type DashboardSummary = {
  stats: {
    articles: {
      total: number
      views: number
      byStatus: Record<"draft" | "submitted" | "approved" | "rejected" | "published" | "archived", number>
    }
    organization: {
      units: number
      departments: number
      bureaus: number
    }
    users: {
      total: number
      active: number
      unclaimed: number
    }
    members: {
      total: number
    }
  }
  editorialQueue: Array<{
    id: string
    title: string
    type: string
    owner: string
    status: string
  }>
  reviewQueue: Array<{
    id: string
    title: string
    owner: string
    status: string
  }>
  recentActivity: RecentActivityItem[]
  rejectedArticles: Array<{
    id: string
    title: string
    rejectedNote: string | null
    authorName: string
    updatedAt: string
  }>
  warning?: string
}

type OrganizationMember = {
  id: string
  name: string
  position: string
  department: string
  avatar: string
}

type OrganizationUnit = {
  id: string
  name: string
  type: "department" | "bureau"
  imageUrl: string
  color: string
  memberCount: number
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase()
  const label = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
  const isReady = ["siap tayang", "aktif", "approved", "published"].includes(normalizedStatus)
  const isDraft = ["draft", "review", "submitted", "perlu review", "perlu update", "rejected"].includes(normalizedStatus)

  return (
    <Badge variant={isReady ? "default" : "secondary"} className={isDraft ? "bg-primary/10 text-primary" : undefined}>
      {label}
    </Badge>
  )
}

export default function AdminDashboard() {
  const { currentUser } = useAdminUser()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState("")
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([])
  const [organizationUnits, setOrganizationUnits] = useState<OrganizationUnit[]>([])
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true)
  const [isRejectedDialogOpen, setIsRejectedDialogOpen] = useState(false)
  const role = currentUser?.role
  const canCreateArticle = Boolean(role && hasPermission(role, "article.create"))
  const canReviewArticles = Boolean(role && hasPermission(role, "article.review"))
  const canManageOrg = Boolean(role && (hasPermission(role, "member.manage") || hasPermission(role, "org_unit.manage")))
  const canManageSettings = Boolean(role && hasPermission(role, "settings.manage"))

  useEffect(() => {
    async function loadSummary() {
      setIsLoadingSummary(true)
      setSummaryError("")
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), dashboardRequestTimeoutMs)

      try {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          setSummaryError(data?.error ?? "Dashboard gagal dimuat.")
          return
        }

        setSummary(data)
        if (data?.warning) {
          setSummaryError("Dashboard memakai data fallback karena database terlalu lama merespons.")
        }
      } catch (error) {
        setSummaryError(
          error instanceof DOMException && error.name === "AbortError"
            ? "Dashboard belum bisa mengambil data. Koneksi database terlalu lama merespons."
            : "Dashboard gagal dimuat. Coba refresh halaman.",
        )
      } finally {
        window.clearTimeout(timeoutId)
        setIsLoadingSummary(false)
      }
    }

    loadSummary()
  }, [])

  useEffect(() => {
    if (!canManageOrg) {
      setIsLoadingOrganization(false)
      return
    }

    async function loadOrganization() {
      try {
        const response = await fetch("/api/admin/organization", { cache: "no-store" })
        if (!response.ok) return

        const data = await response.json()
        setOrganizationMembers(data.members ?? [])
        setOrganizationUnits(data.organizationalUnits ?? [])
      } finally {
        setIsLoadingOrganization(false)
      }
    }

    void loadOrganization()
  }, [canManageOrg])

  const articleStats = summary?.stats.articles
  const organizationStats = summary?.stats.organization
  const userStats = summary?.stats.users
  const memberStats = summary?.stats.members

  const statusConfig: Record<string, { label: string; icon: typeof PenLine; color: string }> = {
    draft: { label: "Draft", icon: PenLine, color: "text-muted-foreground" },
    submitted: { label: "Submitted", icon: Clock, color: "text-amber-500" },
    approved: { label: "Approved", icon: CheckCircle2, color: "text-blue-500" },
    rejected: { label: "Rejected", icon: FileX2, color: "text-red-500" },
    published: { label: "Published", icon: Newspaper, color: "text-green-500" },
    archived: { label: "Archived", icon: FileText, color: "text-muted-foreground" },
  }

  const totalFromStatuses = articleStats
    ? Object.values(articleStats.byStatus).reduce((a, b) => a + b, 0)
    : 0

  const contentHealth = [
    {
      label: "Profil organisasi",
      description: organizationStats
        ? `${organizationStats.departments} departemen dan ${organizationStats.bureaus} biro aktif.`
        : "Memuat data dari database...",
      status: organizationStats && organizationStats.units > 0 ? "Siap tayang" : "Perlu update",
      value: organizationStats?.units ? 100 : 0,
    },
    {
      label: "Berita & artikel",
      description: articleStats
        ? `${articleStats.byStatus.published} dari ${totalFromStatuses} artikel sudah tayang.`
        : "Memuat data dari database...",
      status: !articleStats?.total
        ? "Perlu update"
        : articleStats.byStatus.submitted + articleStats.byStatus.draft + articleStats.byStatus.rejected > 0
          ? "Perlu review"
          : "Siap tayang",
      value: totalFromStatuses ? Math.round((articleStats!.byStatus.published / totalFromStatuses) * 100) : 0,
    },
  ]
  const visibleContentHealth = contentHealth.filter((item) => {
    if (item.label === "Profil organisasi") return canManageSettings || canManageOrg
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2">
            <Badge variant="outline">
              <LiveDateTime />
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="max-w-2xl text-muted-foreground">
            Pantau kesiapan konten public site, pengurus, workflow artikel, dan kanal digital Kabinet Vidyakatra.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Eye className="h-4 w-4" />
              Lihat Situs
            </Link>
          </Button>
          {canCreateArticle && <Button asChild className="gap-2">
            <Link href="/x-panel/news?action=create">
              <FileText className="h-4 w-4" />
              Buat Berita
            </Link>
          </Button>}
        </div>
      </div>

      {summaryError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {summaryError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[132px]" />)
        ) : (
          <>
            <StatsCard
              title="Total Artikel"
              value={articleStats?.total ?? 0}
              change={`${articleStats?.byStatus.published ?? 0} tayang, ${articleStats?.byStatus.draft ?? 0} draf`}
              changeType="positive"
              icon={Newspaper}
            />
            <StatsCard
              title="Sudah Tayang"
              value={articleStats?.byStatus.published ?? 0}
              change={totalFromStatuses ? `${Math.round((articleStats!.byStatus.published / totalFromStatuses) * 100)}% dari total` : "0%"}
              changeType={totalFromStatuses && articleStats!.byStatus.published > 0 ? "positive" : "neutral"}
              icon={CheckCircle2}
            />
            <StatsCard
              title="Anggota"
              value={memberStats?.total ?? 0}
              change={`${userStats?.active ?? 0} akun aktif, ${userStats?.unclaimed ?? 0} belum klaim`}
              changeType="neutral"
              icon={Users}
            />
            <StatsCard
              title="Total Pembaca"
              value={(articleStats?.views ?? 0).toLocaleString()}
              change={`${articleStats?.byStatus.submitted ?? 0} artikel menunggu review`}
              changeType={(articleStats?.byStatus.submitted ?? 0) > 0 ? "neutral" : "positive"}
              icon={Eye}
            />
          </>
        )}
      </div>

      {/* Article Workflow Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Pipeline Artikel</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {articleStats?.total ?? 0} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Alur kerja artikel dari draf hingga tayang.
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingSummary ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {(["draft", "submitted", "approved", "rejected", "published", "archived"] as const).map((key) => {
                const cfg = statusConfig[key]
                const count = articleStats?.byStatus[key] ?? 0
                const pct = totalFromStatuses ? Math.round((count / totalFromStatuses) * 100) : 0
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border p-4",
                      key === "rejected" && "cursor-pointer transition-colors hover:border-red-300 hover:bg-red-50/50",
                    )}
                    onClick={key === "rejected" ? () => setIsRejectedDialogOpen(true) : undefined}
                    onKeyDown={key === "rejected" ? (e) => { if (e.key === "Enter") setIsRejectedDialogOpen(true) } : undefined}
                    tabIndex={key === "rejected" ? 0 : undefined}
                    role={key === "rejected" ? "button" : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{count}</p>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{pct}%</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected Articles Dialog */}
      <Dialog open={isRejectedDialogOpen} onOpenChange={setIsRejectedDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Artikel Ditolak</DialogTitle>
            <DialogDescription>
              {summary?.rejectedArticles.length
                ? `${summary.rejectedArticles.length} artikel ditolak dan perlu direvisi.`
                : "Tidak ada artikel yang ditolak."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {summary?.rejectedArticles.length ? (
              summary.rejectedArticles.map((article) => (
                <div key={article.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{article.title}</p>
                    <Badge variant="secondary" className="shrink-0 bg-red-50 text-red-600 border-red-200">
                      Ditolak
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Oleh: {article.authorName}
                  </p>
                  {article.rejectedNote && (
                    <div className="rounded-md bg-red-50/50 border border-red-100 p-3">
                      <p className="text-xs font-medium text-red-600 mb-1">Catatan penolakan:</p>
                      <p className="text-sm text-red-700">{article.rejectedNote}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Belum ada artikel yang ditolak.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {canManageOrg && (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Network className="h-5 w-5 text-primary" />
                Struktur Organisasi
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Ringkasan pimpinan, pengurus inti, departemen, dan biro aktif.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/x-panel/organization?tab=structure">
                Kelola Struktur
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingOrganization ? (
              <Skeleton className="h-72" />
            ) : organizationMembers.length === 0 && organizationUnits.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Struktur organisasi belum memiliki data.
              </div>
            ) : (
              <OrganizationChart
                members={organizationMembers}
                units={organizationUnits}
              />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Kesiapan Konten</CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                3 prioritas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoadingSummary ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[106px]" />
            )) : visibleContentHealth.map((item) => (
              <div key={item.label} className="space-y-2 rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Antrian Editorial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingSummary ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-[62px]" />
            )) : summary?.editorialQueue.length ? summary.editorialQueue.map((item) => (
              <div key={item.title} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.type} - {item.owner}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            )) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Belum ada artikel di antrian editorial.
              </div>
            )}
            <Button asChild variant="secondary" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/x-panel/news">
                Kelola Editorial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          {isLoadingSummary ? <Skeleton className="h-[360px]" /> : <RecentActivity activities={summary?.recentActivity ?? []} />}
        </div>

        <div className="min-w-0 space-y-6">
          <QuickActions />

          {canReviewArticles && <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Antrian Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingSummary ? Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[66px]" />
              )) : summary?.reviewQueue.length ? summary.reviewQueue.map((item) => (
                <div key={item.title} className="flex min-w-0 items-start gap-3 rounded-lg border p-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.owner}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              )) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Tidak ada artikel yang menunggu review.
                </div>
              )}
            </CardContent>
          </Card>}
        </div>
      </div>

    </div>
  )
}
