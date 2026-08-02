"use client"

import { useMemo, useState, type DragEvent } from "react"
import { Eye, GripVertical, Heading1, Heading2, ImagePlus, List, Loader2, Pilcrow, Plus, Quote, Trash2, Type, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ArticleBlock, ArticleDocument } from "@/lib/article-content"
import { createEmptyArticleDocument } from "@/lib/article-content"
import { optimizeImageForUpload, type ImageProcessingStage } from "@/lib/client-image-processing"
import { cn } from "@/lib/utils"

export type { ArticleBlock, ArticleDocument }

const commands = [
  { type: "paragraph", label: "Text", description: "Paragraf biasa", icon: Pilcrow },
  { type: "heading-1", label: "Heading 1", description: "Judul section besar", icon: Heading1 },
  { type: "heading-2", label: "Heading 2", description: "Subjudul", icon: Heading2 },
  { type: "quote", label: "Quote", description: "Kutipan atau highlight", icon: Quote },
  { type: "list", label: "List", description: "Bullet point", icon: List },
  { type: "image", label: "Image", description: "Gambar di tengah artikel", icon: ImagePlus },
]

function createBlock(type: string): ArticleBlock {
  const id = crypto.randomUUID()

  if (type === "heading-1") return { id, type: "heading", level: 1, text: "" }
  if (type === "heading-2") return { id, type: "heading", level: 2, text: "" }
  if (type === "quote") return { id, type: "quote", text: "" }
  if (type === "list") return { id, type: "list", text: "" }
  if (type === "image") return { id, type: "image", url: "", alt: "", caption: "" }

  return { id, type: "paragraph", text: "" }
}

type NotionArticleEditorProps = {
  value: ArticleDocument
  onChange: (value: ArticleDocument) => void
  previewTitle?: string
  previewCategory?: string
  previewMeta?: string
  uploadCategory?: string
  uploadKind?: string
}

