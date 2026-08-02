"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Archive, CheckCircle2, Edit, Eye, FileText, History, ImagePlus, Info, Loader2, Monitor, MoreHorizontal, PenLine, Plus, RotateCcw, Search, Send, Trash2, Upload, XCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ArticleDocumentRenderer } from "@/components/public/article-document-renderer"
import {
  createEmptyArticleDocument,
  getArticleReadTime,
  type ArticleDocument,
} from "@/lib/article-content"
import dynamic from "next/dynamic"
import { optimizeImageForUpload, type ImageProcessingStage } from "@/lib/client-image-processing"
import {
  articleWorkflowPermissions,
  getArticleWorkflowActions,
  type ArticleWorkflowAction,
} from "@/lib/article-workflow"
import { useAdminUser } from "@/components/admin/admin-user-context"
import { hasPermission } from "@/lib/permissions"

const NotionArticleEditor = dynamic(
  () =>
    import("@/components/admin/notion-article-editor").then(
      (module) => module.NotionArticleEditor,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />,
  },
)

interface Article {
  id: string
  title: string
  excerpt: string
  category: string
  categoryLabel?: string
  status: "draft" | "submitted" | "approved" | "rejected" | "published" | "archived"
  author: string
  publishedAt: string | null
  createdAt: string
  thumbnail: string
  thumbnailAlt: string
  readTime: string
  featured: boolean
  views: number
  content?: ArticleDocument
  organizationalUnitId: string | null
  unitName: string | null
  deletedAt: string | null
  rejectedNote: string | null
}

interface ArticleVersion {
  id: string
  versionNumber: number
  reason: string
  createdAt: string
  createdByName: string
  snapshot: {
    title: string
    excerpt: string | null
    content: ArticleDocument
    status: Article["status"]
    thumbnailUrl: string | null
    thumbnailAlt: string | null
  }
}

const articleCategories = [
  { value: "berita", label: "Berita Acara" },
  { value: "kegiatan", label: "Kegiatan" },
  { value: "pengumuman", label: "Pengumuman" },
  { value: "prestasi", label: "Prestasi" },
]

const articlesRequestTimeoutMs = 8000

const workflowActionLabels: Record<ArticleWorkflowAction, string> = {
  submit: "Ajukan untuk Ditinjau",
  approve: "Setujui & Terbitkan",
  reject: "Tolak",
  archive: "Arsipkan",
  restore: "Pulihkan ke Draf",
}

const workflowActionIcons = {
  submit: Send,
  approve: CheckCircle2,
  reject: XCircle,
  archive: Archive,
  restore: RotateCcw,
} satisfies Record<ArticleWorkflowAction, typeof Send>

