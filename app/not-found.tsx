import Link from "next/link"

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="absolute inset-0 bg-radial-glow opacity-40" />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          Halaman tidak ditemukan
        </p>
        <h1 className="text-7xl font-black tracking-tight text-gradient md:text-8xl">404</h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 hover:shadow-glow-primary"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
