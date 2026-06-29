"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Archive, Download, Save, Globe, Mail, Phone, MapPin, Instagram, Youtube, Linkedin, Music2 } from "lucide-react"
import { officialSocialUrls, type SocialMediaUrls } from "@/lib/social-links"
import { validatePublicSettings } from "@/lib/settings-validation"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [contactInfo, setContactInfo] = useState({
    email: "himpunand3si@gmail.com",
    phone: "",
    whatsapp: "",
    address: "Jl. R.S. Fatmawati No.1, Pondok Labu\nKec. Cilandak, Kota Jakarta Selatan\nDKI Jakarta 12450",
    officeHours: "Senin - Jumat, 08.00 - 19.00 WIB",
  })

  const [socialMedia, setSocialMedia] = useState<SocialMediaUrls>({
    ...officialSocialUrls,
  })

  const [footerSettings, setFooterSettings] = useState({
    showSocialMedia: true,
    showContactInfo: true,
    showQuickLinks: true,
    copyrightText: "© 2026 HIMA D3 Sistem Informasi UPNVJ. Kabinet Vidyakatra.",
  })

  const [quickLinks, setQuickLinks] = useState([
    { id: 1, label: "Beranda", url: "/", enabled: true },
    { id: 2, label: "Profil", url: "/kabinet", enabled: true },
    { id: 3, label: "Struktur Organisasi", url: "/kabinet#struktur", enabled: true },
    { id: 4, label: "Berita Acara", url: "/berita", enabled: true },
    { id: 5, label: "Kolaborasi", url: "/kontak", enabled: true },
  ])

  const [siteSettings, setSiteSettings] = useState({
    siteName: "HIMA D3 Sistem Informasi UPNVJ",
    siteDescription: "Website resmi Himpunan Mahasiswa D3 Sistem Informasi UPNVJ Kabinet Vidyakatra",
    maintenanceMode: false,
    analyticsEnabled: true,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab && ["general", "contact", "social", "footer"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true)
      try {
        const response = await fetch("/api/admin/settings")
        if (!response.ok) {
          const data = await response.json()
          setMessage(data.error || "Pengaturan gagal dimuat.")
          return
        }

        const data = await response.json()
        setContactInfo(data.contactInfo)
        setSocialMedia(data.socialMedia)
        setFooterSettings(data.footerSettings)
        setQuickLinks(data.quickLinks)
        setSiteSettings(data.siteSettings)
      } catch {
        setMessage("Pengaturan gagal dimuat. Periksa koneksi lalu muat ulang halaman.")
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const saveSettings = async () => {
    const validationError = validatePublicSettings({
      contactInfo,
      socialMedia,
      footerSettings,
      quickLinks,
      siteSettings,
    })
    if (validationError) {
      setMessage(validationError)
      return
    }
    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactInfo,
          socialMedia,
          footerSettings,
          quickLinks,
          siteSettings,
        }),
      })
      const data = await response.json()
      setMessage(response.ok ? "Pengaturan berhasil disimpan." : data.error || "Pengaturan gagal disimpan.")
    } catch {
      setMessage("Pengaturan gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  const downloadExport = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer")
  }

  const updateQuickLink = (id: number, field: string, value: string | boolean) => {
    setQuickLinks(quickLinks.map(link =>
      link.id === id ? { ...link, [field]: value } : link
    ))
  }

  if (isLoading) {
    return <AdminPageSkeleton tabs={4} cards={2} />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pengaturan Website</h1>
          <p className="text-muted-foreground">
            Kelola informasi publik, kanal media sosial, dan footer situs.
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={saveSettings} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      {message && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4 lg:w-auto">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="contact">Kontak</TabsTrigger>
          <TabsTrigger value="social" className="h-9 whitespace-normal text-center leading-tight">Media Sosial</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identitas Website</CardTitle>
              <CardDescription>
                Konfigurasi dasar untuk metadata dan identitas publik.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nama Website</Label>
                <Input
                  id="site-name"
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Deskripsi Website</Label>
                <Input
                  id="site-description"
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Dipakai untuk SEO dan preview saat website dibagikan.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Mode Pemeliharaan</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, visitors will see a maintenance page.
                  </p>
                </div>
                <Switch
                  checked={siteSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable visitor tracking and analytics.
                  </p>
                </div>
                <Switch
                  checked={siteSettings.analyticsEnabled}
                  onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, analyticsEnabled: checked })}
                />
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-4">
                  <Label>Ekspor Data CMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Download data penting untuk arsip internal.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadExport("/api/admin/export?entity=members&format=csv")}
                  >
                    <Download className="h-4 w-4" />
                    Members CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadExport("/api/admin/export?format=zip&entities=periods,members,users,organizational-units,divisions,articles,assets")}
                  >
                    <Archive className="h-4 w-4" />
                    Full ZIP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak</CardTitle>
              <CardDescription>
                Detail kontak ringkas yang ditampilkan di footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-9"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    className="pl-9"
                    value={contactInfo.whatsapp}
                    onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    className="pl-9"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="office-hours">Jam Layanan</Label>
                <Input
                  id="office-hours"
                  value={contactInfo.officeHours}
                  onChange={(e) => setContactInfo({ ...contactInfo, officeHours: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kanal Media Sosial</CardTitle>
              <CardDescription>
                Kanal resmi yang ditampilkan pada halaman Kontak, navigasi, dan footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="instagram"
                      className="pl-9"
                      value={socialMedia.instagram}
                      onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="youtube"
                      className="pl-9"
                      value={socialMedia.youtube}
                      onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="linkedin"
                      className="pl-9"
                      value={socialMedia.linkedin}
                      onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <div className="relative">
                    <Music2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="tiktok"
                      className="pl-9"
                      value={socialMedia.tiktok}
                      onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi Footer</CardTitle>
              <CardDescription>
                Sesuaikan footer dengan versi public site terbaru.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Tampilkan Media Sosial</Label>
                    <p className="text-xs text-muted-foreground">Tampilkan ikon media sosial pada footer.</p>
                  </div>
                  <Switch
                    checked={footerSettings.showSocialMedia}
                    onCheckedChange={(checked) => setFooterSettings({ ...footerSettings, showSocialMedia: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Tampilkan Informasi Kontak</Label>
                    <p className="text-xs text-muted-foreground">Tampilkan informasi kontak pada footer.</p>
                  </div>
                  <Switch
                    checked={footerSettings.showContactInfo}
                    onCheckedChange={(checked) => setFooterSettings({ ...footerSettings, showContactInfo: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Tampilkan Tautan Cepat</Label>
                    <p className="text-xs text-muted-foreground">Tampilkan tautan navigasi pada footer.</p>
                  </div>
                  <Switch
                    checked={footerSettings.showQuickLinks}
                    onCheckedChange={(checked) => setFooterSettings({ ...footerSettings, showQuickLinks: checked })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="copyright">Teks Hak Cipta</Label>
                <Input
                  id="copyright"
                  value={footerSettings.copyrightText}
                  onChange={(e) => setFooterSettings({ ...footerSettings, copyrightText: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tautan Cepat</CardTitle>
              <CardDescription>
                Manage footer navigation links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        value={link.label}
                        onChange={(e) => updateQuickLink(link.id, "label", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateQuickLink(link.id, "url", e.target.value)}
                      />
                    </div>
                  </div>
                  <Switch
                    checked={link.enabled}
                    onCheckedChange={(checked) => updateQuickLink(link.id, "enabled", checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