export default function ArticleManagementPage() {
  const { currentUser } = useAdminUser()
  const [articles, setArticles] = useState<Article[]>([])
  const [nextArticlePage, setNextArticlePage] = useState<number | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoadingArticles, setIsLoadingArticles] = useState(true)
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null)
  const [orgUnitDropdown, setOrgUnitDropdown] = useState("")
  const [customUnitName, setCustomUnitName] = useState("")

  const [newArticle, setNewArticle] = useState({
    title: "",
    excerpt: "",
    category: "",
    author: "Tim Media",
    thumbnailUrl: "",
    thumbnailAlt: "",
    featured: false,
    organizationalUnitId: null as string | null,
    unitName: null as string | null,
  })
  const [articleContent, setArticleContent] = useState<ArticleDocument>(createEmptyArticleDocument())
  const [updatingArticleId, setUpdatingArticleId] = useState<string | null>(null)
  const [coverUploadStage, setCoverUploadStage] = useState<ImageProcessingStage>("idle")
  const [isGeneratingSource, setIsGeneratingSource] = useState(false)
  const [generatedDraftMessage, setGeneratedDraftMessage] = useState("")
  const [isSavingArticle, setIsSavingArticle] = useState(false)
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null)
  const [historyArticle, setHistoryArticle] = useState<Article | null>(null)
  const [articleVersions, setArticleVersions] = useState<ArticleVersion[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [orgUnits, setOrgUnits] = useState<{ id: string; name: string; type: string }[]>([])
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null)
  const [rejectArticle, setRejectArticle] = useState<Article | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get("action") === "create") {
      setIsCreateArticleOpen(true)
    }
  }, [])

  useEffect(() => {
    fetch("/api/admin/organizational-units", { cache: "no-store" })
      .then((res) => res.json())
      .then(setOrgUnits)
      .catch(() => {})
  }, [])

  async function loadArticles(showDeleted = false) {
    setIsLoadingArticles(true)
    setErrorMessage("")
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), articlesRequestTimeoutMs)

    try {
      const url = `/api/admin/articles?page=1&limit=50${showDeleted ? "&showDeleted=true" : ""}`
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Artikel gagal dimuat.")
        return
      }

      setArticles(data.articles)
      setNextArticlePage(data.pagination?.hasMore ? 2 : null)
    } catch (error) {
      setErrorMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Artikel belum bisa dimuat. Koneksi database terlalu lama merespons."
          : "Artikel gagal dimuat. Coba refresh halaman.",
      )
    } finally {
      window.clearTimeout(timeoutId)
      setIsLoadingArticles(false)
    }
  }

  useEffect(() => {
    loadArticles(filterStatus === "trash")
  }, [filterStatus])

  const handleLoadMoreArticles = async () => {
    if (!nextArticlePage || isLoadingMore) return

    setIsLoadingMore(true)
    const showDeleted = filterStatus === "trash"

    try {
      const response = await fetch(`/api/admin/articles?page=${nextArticlePage}&limit=50${showDeleted ? "&showDeleted=true" : ""}`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Artikel berikutnya gagal dimuat.")
        return
      }

      setArticles((current) => {
        const existingIds = new Set(current.map((article) => article.id))
        return [...current, ...data.articles.filter((article: Article) => !existingIds.has(article.id))]
      })
      setNextArticlePage(data.pagination?.hasMore ? nextArticlePage + 1 : null)
    } catch {
      setErrorMessage("Artikel berikutnya gagal dimuat. Coba lagi sebentar.")
    } finally {
      setIsLoadingMore(false)
    }
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      filterStatus === "all" || filterStatus === "trash"
        ? true
        : article.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const resetArticleForm = () => {
    setEditingArticleId(null)
    setNewArticle({ title: "", excerpt: "", category: "", author: "Tim Media", thumbnailUrl: "", thumbnailAlt: "", featured: false, organizationalUnitId: null, unitName: null })
    setOrgUnitDropdown("")
    setCustomUnitName("")
    setArticleContent(createEmptyArticleDocument())
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateArticleOpen(open)

    if (!open) {
      resetArticleForm()
      setGeneratedDraftMessage("")
    }
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticleId(article.id)
    const unitId = article.organizationalUnitId ?? null
    setNewArticle({
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      author: article.author,
      thumbnailUrl: article.thumbnail === "/news/default.jpg" ? "" : article.thumbnail,
      thumbnailAlt: article.thumbnailAlt,
      featured: article.featured,
      organizationalUnitId: unitId,
      unitName: article.unitName ?? null,
    })
    if (unitId) {
      setOrgUnitDropdown(unitId)
      setCustomUnitName("")
    } else if (article.unitName) {
      setOrgUnitDropdown("other")
      setCustomUnitName(article.unitName)
    } else {
      setOrgUnitDropdown("")
      setCustomUnitName("")
    }
    setArticleContent(article.content ?? createEmptyArticleDocument())
    setIsCreateArticleOpen(true)
  }

  const handleSaveArticle = async () => {
    if (isSavingArticle) return

    const readTime = getArticleReadTime(articleContent)
    const isEditing = Boolean(editingArticleId)

    setIsSavingArticle(true)

    try {
      const response = await fetch("/api/admin/articles", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingArticleId,
          ...newArticle,
          organizationalUnitId: orgUnitDropdown === "other" ? null : orgUnitDropdown || null,
          unitName: orgUnitDropdown === "other"
            ? customUnitName.trim() || null
            : orgUnits.find((u) => u.id === orgUnitDropdown)?.name || null,
          readTime,
          content: articleContent,
        }),
      })

      if (!response.ok) return

      const data = await response.json()
      setArticles((currentArticles) =>
        isEditing
          ? currentArticles.map((article) => (article.id === editingArticleId ? data.article : article))
          : [data.article, ...currentArticles],
      )
      setIsCreateArticleOpen(false)
      resetArticleForm()
    } catch {
      // The form stays open so the user can retry.
    } finally {
      setIsSavingArticle(false)
    }
  }

  const handleUploadCover = async (file: File | null) => {
    if (!file) return

    setErrorMessage("")
    setCoverUploadStage("compressing")

    let uploadFile = file

    try {
      uploadFile = await optimizeImageForUpload(file, { maxWidth: 1600, maxHeight: 1200 })
    } catch {
      uploadFile = file
    }

    setCoverUploadStage("uploading")

    const formData = new FormData()
    formData.append("file", uploadFile)
    formData.append("purpose", "article-image")
    formData.append("section", "articles")
    formData.append("category", newArticle.category || "general")
    formData.append("kind", "cover")

    try {
      const response = await fetch("/api/admin/assets", {
        method: "POST",
        body: formData,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Upload cover gagal.")
        return
      }

      setNewArticle((current) => ({
        ...current,
        thumbnailUrl: data.asset.url,
        thumbnailAlt: current.thumbnailAlt || data.asset.fileName,
      }))
    } catch {
      setErrorMessage("Upload cover gagal. Coba lagi sebentar.")
    } finally {
      setCoverUploadStage("idle")
    }
  }

  const handleGenerateFromSource = async (file: File | null) => {
    if (!file) return

    setErrorMessage("")
    setIsGeneratingSource(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/articles/generate", {
        method: "POST",
        body: formData,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Generate draft dari source gagal.")
        return
      }

      setArticles((currentArticles) => [data.article, ...currentArticles])
      setEditingArticleId(data.article.id)
      setNewArticle({
        title: data.article.title,
        excerpt: data.article.excerpt ?? "",
        category: data.article.category,
        author: data.article.author,
        thumbnailUrl: data.article.thumbnail === "/news/default.jpg" ? "" : data.article.thumbnail,
        thumbnailAlt: data.article.thumbnailAlt ?? "",
        featured: data.article.featured,
        organizationalUnitId: null,
        unitName: null,
      })
      if (data.article.content) {
        setArticleContent(data.article.content as ArticleDocument)
      }
      setGeneratedDraftMessage(`Draft "${data.article.title}" berhasil dibuat. Anda bisa langsung mengedit atau menutup dialog ini.`)
    } catch {
      setErrorMessage("Generate draft dari source gagal. Coba lagi sebentar.")
    } finally {
      setIsGeneratingSource(false)
    }
  }

  const handleDeleteArticle = async (id: string) => {
    const previousArticles = articles
    setArticles(articles.filter((article) => article.id !== id))

    try {
      const response = await fetch(`/api/admin/articles?id=${id}`, { method: "DELETE" })
      if (!response.ok) {
        setArticles(previousArticles)
      }
    } catch {
      setArticles(previousArticles)
    }
  }

  const confirmDeleteArticle = (id: string) => {
    setDeleteArticleId(id)
  }

  const handleWorkflowAction = async (article: Article, action: ArticleWorkflowAction) => {
    if (action === "reject") {
      setRejectArticle(article)
      setRejectNote("")
      return
    }

    setUpdatingArticleId(article.id)

    try {
      const response = await fetch("/api/admin/articles/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          action,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setErrorMessage(data?.error ?? "Workflow article gagal diproses.")
        return
      }

      const data = await response.json()
      setArticles((currentArticles) =>
        currentArticles.map((currentArticle) =>
          currentArticle.id === article.id ? data.article : currentArticle,
        ),
      )
    } catch {
      setErrorMessage("Workflow article gagal diproses. Coba lagi sebentar.")
    } finally {
      setUpdatingArticleId(null)
    }
  }

  const handleRestoreArticle = async (id: string) => {
    setUpdatingArticleId(id)

    try {
      const response = await fetch("/api/admin/articles/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "restore" }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setErrorMessage(data?.error ?? "Gagal memulihkan artikel.")
        return
      }

      const data = await response.json()
      setArticles((currentArticles) =>
        currentArticles.map((currentArticle) =>
          currentArticle.id === id ? { ...data.article, deletedAt: null } : currentArticle,
        ),
      )
    } catch {
      setErrorMessage("Gagal memulihkan artikel. Coba lagi sebentar.")
    } finally {
      setUpdatingArticleId(null)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectArticle || !rejectNote.trim()) return

    const article = rejectArticle
    setRejectArticle(null)
    setUpdatingArticleId(article.id)

    try {
      const response = await fetch("/api/admin/articles/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          action: "reject",
          rejectedNote: rejectNote.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setErrorMessage(data?.error ?? "Gagal menolak artikel.")
        return
      }

      const data = await response.json()
      setArticles((currentArticles) =>
        currentArticles.map((currentArticle) =>
          currentArticle.id === article.id ? data.article : currentArticle,
        ),
      )
    } catch {
      setErrorMessage("Gagal menolak artikel. Coba lagi sebentar.")
    } finally {
      setUpdatingArticleId(null)
    }
  }

  const [errorMessage, setErrorMessage] = useState("")

  const handleOpenHistory = async (article: Article) => {
    setHistoryArticle(article)
    setArticleVersions([])
    setIsLoadingHistory(true)

    try {
      const response = await fetch(
        `/api/admin/articles/versions?articleId=${encodeURIComponent(article.id)}`,
        { cache: "no-store" },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Riwayat artikel gagal dimuat.")
        return
      }

      setArticleVersions(data.versions ?? [])
    } catch {
      setErrorMessage("Riwayat artikel gagal dimuat.")
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const getStatusColor = (status: Article["status"]) => {
    const colors: Record<Article["status"], string> = {
      published: "bg-green-100 text-green-700",
      approved: "bg-emerald-100 text-emerald-700",
      submitted: "bg-blue-100 text-blue-700",
      draft: "bg-yellow-100 text-yellow-700",
      rejected: "bg-red-100 text-red-700",
      archived: "bg-gray-100 text-gray-700",
    }

    return colors[status]
  }

  const isTrashView = filterStatus === "trash"

  return (
    <div className="space-y-6">
      <Dialog open={Boolean(previewArticle)} onOpenChange={(open) => !open && setPreviewArticle(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader className="pr-10">
            <DialogTitle className="break-words leading-snug">
              {previewArticle?.title ?? "Pratinjau Artikel"}
            </DialogTitle>
            <DialogDescription>
              {previewArticle
                ? `${previewArticle.categoryLabel ?? previewArticle.category} / ${previewArticle.author} / ${previewArticle.readTime}`
                : "Preview isi artikel."}
            </DialogDescription>
          </DialogHeader>
          {previewArticle && (
            <div className="space-y-6">
              {previewArticle.excerpt && (
                <p className="text-lg leading-8 text-muted-foreground">{previewArticle.excerpt}</p>
              )}
              <ArticleDocumentRenderer
                document={previewArticle.content ?? createEmptyArticleDocument()}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteArticleId)} onOpenChange={(open) => !open && setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Artikel?</AlertDialogTitle>

            <AlertDialogDescription>
              Artikel akan disembunyikan dari publikasi. Tindakan ini bisa dibatalkan oleh administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteArticleId) handleDeleteArticle(deleteArticleId)
                setDeleteArticleId(null)
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(rejectArticle)} onOpenChange={(open) => !open && setRejectArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Artikel</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan catatan revisi untuk penulis artikel "{rejectArticle?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-note">Catatan Revisi</Label>
            <Textarea
              id="reject-note"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Jelaskan apa yang perlu diperbaiki..."
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!rejectNote.trim()}
              onClick={handleConfirmReject}
            >
              Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(historyArticle)} onOpenChange={(open) => !open && setHistoryArticle(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Riwayat Versi</DialogTitle>
            <DialogDescription>
              Snapshot sebelum perubahan besar atau publikasi untuk {historyArticle?.title}.
            </DialogDescription>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat riwayat...
            </div>
          ) : articleVersions.length ? (
            <div className="space-y-4">
              {articleVersions.map((version) => (
                <Card key={version.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        Versi {version.versionNumber}: {version.snapshot.title}
                      </CardTitle>
                      <Badge variant="outline">
                        {version.reason === "publish" ? "Sebelum publikasi" : "Sebelum edit"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString("id-ID")} oleh {version.createdByName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {version.snapshot.excerpt && (
                      <p className="text-sm text-muted-foreground">{version.snapshot.excerpt}</p>
                    )}
                    <ArticleDocumentRenderer document={version.snapshot.content} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Belum ada snapshot. Riwayat dibuat saat artikel diedit atau dipublikasikan.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pengelolaan Artikel</h1>
          <p className="text-muted-foreground">
            Tulis, simpan draft, dan ajukan berita acara melalui workflow approval.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <FileText className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terbit</p>
              {isLoadingArticles ? <Skeleton className="h-7 w-12" /> : <p className="text-xl font-bold">{articles.filter((article) => article.status === "published" && !article.deletedAt).length}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <Send className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diajukan</p>
              {isLoadingArticles ? <Skeleton className="h-7 w-12" /> : <p className="text-xl font-bold">{articles.filter((article) => article.status === "submitted" && !article.deletedAt).length}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-yellow-100 p-2">
              <Edit className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Draf</p>
              {isLoadingArticles ? <Skeleton className="h-7 w-12" /> : <p className="text-xl font-bold">{articles.filter((article) => article.status === "draft" && !article.deletedAt).length}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Dilihat</p>
              {isLoadingArticles ? <Skeleton className="h-7 w-16" /> : <p className="text-xl font-bold">{articles.reduce((acc, article) => acc + article.views, 0).toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Semua Artikel</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="w-full pl-9 sm:w-64"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="draft">Draf</SelectItem>
                <SelectItem value="submitted">Diajukan</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="published">Terbit</SelectItem>
                <SelectItem value="archived">Diarsipkan</SelectItem>
                <SelectItem value="trash">Sampah</SelectItem>
                </SelectContent>
            </Select>
            <Dialog open={isCreateArticleOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{editingArticleId ? "Edit Article" : "Create New Article"}</DialogTitle>
                  <DialogDescription>
                    {editingArticleId
                      ? "Edit draft atau artikel revisi sebelum diajukan lagi."
                      : "Buat artikel sebagai draft. Publish akan berjalan otomatis setelah approval."}
                  </DialogDescription>
                </DialogHeader>
                {generatedDraftMessage && (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{generatedDraftMessage}</span>
                  </div>
                )}
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Info className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Info Dasar</h3>
                        <p className="text-sm text-muted-foreground">Data utama yang tampil di card berita.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="article-title">Judul</Label>
                        <Input
                          id="article-title"
                          value={newArticle.title}
                          onChange={(event) => setNewArticle({ ...newArticle, title: event.target.value })}
                          placeholder="Contoh: Workshop UI/UX Design Bersama Praktisi Industri"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="article-category">Kategori</Label>
                          <Select
                            value={newArticle.category}
                            onValueChange={(value) => setNewArticle({ ...newArticle, category: value })}
                          >
                            <SelectTrigger id="article-category">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {articleCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="article-unit">Biro / Departemen</Label>
                          <Select value={orgUnitDropdown} onValueChange={setOrgUnitDropdown}>
                            <SelectTrigger id="article-unit">
                              <SelectValue placeholder="Pilih unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {orgUnits.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="other">Other (Custom)</SelectItem>
                            </SelectContent>
                          </Select>
                          {orgUnitDropdown === "other" && (
                            <Input
                              value={customUnitName}
                              onChange={(e) => setCustomUnitName(e.target.value)}
                              placeholder="Nama unit kustom..."
                            />
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Estimasi Waktu Baca</Label>
                          <Input value={getArticleReadTime(articleContent)} readOnly className="bg-muted/50" />
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Sumber Berita Acara</h3>
                        <p className="text-sm text-muted-foreground">Upload sumber berita acara, lalu generate draft dari PDF atau DOCX.</p>
                      </div>
                    </div>
                    <Button type="button" className="relative w-full gap-2" disabled={isGeneratingSource}>
                      {isGeneratingSource ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                      {isGeneratingSource ? "Generating..." : "Generate Draft from Source"}
                      <input
                        type="file"
                        accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        disabled={isGeneratingSource}
                        onChange={(event) => handleGenerateFromSource(event.target.files?.[0] ?? null)}
                      />
                    </Button>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Monitor className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Tampilan di Website</h3>
                        <p className="text-sm text-muted-foreground">Atur cover dan status unggulan di halaman publik.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50">
                          {newArticle.thumbnailUrl ? (
                            <img src={newArticle.thumbnailUrl} alt={newArticle.thumbnailAlt || newArticle.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <ImagePlus className="mx-auto h-7 w-7 text-muted-foreground" />
                              <p className="mt-1 text-xs text-muted-foreground">Pratinjau kartu</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            value={newArticle.thumbnailUrl}
                            onChange={(event) => setNewArticle({ ...newArticle, thumbnailUrl: event.target.value })}
                            placeholder="Paste URL gambar cover..."
                          />
                          <Button type="button" variant="outline" size="sm" className="relative w-full gap-2" disabled={coverUploadStage !== "idle"}>
                            {coverUploadStage !== "idle" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {coverUploadStage === "compressing" ? "Compressing..." : coverUploadStage === "uploading" ? "Uploading..." : "Upload Cover"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                              disabled={coverUploadStage !== "idle"}
                              onChange={(event) => handleUploadCover(event.target.files?.[0] ?? null)}
                            />
                          </Button>
                          <Input
                            value={newArticle.thumbnailAlt}
                            onChange={(event) => setNewArticle({ ...newArticle, thumbnailAlt: event.target.value })}
                            placeholder="Deskripsi gambar untuk aksesibilitas"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
                        <div>
                          <Label>Jadikan Unggulan</Label>
                          <p className="text-xs text-muted-foreground">Artikel bisa ditarik ke area unggulan/latest news.</p>
                        </div>
                        <Switch
                          checked={newArticle.featured}
                          onCheckedChange={(checked) => setNewArticle({ ...newArticle, featured: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <PenLine className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Publikasi</h3>
                        <p className="text-sm text-muted-foreground">Nama penulis yang terlihat di halaman berita.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="article-author">Penulis</Label>
                      <Input
                        id="article-author"
                        value={newArticle.author}
                        onChange={(event) => setNewArticle({ ...newArticle, author: event.target.value })}
                        placeholder="Tim Media"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">Isi Artikel</h3>
                      <p className="text-sm text-muted-foreground">Tulis artikel di kanvas kosong. Ketik / untuk menambah block.</p>
                    </div>
                    <NotionArticleEditor
                      value={articleContent}
                      onChange={setArticleContent}
                      previewTitle={newArticle.title}
                      previewCategory={articleCategories.find((category) => category.value === newArticle.category)?.label ?? "Berita Acara"}
                      previewMeta={`${newArticle.author || "Tim Media"} / ${getArticleReadTime(articleContent)}`}
                      uploadCategory={newArticle.category || "general"}
                      uploadKind="content"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveArticle} disabled={isSavingArticle}>
                    <Archive className="mr-2 h-4 w-4" />
                    {isSavingArticle ? "Saving..." : editingArticleId ? "Update Draft" : "Save Draft"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>Artikel</TableHead>
                  <TableHead className="hidden lg:table-cell">Kategori</TableHead>
                  <TableHead className="hidden lg:table-cell">Penulis</TableHead>
                  <TableHead className="hidden xl:table-cell">Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Dilihat</TableHead>
                  <TableHead>{filterStatus === "trash" ? "Dihapus" : "Tanggal"}</TableHead>
                  <TableHead className="sticky right-0 w-12 bg-background"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingArticles ? Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                )) : filteredArticles.map((article) => {
                  const itemIsTrashed = Boolean(article.deletedAt)

                  return (
                  <TableRow key={article.id} className={`${updatingArticleId === article.id ? "opacity-60" : ""} ${itemIsTrashed ? "opacity-60" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded bg-muted">
                          {article.thumbnail && <img src={article.thumbnail} alt={article.thumbnailAlt} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <p className={`font-medium ${itemIsTrashed ? "line-through text-muted-foreground" : ""}`}>{article.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{article.excerpt}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary">{article.categoryLabel ?? article.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{article.author}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">
                      {article.unitName || (article.organizationalUnitId ? orgUnits.find((u) => u.id === article.organizationalUnitId)?.name : null) || <span className="text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={getStatusColor(article.status)}>{article.status}</Badge>
                        {article.status === "rejected" && article.rejectedNote && (
                          <p className="max-w-[200px] truncate text-xs text-muted-foreground" title={article.rejectedNote}>
                            {article.rejectedNote}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{article.views.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {itemIsTrashed
                        ? new Date(article.deletedAt!).toLocaleDateString("id-ID")
                        : article.publishedAt || article.createdAt}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${article.title}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {itemIsTrashed ? (
                            <DropdownMenuItem
                              onClick={() => handleRestoreArticle(article.id)}
                              disabled={updatingArticleId === article.id}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Pulihkan
                            </DropdownMenuItem>
                          ) : (
                            <>
                          <DropdownMenuItem
                            onClick={() => handleEditArticle(article)}
                            disabled={article.status !== "draft" && article.status !== "rejected" && article.status !== "published"}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPreviewArticle(article)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenHistory(article)}>
                            <History className="mr-2 h-4 w-4" />
                            History
                          </DropdownMenuItem>
                          {getArticleWorkflowActions(article.status)
                            .filter((action) =>
                              Boolean(
                                currentUser &&
                                hasPermission(currentUser.role, articleWorkflowPermissions[action]),
                              ),
                            )
                            .map((action) => {
                            const Icon = workflowActionIcons[action]

                            return (
                              <DropdownMenuItem
                                key={action}
                                onClick={() => handleWorkflowAction(article, action)}
                                disabled={updatingArticleId === article.id}
                              >
                                <Icon className="mr-2 h-4 w-4" />
                                {workflowActionLabels[action]}
                              </DropdownMenuItem>
                            )
                            })}
                          {currentUser && hasPermission(currentUser.role, "article.delete") && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => confirmDeleteArticle(article.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })}
                {!isLoadingArticles && filteredArticles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {articles.length === 0 && !isTrashView
                          ? "Belum ada artikel di database. Buat draft baru atau generate dari PDF/DOCX."
                          : articles.length === 0 && isTrashView
                          ? "Tidak ada artikel yang dihapus."
                          : "Tidak ada artikel yang cocok dengan filter saat ini."}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {nextArticlePage && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={handleLoadMoreArticles} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoadingMore ? "Loading..." : "Load More Articles"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
