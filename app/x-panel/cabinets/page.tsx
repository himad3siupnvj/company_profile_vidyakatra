"use client"

import { useEffect, useState } from "react"
import { Eye, GripVertical, Heart, Lightbulb, Plus, Save, Star, Target, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  defaultProfileContent,
  type ProfileContent,
  type ProfileLeader,
  type ProfileMission,
  type ProfileValue,
} from "@/lib/profile-content-data"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"

const valueIcons = {
  star: Star,
  lightbulb: Lightbulb,
  heart: Heart,
  target: Target,
} as const

function nextId(items: Array<{ id: number }>) {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

export default function CabinetsManagement() {
  const [profileContent, setProfileContent] = useState<ProfileContent>(defaultProfileContent)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [confirmTarget, setConfirmTarget] = useState<null | { type: "mission" | "value" | "leader"; id: number; label: string }>(null)

  useEffect(() => {
    async function loadProfileContent() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/admin/cabinets", { cache: "no-store" })
        if (!response.ok) return

        const data = await response.json()
        setProfileContent(data.profileContent ?? defaultProfileContent)
      } catch {
        // Keep the schema-safe fallback so the editor remains usable offline.
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileContent()
  }, [])

  async function saveProfileContent() {
    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/cabinets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileContent }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setMessage(data?.error ?? "Konten profil gagal disimpan.")
        return
      }

      setProfileContent(data.profileContent)
      setMessage("Konten profil berhasil disimpan.")
    } catch {
      setMessage("Konten profil gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  function updateMission(id: number, patch: Partial<ProfileMission>) {
    setProfileContent((current) => ({
      ...current,
      missions: current.missions.map((mission) => (mission.id === id ? { ...mission, ...patch } : mission)),
    }))
  }

  function updateValue(id: number, patch: Partial<ProfileValue>) {
    setProfileContent((current) => ({
      ...current,
      values: current.values.map((value) => (value.id === id ? { ...value, ...patch } : value)),
    }))
  }

  function updateLeader(id: number, patch: Partial<ProfileLeader>) {
    setProfileContent((current) => ({
      ...current,
      leaders: current.leaders.map((leader) => (leader.id === id ? { ...leader, ...patch } : leader)),
    }))
  }

  function removeLeader(id: number) {
    setProfileContent((current) => ({
      ...current,
      leaders: current.leaders.filter((leader) => leader.id !== id),
    }))
    setMessage("Leader dihapus dari draft. Klik Save Changes untuk menyimpan.")
  }

  function removeMission(id: number) {
    setProfileContent((current) => ({
      ...current,
      missions: current.missions.filter((mission) => mission.id !== id),
    }))
    setMessage("Misi dihapus dari draft. Klik Save Changes untuk menyimpan.")
  }

  function removeValue(id: number) {
    setProfileContent((current) => ({
      ...current,
      values: current.values.filter((value) => value.id !== id),
    }))
    setMessage("Nilai dihapus dari draft. Klik Save Changes untuk menyimpan.")
  }

  function handleConfirmDelete() {
    if (!confirmTarget) return
    if (confirmTarget.type === "mission") removeMission(confirmTarget.id)
    if (confirmTarget.type === "value") removeValue(confirmTarget.id)
    if (confirmTarget.type === "leader") removeLeader(confirmTarget.id)
    setConfirmTarget(null)
  }

  if (isLoading) {
    return <AdminPageSkeleton tabs={6} cards={2} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Kabinet</h1>
          <p className="text-muted-foreground">
            Kelola intro kabinet, filosofi, visi, misi, values, dan pengurus inti untuk halaman profil kabinet.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button asChild variant="outline" className="gap-2">
            <a href="/kabinet" target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" />
              Preview
            </a>
          </Button>
          <Button className="gap-2" onClick={saveProfileContent} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {message && <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{message}</div>}

      <Tabs defaultValue="intro" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-6">
          <TabsTrigger value="intro">Pengantar</TabsTrigger>
          <TabsTrigger value="philosophy">Filosofi</TabsTrigger>
          <TabsTrigger value="vision">Visi</TabsTrigger>
          <TabsTrigger value="mission">Misi</TabsTrigger>
          <TabsTrigger value="values">Nilai</TabsTrigger>
          <TabsTrigger value="leaders">Pimpinan</TabsTrigger>
        </TabsList>

        <TabsContent value="intro">
          <Card>
            <CardHeader>
              <CardTitle>Pengantar Halaman Profil</CardTitle>
              <CardDescription>Konten hero dan narasi pembuka kabinet di halaman /profil.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Label Pendek</Label>
                <Input value={profileContent.intro.eyebrow} onChange={(event) => setProfileContent({ ...profileContent, intro: { ...profileContent.intro, eyebrow: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Judul Halaman</Label>
                <Input value={profileContent.intro.title} onChange={(event) => setProfileContent({ ...profileContent, intro: { ...profileContent.intro, title: event.target.value } })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Subtitle</Label>
                <Input value={profileContent.intro.subtitle} onChange={(event) => setProfileContent({ ...profileContent, intro: { ...profileContent.intro, subtitle: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Nama Kabinet</Label>
                <Input value={profileContent.intro.cabinetName} onChange={(event) => setProfileContent({ ...profileContent, intro: { ...profileContent.intro, cabinetName: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input value={profileContent.intro.tagline} onChange={(event) => setProfileContent({ ...profileContent, intro: { ...profileContent.intro, tagline: event.target.value } })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Deskripsi</Label>
                <Textarea rows={5} value={profileContent.intro.description} onChange={(event) => setProfileContent({ ...profileContent, intro: { ...profileContent.intro, description: event.target.value } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="philosophy">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Filosofi Organisasi</CardTitle>
                <CardDescription>Makna filosofis yang tampil di bagian tentang kabinet.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="philosophy-enabled" className="text-sm">Aktifkan</Label>
                <Switch id="philosophy-enabled" checked={profileContent.philosophy.enabled} onCheckedChange={(enabled) => setProfileContent({ ...profileContent, philosophy: { ...profileContent.philosophy, enabled } })} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Bagian</Label>
                <Input value={profileContent.philosophy.title} onChange={(event) => setProfileContent({ ...profileContent, philosophy: { ...profileContent.philosophy, title: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea rows={7} value={profileContent.philosophy.description} onChange={(event) => setProfileContent({ ...profileContent, philosophy: { ...profileContent.philosophy, description: event.target.value } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vision">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Visi</CardTitle>
                <CardDescription>Visi organisasi yang tampil di section Visi & Misi.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="vision-enabled" className="text-sm">Aktifkan</Label>
                <Switch id="vision-enabled" checked={profileContent.vision.enabled} onCheckedChange={(enabled) => setProfileContent({ ...profileContent, vision: { ...profileContent.vision, enabled } })} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input value={profileContent.vision.title} onChange={(event) => setProfileContent({ ...profileContent, vision: { ...profileContent.vision, title: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Pernyataan Visi</Label>
                <Textarea rows={6} value={profileContent.vision.description} onChange={(event) => setProfileContent({ ...profileContent, vision: { ...profileContent.vision, description: event.target.value } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mission">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Misi</CardTitle>
                <CardDescription>Misi organisasi yang tampil sebagai daftar bernomor.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setProfileContent({ ...profileContent, missions: [...profileContent.missions, { id: nextId(profileContent.missions), text: "", enabled: true }] })}
              >
                <Plus className="h-4 w-4" />
                Add Mission
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileContent.missions.map((mission) => (
                <div key={mission.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <GripVertical className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
                  <Textarea className="min-h-20 flex-1" value={mission.text} onChange={(event) => updateMission(mission.id, { text: event.target.value })} />
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch checked={mission.enabled} onCheckedChange={(enabled) => updateMission(mission.id, { enabled })} />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmTarget({ type: "mission", id: mission.id, label: mission.text || "Misi ini" })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="values">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Nilai Utama</CardTitle>
                <CardDescription>Nilai inti kabinet untuk profil publik dan narasi internal.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setProfileContent({ ...profileContent, values: [...profileContent.values, { id: nextId(profileContent.values), title: "", description: "", icon: "star", enabled: true }] })}
              >
                <Plus className="h-4 w-4" />
                Add Value
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileContent.values.map((value) => {
                const Icon = valueIcons[value.icon] ?? Star

                return (
                  <div key={value.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[2fr_3fr_9rem_auto] md:items-center">
                    <Input value={value.title} onChange={(event) => updateValue(value.id, { title: event.target.value })} placeholder="Title" />
                    <Input value={value.description} onChange={(event) => updateValue(value.id, { description: event.target.value })} placeholder="Description" />
                    <Select value={value.icon} onValueChange={(icon) => updateValue(value.id, { icon: icon as ProfileValue["icon"] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(valueIcons).map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Switch checked={value.enabled} onCheckedChange={(enabled) => updateValue(value.id, { enabled })} />
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setConfirmTarget({ type: "value", id: value.id, label: value.title || "Nilai ini" })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaders">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Pengurus Inti</CardTitle>
                <CardDescription>Konten ketua dan wakil ketua yang tampil di /profil.</CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setProfileContent({ ...profileContent, leaders: [...profileContent.leaders, { id: nextId(profileContent.leaders), group: "Pengurus Inti", name: "", position: "", description: "", imageKey: "ketuaLead", enabled: true }] })}
              >
                <Plus className="h-4 w-4" />
                Add Leader
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileContent.leaders.map((leader) => (
                <div key={leader.id} className="space-y-4 rounded-lg border p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input value={leader.group} onChange={(event) => updateLeader(leader.id, { group: event.target.value })} placeholder="Group" />
                    <Input value={leader.name} onChange={(event) => updateLeader(leader.id, { name: event.target.value })} placeholder="Name" />
                    <Input value={leader.position} onChange={(event) => updateLeader(leader.id, { position: event.target.value })} placeholder="Position" />
                  </div>
                  <Textarea rows={5} value={leader.description} onChange={(event) => updateLeader(leader.id, { description: event.target.value })} placeholder="Description" />
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={leader.imageKey} onValueChange={(imageKey) => updateLeader(leader.id, { imageKey: imageKey as ProfileLeader["imageKey"] })}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ketuaLead">Foto ketua</SelectItem>
                        <SelectItem value="wakilLead">Foto wakil</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch checked={leader.enabled} onCheckedChange={(enabled) => updateLeader(leader.id, { enabled })} />
                    <Badge variant={leader.enabled ? "default" : "secondary"}>{leader.enabled ? "Active" : "Hidden"}</Badge>
                    <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => setConfirmTarget({ type: "leader", id: leader.id, label: leader.name || "Leader ini" })}>
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {profileContent.leaders.length === 0 && (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Belum ada leader di draft ini. Tambahkan leader baru atau simpan perubahan untuk mengosongkan section.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item ini?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmTarget?.label}" akan dihapus dari draft. Perubahan baru tersimpan setelah kamu klik Save Changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
