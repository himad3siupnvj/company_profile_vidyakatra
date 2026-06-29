"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertCircle, CheckCircle2, Database, RefreshCw, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"

type EnvCheck = {
  key: string
  label: string
  required: boolean
  configured: boolean
}

type HealthPayload = {
  ok: boolean
  checkedAt: string
  env: EnvCheck[]
  database: {
    ok: boolean
    latencyMs: number | null
    serverTime: string | null
    error: string | null
  }
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className={ok ? "gap-1" : "gap-1 bg-destructive/10 text-destructive"}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
      {ok ? "OK" : "Needs Check"}
    </Badge>
  )
}

function formatDate(value: string | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function AuthHealthPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadHealth() {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/auth-health", { cache: "no-store" })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? "Gagal memuat auth health.")
        setHealth(null)
        return
      }

      setHealth(data)
    } catch {
      setError("Gagal memuat auth health.")
      setHealth(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHealth()
  }, [])

  const missingEnv = useMemo(() => health?.env.filter((item) => item.required && !item.configured) ?? [], [health])

  if (isLoading && !health) {
    return <AdminPageSkeleton cards={3} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 gap-1 bg-primary/10 text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Auth Operations
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Kesehatan Autentikasi</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cek kesiapan konfigurasi login admin, storage, dan koneksi database untuk operasional CMS.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={loadHealth} disabled={isLoading}>
          <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Keseluruhan</p>
              <p className="mt-1 text-2xl font-bold">{health?.ok ? "Ready" : "Check"}</p>
            </div>
            <StatusBadge ok={Boolean(health?.ok)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Database</p>
              <p className="mt-1 text-2xl font-bold">{health?.database.latencyMs ?? "-"} ms</p>
            </div>
            <Database className={health?.database.ok ? "h-5 w-5 text-primary" : "h-5 w-5 text-destructive"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Lingkungan</CardTitle>
                <CardDescription>Nilai secret tidak ditampilkan, hanya status configured.</CardDescription>
              </div>
              <StatusBadge ok={Boolean(health && missingEnv.length === 0)} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(health?.env ?? []).map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.key}</p>
                </div>
                <StatusBadge ok={item.configured} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Koneksi Database</CardTitle>
              <CardDescription>Last check: {formatDate(health?.checkedAt ?? null)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge ok={Boolean(health?.database.ok)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm text-muted-foreground">Waktu server</span>
                <span className="text-sm font-medium">{formatDate(health?.database.serverTime ?? null)}</span>
              </div>
              {health?.database.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {health.database.error}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            Gunakan halaman ini saat login admin, upload, atau database terasa bermasalah di production.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
