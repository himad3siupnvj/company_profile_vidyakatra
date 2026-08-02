export type ArticleBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 1 | 2; text: string }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "list"; text: string }
  | { id: string; type: "image"; url: string; alt: string; caption: string }

export type ArticleDocument = {
  type: "doc"
  content: ArticleBlock[]
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function createFallbackArticleDocument(text: string): ArticleDocument {
  return {
    type: "doc",
    content: [
      {
        id: "fallback-paragraph",
        type: "paragraph",
        text,
      },
    ],
  }
}

export function createEmptyArticleDocument(): ArticleDocument {
  return {
    type: "doc",
    content: [
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        text: "",
      },
    ],
  }
}

export function isArticleDocument(value: unknown): value is ArticleDocument {
  if (!value || typeof value !== "object") return false

  const candidate = value as { type?: unknown; content?: unknown }

  return (
    candidate.type === "doc" &&
    Array.isArray(candidate.content) &&
    candidate.content.every((block) => {
      if (!block || typeof block !== "object") return false

      const item = block as Record<string, unknown>

      if (typeof item.id !== "string" || !item.id.trim() || typeof item.type !== "string") {
        return false
      }

      if (item.type === "image") {
        return (
          typeof item.url === "string" &&
          typeof item.alt === "string" &&
          typeof item.caption === "string"
        )
      }

      if (item.type === "heading") {
        return (item.level === 1 || item.level === 2) && typeof item.text === "string"
      }

      return (
        (item.type === "paragraph" || item.type === "quote" || item.type === "list") &&
        typeof item.text === "string"
      )
    })
  )
}

export function normalizeArticleDocument(value: unknown, fallbackText = ""): ArticleDocument {
  if (isArticleDocument(value)) {
    return value
  }

  return createFallbackArticleDocument(fallbackText)
}

export function getArticlePlainText(document: ArticleDocument) {
  return document.content
    .map((block) => {
      if (block.type === "image") {
        return `${block.alt} ${block.caption}`
      }

      return block.text
    })
    .join(" ")
    .trim()
}

export function getArticleReadTime(document: ArticleDocument, wordsPerMinute = 180) {
  const words = getArticlePlainText(document)
    .split(/\s+/)
    .filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute))

  return `${minutes} min`
}

export function hasArticleTextContent(content: unknown) {
  const document = normalizeArticleDocument(content)

  return document.content.some((block) => {
    if (block.type === "image") return Boolean(block.url || block.alt || block.caption)

    return Boolean(block.text.trim())
  })
}
