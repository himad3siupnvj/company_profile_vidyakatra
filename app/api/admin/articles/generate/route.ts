import { createRequire } from "node:module"
import { eq } from "drizzle-orm"
import mammoth from "mammoth"
import type { PdfPage } from "pdf-parse"
import sharp from "sharp"
import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/db"
import { articleCategories, articles, assets } from "@/db/schema"
import { requireApiPermission } from "@/lib/api-guard"
import { getActivePeriodId } from "@/lib/active-period"
import { getArticleReadTime, slugify, toTitleCase, type ArticleBlock } from "@/lib/article-content"
import { generateArticleDraftFromText } from "@/lib/article-generator"
import { revalidatePublicArticles } from "@/lib/public-cache"
import { createStoragePath, uploadFileToStorage, validateUploadFile } from "@/lib/storage"

export const runtime = "nodejs"

type SupportedSourceType = "pdf" | "docx"
type ExtractedImage = {
  buffer: Buffer
  mimeType: string
  extension: string
  alt: string
  page?: number
  positionRatio?: number
}
type ArticleImageBlock = Extract<ArticleBlock, { type: "image" }>

const pdfPaintImageXObject = 85
const pdfPaintInlineImageXObject = 86
const pdfPaintJpegXObject = 82
const maxExtractedImages = 12
const minimumImageArea = 40_000
const imageMaxBytes = 1 * 1024 * 1024
const pdfImageBlobs = new Map<string, Blob>()
let isPdfBlobCaptureInstalled = false

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}

function ensureLegacyPdfDom() {
  if (!isPdfBlobCaptureInstalled) {
    const createObjectURL = URL.createObjectURL.bind(URL)
    const revokeObjectURL = URL.revokeObjectURL.bind(URL)

    URL.createObjectURL = (blob) => {
      const url = createObjectURL(blob)
      if (blob instanceof Blob) {
        pdfImageBlobs.set(url, blob)
      }
      return url
    }
    URL.revokeObjectURL = (url) => {
      pdfImageBlobs.delete(url)
      revokeObjectURL(url)
    }
    isPdfBlobCaptureInstalled = true
  }

  if (!(globalThis as any).Image?.prototype?.kind) {
    ;(globalThis as any).Image = class ServerPdfImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      width = 0
      height = 0
      kind = 3
      data = new Uint8Array()
      sourceBuffer: Buffer | null = null
      ready: Promise<void> = Promise.resolve()

      set src(value: string) {
        const loadSource = async () => {
          const encoded = value.match(/^data:[^;]+;base64,(.+)$/)?.[1]
          if (encoded) return Buffer.from(encoded, "base64")

          if (value.startsWith("blob:")) {
            const blob = pdfImageBlobs.get(value)
            if (!blob) throw new Error("PDF image blob could not be read")

            return Buffer.from(await blob.arrayBuffer())
          }

          throw new Error("Unsupported PDF image source")
        }

        this.ready = loadSource()
          .then((source) => {
            this.sourceBuffer = source
          })
          .catch(() => {
            this.sourceBuffer = null
          })
        queueMicrotask(() => this.onload?.())
      }
    }
  }
}

async function loadPdfParse() {
  ensureLegacyPdfDom()
  const require = createRequire(import.meta.url)

  return require("pdf-parse") as typeof import("pdf-parse").default
}

async function optimizeExtractedImage(input: Buffer) {
  let output = await withTimeout(
    sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    5_000,
    "Image optimization timed out",
  )

  if (output.length > imageMaxBytes) {
    output = await withTimeout(
      sharp(input)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 68 })
        .toBuffer(),
      5_000,
      "Image optimization timed out",
    )
  }

  return output.length <= imageMaxBytes ? output : null
}

function getSupportedSourceType(file: File): SupportedSourceType | null {
  const name = file.name.toLowerCase()

  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf"

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx"
  }

  return null
}

function getPdfObject(
  store: {
    objs?: Record<string, { data?: unknown; resolved?: boolean }>
    get(id: string, callback?: (value: unknown) => void): unknown
  },
  id: string,
) {
  const resolved = store.objs?.[id]
  if (resolved?.resolved) return Promise.resolve(resolved.data ?? null)

  return new Promise<unknown>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`PDF image ${id} timed out`)), 3_000)
    const done = (value: unknown) => {
      clearTimeout(timeout)
      resolve(value)
    }

    try {
      const direct = store.get(id)
      if (direct) {
        done(direct)
        return
      }

      store.get(id, done)
    } catch {
      try {
        store.get(id, done)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    }
  })
}