export function NotionArticleEditor({
  value,
  onChange,
  previewTitle = "Judul artikel",
  previewCategory = "Berita Acara",
  previewMeta,
  uploadCategory = "general",
  uploadKind = "content",
}: NotionArticleEditorProps) {
  const [slashBlockId, setSlashBlockId] = useState<string | null>(null)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null)
  const [uploadStage, setUploadStage] = useState<ImageProcessingStage>("idle")
  const [uploadError, setUploadError] = useState("")
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: "before" | "after" } | null>(null)

  const blocks = value.content.length ? value.content : createEmptyArticleDocument().content

  const updateBlocks = (nextBlocks: ArticleBlock[]) => {
    onChange({ type: "doc", content: nextBlocks })
  }

  const updateBlock = (id: string, patch: Partial<ArticleBlock>) => {
    updateBlocks(blocks.map((block) => (block.id === id ? ({ ...block, ...patch } as ArticleBlock) : block)))
  }

  const addBlockAfter = (id: string, type = "paragraph") => {
    const index = blocks.findIndex((block) => block.id === id)
    const nextBlocks = [...blocks]
    nextBlocks.splice(index + 1, 0, createBlock(type))
    updateBlocks(nextBlocks)
  }

  const addBlock = (type = "paragraph") => {
    updateBlocks([...blocks, createBlock(type)])
  }

  const replaceBlock = (id: string, type: string) => {
    updateBlocks(blocks.map((block) => (block.id === id ? createBlock(type) : block)))
    setSlashBlockId(null)
  }

  const removeBlock = (id: string) => {
    const nextBlocks = blocks.filter((block) => block.id !== id)
    updateBlocks(nextBlocks.length ? nextBlocks : createEmptyArticleDocument().content)
  }

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, blockId: string) => {
    setDraggedBlockId(blockId)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", blockId)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, blockId: string) => {
    if (!draggedBlockId || draggedBlockId === blockId) return

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after"
    setDropTarget({ id: blockId, position })
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault()
    const sourceId = draggedBlockId || event.dataTransfer.getData("text/plain")
    if (!sourceId || sourceId === targetId) return

    const sourceIndex = blocks.findIndex((block) => block.id === sourceId)
    const targetIndex = blocks.findIndex((block) => block.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return

    const nextBlocks = [...blocks]
    const [movedBlock] = nextBlocks.splice(sourceIndex, 1)
    const adjustedTargetIndex = nextBlocks.findIndex((block) => block.id === targetId)
    const insertionIndex = adjustedTargetIndex + (dropTarget?.position === "after" ? 1 : 0)
    nextBlocks.splice(insertionIndex, 0, movedBlock)
    updateBlocks(nextBlocks)
    setDraggedBlockId(null)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDraggedBlockId(null)
    setDropTarget(null)
  }

  const getSlashQuery = (block: ArticleBlock) => {
    if (!("text" in block)) return ""

    const text = block.text.trim()

    return text.startsWith("/") ? text.slice(1).toLowerCase() : ""
  }

  const renderedPreview = useMemo(() => blocks.filter((block) => block.type !== "paragraph" || block.text.trim()), [blocks])

  const uploadImage = async (blockId: string, file: File | null) => {
    if (!file) return

    setUploadError("")
    setUploadingBlockId(blockId)
    setUploadStage("compressing")

    let uploadFile = file

    try {
      uploadFile = await optimizeImageForUpload(file, { maxWidth: 1600, maxHeight: 1200 })
    } catch {
      uploadFile = file
    }

    setUploadStage("uploading")

    const formData = new FormData()
    formData.append("file", uploadFile)
    formData.append("purpose", "article-image")
    formData.append("section", "articles")
    formData.append("category", uploadCategory)
    formData.append("kind", uploadKind)

    try {
      const response = await fetch("/api/admin/assets", {
        method: "POST",
        body: formData,
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setUploadError(data?.error ?? "Upload image gagal.")
        return
      }

      updateBlock(blockId, {
        url: data.asset.url,
        alt: data.asset.fileName,
      } as Partial<ArticleBlock>)
    } catch {
      setUploadError("Upload image gagal. Coba lagi sebentar.")
    } finally {
      setUploadingBlockId(null)
      setUploadStage("idle")
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Type className="h-4 w-4" />
          <span>Isi artikel</span>
        </div>
        <div className="flex rounded-md bg-muted p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setMode("edit")}
          >
            <Type className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>
        </div>
      </div>

      {mode === "edit" ? (
        <div className="min-h-[420px] px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2">
              {commands.map((command) => (
                <Button
                  key={command.type}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 px-2 text-xs"
                  onClick={() => addBlock(command.type)}
                >
                  <command.icon className="h-3.5 w-3.5" />
                  {command.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
          {blocks.map((block) => {
            const slashQuery = getSlashQuery(block)
            const filteredCommands = slashBlockId === block.id
              ? commands.filter((command) => {
                  const haystack = `${command.label} ${command.description}`.toLowerCase()

                  return haystack.includes(slashQuery)
                })
              : []

            return (
            <div
              key={block.id}
              className={cn(
                "group relative rounded-md border border-transparent px-10 py-1 transition-all hover:border-border hover:bg-muted/10",
                draggedBlockId === block.id && "opacity-40",
                dropTarget?.id === block.id && dropTarget.position === "before" && "border-t-primary",
                dropTarget?.id === block.id && dropTarget.position === "after" && "border-b-primary",
              )}
              onDragOver={(event) => handleDragOver(event, block.id)}
              onDrop={(event) => handleDrop(event, block.id)}
            >
              <div className="absolute left-1 top-2 hidden items-center gap-1 md:group-hover:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 cursor-grab text-muted-foreground active:cursor-grabbing"
                  draggable
                  onDragStart={(event) => handleDragStart(event, block.id)}
                  onDragEnd={handleDragEnd}
                  aria-label="Drag to reorder block"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => addBlockAfter(block.id)}
                  aria-label="Add block"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-2 hidden h-7 w-7 text-muted-foreground md:group-hover:flex"
                onClick={() => removeBlock(block.id)}
                aria-label="Remove block"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {block.type === "image" ? (
                <div className="my-4 space-y-2 rounded-lg border border-dashed bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Blok gambar</p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={() => addBlockAfter(block.id)}
                      >
                        <Plus className="h-4 w-4" />
                        Add below
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-destructive hover:text-destructive"
                        onClick={() => removeBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-md border bg-background/50 p-3 sm:grid-cols-[180px_1fr]">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/40">
                      {block.url ? (
                        <img src={block.url} alt={block.alt || block.caption || "Article image preview"} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <div className="px-4 text-center text-xs text-muted-foreground">
                          <ImagePlus className="mx-auto mb-2 h-6 w-6" />
                          Preview image
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Unggah gambar</p>
                        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, atau GIF. Maks 1 MB.</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="relative w-full gap-2 sm:w-fit" disabled={uploadingBlockId === block.id}>
                        {uploadingBlockId === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingBlockId === block.id && uploadStage === "compressing" ? "Compressing..." : uploadingBlockId === block.id && uploadStage === "uploading" ? "Uploading..." : block.url ? "Replace image" : "Upload image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          disabled={uploadingBlockId === block.id}
                          onChange={(event) => uploadImage(block.id, event.target.files?.[0] ?? null)}
                        />
                      </Button>
                    </div>
                  </div>
                  {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                  <Input
                    value={block.url}
                    onChange={(event) => updateBlock(block.id, { url: event.target.value })}
                    placeholder="Paste image URL dari storage..."
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={block.alt}
                      onChange={(event) => updateBlock(block.id, { alt: event.target.value })}
                      placeholder="Alt text"
                    />
                    <Input
                      value={block.caption}
                      onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                      placeholder="Caption"
                    />
                  </div>
                </div>
              ) : (
                <Textarea
                  value={block.text}
                  onChange={(event) => {
                    updateBlock(block.id, { text: event.target.value } as Partial<ArticleBlock>)
                    setSlashBlockId(event.target.value.trim().startsWith("/") ? block.id : null)
                  }}
                  placeholder={blocks.length === 1 && !block.text ? "Ketik / untuk command..." : ""}
                  rows={block.type === "heading" ? 1 : 2}
                  className={cn(
                    "min-h-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-1 shadow-none focus-visible:ring-0",
                    block.type === "paragraph" && "text-base leading-7",
                    block.type === "heading" && block.level === 1 && "text-3xl font-bold leading-tight",
                    block.type === "heading" && block.level === 2 && "text-2xl font-semibold leading-tight",
                    block.type === "quote" && "border-l-2 border-primary pl-3 italic",
                    block.type === "list" && "pl-5",
                  )}
                />
              )}

              <div className="mt-1 flex items-center gap-1 md:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => addBlockAfter(block.id)}
                  aria-label="Add block"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => removeBlock(block.id)}
                  aria-label="Remove block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {slashBlockId === block.id && (
                <div className="mt-2 w-full max-w-sm rounded-lg border bg-popover p-1 shadow-xl">
                  {filteredCommands.length ? filteredCommands.map((command) => (
                    <button
                      key={command.type}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => replaceBlock(block.id, command.type)}
                    >
                      <command.icon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="block font-medium">{command.label}</span>
                        <span className="text-xs text-muted-foreground">{command.description}</span>
                      </span>
                    </button>
                  )) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Command tidak ditemukan.</div>
                  )}
                </div>
              )}
            </div>
            )
          })}
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => addBlock("paragraph")}>
                <Plus className="h-4 w-4" />
                Add text
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => addBlock("image")}>
                <ImagePlus className="h-4 w-4" />
                Add image
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[420px] bg-white px-4 py-6 text-slate-950 sm:px-8">
          <article className="mx-auto max-w-3xl border-t-4 border-[#ff2d78] px-2 py-8 sm:px-8">
            <header className="mb-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff2d78]">
                {previewCategory}
              </p>
              <h1 className="mx-auto mt-3 max-w-2xl text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
                {previewTitle || "Judul artikel"}
              </h1>
              {previewMeta && (
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {previewMeta}
                </p>
              )}
            </header>
            <div className="space-y-5 text-sm leading-7 text-slate-700 sm:text-[15px] sm:leading-8">
          {renderedPreview.length ? (
            renderedPreview.map((block) => {
              if (block.type === "heading" && block.level === 1) return <h2 key={block.id} className="pt-3 text-xl font-bold text-slate-950">{block.text}</h2>
              if (block.type === "heading") return <h3 key={block.id} className="pt-2 text-lg font-bold text-slate-950">{block.text}</h3>
              if (block.type === "quote") return <blockquote key={block.id} className="border-l-4 border-[#ff2d78] pl-4 font-medium italic text-slate-600">{block.text}</blockquote>
              if (block.type === "list") return <ul key={block.id} className="list-disc pl-5"><li>{block.text}</li></ul>
              if (block.type === "image") {
                return (
                  <figure key={block.id} className="py-2">
                    {block.url ? <img src={block.url} alt={block.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" /> : <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Image URL kosong</div>}
                    {block.caption && <figcaption className="mt-2 text-xs text-slate-500">{block.caption}</figcaption>}
                  </figure>
                )
              }

              return <p key={block.id} className="text-justify">{block.text}</p>
            })
          ) : (
            <p className="text-slate-500">Preview artikel akan muncul di sini.</p>
          )}
            </div>
          </article>
        </div>
      )}
    </div>
  )
}
