"use client"

import Link from "next/link"

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="absolute inset-0 bg-radial-glow opacity-40" />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Terjadi kesalahan
        </p>
        <h1 className="text-4xl font-black tracking-tight text-gradient md:text-5xl">Ups...</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Ada yang tidak beres saat memuat halaman ini. Silakan coba lagi.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-glow-primary"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