async function encodePdfImage(value: unknown, page: number): Promise<ExtractedImage | null> {
  if (!value || typeof value !== "object") return null

  const image = value as {
    width?: number
    height?: number
    kind?: number
    data?: Uint8Array | Uint8ClampedArray
    sourceBuffer?: Buffer | null
    ready?: Promise<void>
  }
  if (image.ready) {
    await Promise.race([
      image.ready.catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
    ])
  }

  if (image.sourceBuffer) {
    const metadata = await sharp(image.sourceBuffer).metadata().catch(() => null)
    if (!metadata?.width || !metadata.height || metadata.width * metadata.height < minimumImageArea) return null

    const buffer = await optimizeExtractedImage(image.sourceBuffer)
    if (!buffer) return null

    return {
      buffer,
      mimeType: "image/webp",
      extension: "webp",
      alt: `Gambar dari halaman ${page}`,
      page,
    }
  }

  const width = Number(image.width ?? 0)
  const height = Number(image.height ?? 0)
  const data = image.data

  if (!data || width <= 0 || height <= 0 || width * height < minimumImageArea) return null

  const channels = image.kind === 1 ? 1 : image.kind === 2 ? 3 : 4
  const expectedLength = width * height * channels
  if (data.length < expectedLength) return null

  const buffer = await optimizeExtractedImage(
    await sharp(Buffer.from(data.buffer, data.byteOffset, expectedLength), {
      raw: { width, height, channels },
    })
      .png()
      .toBuffer(),
  )
  if (!buffer) return null

  return {
    buffer,
    mimeType: "image/webp",
    extension: "webp",
    alt: `Gambar dari halaman ${page}`,
    page,
  }
}

async function extractPdfSource(buffer: Buffer) {
  const images: ExtractedImage[] = []
  let pageNumber = 0
  const pdfParse = await loadPdfParse()

  const parsed = await pdfParse(buffer, {
    pagerender: async (page: PdfPage) => {
      pageNumber += 1
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      })
      let lastY: number | undefined
      let text = ""

      for (const item of textContent.items) {
        const y = item.transform[5]
        text += lastY === undefined || lastY === y ? item.str : `\n${item.str}`
        lastY = y
      }

      if (images.length < maxExtractedImages) {
        const operators = await page.getOperatorList()

        for (let index = 0; index < operators.fnArray.length && images.length < maxExtractedImages; index += 1) {
          const operator = operators.fnArray[index]
          const args = operators.argsArray[index]
          let rawImage: unknown = null

          if (
            (operator === pdfPaintImageXObject || operator === pdfPaintJpegXObject) &&
            typeof args[0] === "string"
          ) {
            rawImage = await getPdfObject(page.objs, args[0]).catch(() => null)
          } else if (operator === pdfPaintInlineImageXObject) {
            rawImage = args[0]
          }

          const encoded = await encodePdfImage(rawImage, pageNumber).catch(() => null)
          if (encoded) images.push(encoded)
        }
      }

      return text
    },
  })

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const imagesOnPage = images.filter((candidate) => candidate.page === image.page)
    const pageImageIndex = imagesOnPage.indexOf(image)
    const pageProgress = (pageImageIndex + 1) / (imagesOnPage.length + 1)
    image.positionRatio = Math.min(
      1,
      Math.max(0, (((image.page ?? 1) - 1) + pageProgress) / Math.max(1, parsed.numpages)),
    )
  }

  return { text: parsed.text, images }
}

async function extractDocxSource(buffer: Buffer) {
  const images: ExtractedImage[] = []
  const result = await mammoth.extractRawText({ buffer })
  await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        if (images.length >= maxExtractedImages) return { src: "" }

        const imageBuffer = Buffer.from(await image.read("base64"), "base64")
        const metadata = await sharp(imageBuffer).metadata().catch(() => null)
        if (!metadata?.width || !metadata.height || metadata.width * metadata.height < minimumImageArea) {
          return { src: "" }
        }

        const optimized = await optimizeExtractedImage(imageBuffer).catch(() => null)
        if (!optimized) return { src: "" }
        images.push({
          buffer: optimized,
          mimeType: "image/webp",
          extension: "webp",
          alt: `Gambar dokumen ${images.length + 1}`,
          positionRatio: 0,
        })

        return { src: "" }
      }),
    },
  )

  images.forEach((image, index) => {
    image.positionRatio = (index + 1) / (images.length + 1)
  })

  return { text: result.value, images }
}

