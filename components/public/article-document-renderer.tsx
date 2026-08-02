import type { ArticleDocument } from "@/lib/article-content"

type ArticleDocumentRendererProps = {
  document: ArticleDocument
}

export function ArticleDocumentRenderer({ document }: ArticleDocumentRendererProps) {
  return (
    <div className="space-y-6">
      {document.content.map((block) => {
        if (block.type === "heading" && block.level === 1) {
          return (
            <h2 key={block.id} className="pt-5 text-center text-2xl font-bold leading-tight text-gradient md:text-3xl">
              {block.text}
            </h2>
          )
        }

        if (block.type === "heading") {
          return (
            <h3 key={block.id} className="pt-4 text-center text-xl font-semibold leading-snug text-gradient md:text-2xl">
              {block.text}
            </h3>
          )
        }

        if (block.type === "quote") {
          return (
            <blockquote key={block.id} className="relative rounded-[1.25rem] border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent py-5 pl-6 pr-5 text-lg font-medium leading-8 text-foreground/85 italic shadow-soft">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[1.25rem] bg-gradient-to-b from-primary via-primary/60 to-transparent" />
              {block.text}
            </blockquote>
          )
        }

        if (block.type === "list") {
          return (
            <ul key={block.id} className="list-disc space-y-2 pl-6 text-foreground/85 marker:text-primary">
              <li>{block.text}</li>
            </ul>
          )
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="mx-auto max-w-2xl py-4">
              {block.url ? (
                <img src={block.url} alt={block.alt} loading="lazy" decoding="async" className="mx-auto w-full rounded-[1.25rem] border border-border/50 bg-muted/20 shadow-soft" />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Image URL kosong
                </div>
              )}
              {block.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{block.caption}</figcaption>}
            </figure>
          )
        }

        return <p key={block.id} className="text-justify text-[1.02rem] leading-8 text-foreground/75 md:text-lg md:leading-9">{block.text}</p>
      })}
    </div>
  )
}
