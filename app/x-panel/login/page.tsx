"use client"

import { FormEvent, useEffect, useState } from "react"
import { Loader2, LockKeyhole, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const loginRequestTimeoutMs = 12000

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loginPhase, setLoginPhase] = useState<"idle" | "submitting" | "redirecting">("idle")
  const [isClientReady, setIsClientReady] = useState(false)

  const isSubmitting = loginPhase !== "idle"
  const nextPath = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("next") ?? ""

  useEffect(() => {
    setIsClientReady(true)

    const errorCode = new URLSearchParams(window.location.search).get("error")

    if (errorCode === "required") setError("Email dan password wajib diisi.")
    if (errorCode === "invalid") setError("Email atau password tidak sesuai.")
    if (errorCode === "service") setError("Layanan login sedang bermasalah. Coba lagi sebentar.")
    if (errorCode === "rate-limit") setError("Terlalu banyak percobaan login. Coba lagi sebentar.")
  }, [])

  async function getLoginError(response: Response) {
    if (response.status === 429) {
      return "Terlalu banyak percobaan login. Coba lagi sebentar."
    }

    try {
      const data = await response.json()

      if (data.error === "Email and password are required") {
        return "Email dan password wajib diisi."
      }

      if (data.error === "Login service error") {
        return "Layanan login sedang bermasalah. Cek konfigurasi production atau coba lagi sebentar."
      }
    } catch {
      // Keep the default message below.
    }

    return "Email atau password tidak sesuai."
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setLoginPhase("submitting")
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), loginRequestTimeoutMs)
    const formData = new FormData(event.currentTarget)
    const loginEmail = String(formData.get("email") ?? "")
    const loginPassword = String(formData.get("password") ?? "")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        signal: controller.signal,
      })

      if (!response.ok) {
        setError(await getLoginError(response))
        setLoginPhase("idle")
        return
      }

      setLoginPhase("redirecting")
      window.location.assign(nextPath?.startsWith("/x-panel") && nextPath !== "/x-panel/login" ? nextPath : "/x-panel")
    } catch (error) {
      setError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Login terlalu lama merespons. Coba lagi sebentar."
          : "Login gagal. Coba lagi sebentar.",
      )
      setLoginPhase("idle")
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Masuk CMS</CardTitle>
            <CardDescription>
              Gunakan akun admin HIMA D3SI yang sudah dibuat administrator.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action="/api/auth/login/form"
            method="post"
            data-client-ready={isClientReady ? "true" : "false"}
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="next" value={nextPath} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@himad3si.ac.id"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                disabled={isSubmitting}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full gap-2" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loginPhase === "redirecting" ? "Membuka dashboard..." : loginPhase === "submitting" ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {loginPhase === "redirecting" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <p className="text-base font-semibold text-foreground">Membuka dashboard</p>
            <p className="mt-2 text-sm text-muted-foreground">Menyiapkan sesi admin...</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-[login-progress_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