async function extractContentFromSource(file: File) {
  const sourceType = getSupportedSourceType(file)

  if (!sourceType) {
    if (file.name.toLowerCase().endsWith(".doc") || file.type === "application/msword") {
      throw new Error("Generator belum mendukung file DOC lama. Simpan ulang sebagai DOCX atau PDF dulu.")
    }

    throw new Error("Generator hanya mendukung PDF atau DOCX.")
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (sourceType === "docx") {
    return extractDocxSource(buffer)
  }

  return extractPdfSource(buffer)
}

async function uploadExtractedImages(images: ExtractedImage[], userId: string | null) {
  const uploadedImages: Array<{ block: ArticleImageBlock; positionRatio: number }> = []
  const db = getDb()

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const file = new File([new Uint8Array(image.buffer)], `document-image-${index + 1}.${image.extension}`, {
      type: image.mimeType,
    })
    const path = createStoragePath(file, "article-image", {
      section: "articles",
      category: "generated",
      kind: "content",
    })
    const url = await uploadFileToStorage(file, path)

    await db.insert(assets).values({
      url,
      fileName: file.name,
      mimeType: image.mimeType,
      sizeBytes: image.buffer.length,
      uploadedBy: userId,
      createdAt: new Date(),
    })

    uploadedImages.push({
      positionRatio: image.positionRatio ?? (index + 1) / (images.length + 1),
      block: {
        id: `generated-image-${index + 1}`,
        type: "image",
        url,
        alt: image.alt,
        caption: image.page ? `Dokumentasi halaman ${image.page}` : "",
      },
    })
  }

  return uploadedImages
}

function insertImagesBySourcePosition(
  contentBlocks: ArticleBlock[],
  uploadedImages: Array<{ block: ArticleImageBlock; positionRatio: number }>,
) {
  if (!uploadedImages.length) return contentBlocks

  const result = [...contentBlocks]
  const sortedImages = [...uploadedImages].sort((a, b) => a.positionRatio - b.positionRatio)
  let inserted = 0

  for (const image of sortedImages) {
    const sourceIndex = Math.round(image.positionRatio * contentBlocks.length)
    const insertionIndex = Math.min(result.length, Math.max(1, sourceIndex + inserted))
    result.splice(insertionIndex, 0, image.block)
    inserted += 1
  }

  return result
}

async function resolveCategoryId(category: string) {
  const slug = slugify(category || "berita")
  const name = toTitleCase(category || "Berita")
  const db = getDb()
  const [existing] = await db.select().from(articleCategories).where(eq(articleCategories.slug, slug)).limit(1)

  if (existing) return existing.id

  const now = new Date()
  const [created] = await db
    .insert(articleCategories)
    .values({ name, slug, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: articleCategories.slug, set: { name, updatedAt: now } })
    .returning()

  return created.id
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiPermission("article.create")
    if (guard.response) return guard.response

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Source berita acara wajib diupload." }, { status: 400 })
    }

    const supportedSourceType = getSupportedSourceType(file)

    if (!supportedSourceType) {
      const isLegacyDoc = file.type === "application/msword" || file.name.toLowerCase().endsWith(".doc")
      const message = isLegacyDoc
        ? "Generator belum mendukung file DOC lama. Simpan ulang sebagai DOCX atau PDF dulu."
        : "Generator hanya mendukung PDF atau DOCX."

      return NextResponse.json({ error: message }, { status: 400 })
    }

    const validation = await validateUploadFile(file, "article-source")

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const extracted = await extractContentFromSource(file)
    const draft = generateArticleDraftFromText(extracted.text)
    const uploadedImages = await uploadExtractedImages(extracted.images, guard.user?.id ?? null)
    draft.content.content = insertImagesBySourcePosition(draft.content.content, uploadedImages)
    const firstImage = uploadedImages[0]?.block

    if (!draft.title || !draft.content.content.length) {
      return NextResponse.json({ error: "Source tidak punya teks yang bisa diekstrak." }, { status: 400 })
    }

    const storagePath: string | null = null
    const sourceUrl: string | null = null
    const now = new Date()
    const db = getDb()
    const categoryId = await resolveCategoryId(draft.category)
    const activePeriodId = await getActivePeriodId()

    if (!activePeriodId) {
      return NextResponse.json({ error: "No active organization period is configured" }, { status: 409 })
    }

    const [created] = await db
      .insert(articles)
      .values({
        title: draft.title,
        slug: `${draft.slugBase}-${Date.now()}`,
        excerpt: draft.excerpt,
        content: draft.content,
        categoryId,
        status: "draft",
        authorId: guard.user?.id ?? null,
        authorName: draft.author,
        periodId: activePeriodId,
        readTime: getArticleReadTime(draft.content),
        thumbnailUrl: firstImage?.url ?? null,
        thumbnailAlt: firstImage?.alt ?? null,
        isFeatured: false,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    revalidatePublicArticles()

    return NextResponse.json({
      article: {
        id: created.id,
        slug: created.slug,
        title: created.title,
        excerpt: created.excerpt ?? "",
        content: draft.content,
        category: draft.category,
        categoryLabel: "Berita",
        status: created.status,
        author: created.authorName ?? "Tim Media",
        publishedAt: null,
        createdAt: created.createdAt.toISOString().slice(0, 10),
        thumbnail: created.thumbnailUrl ?? "/news/default.jpg",
        thumbnailAlt: created.thumbnailAlt ?? created.title,
        image: created.thumbnailUrl ?? "/news/default.jpg",
        readTime: created.readTime ?? getArticleReadTime(draft.content),
        featured: false,
        views: 0,
        sourceUrl,
        sourcePath: storagePath,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate draft gagal."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
