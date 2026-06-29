import Link from "next/link"
import Image from "next/image"
import logoHima from "@/assets/hima.png"
import logoKabinet from "@/assets/logoKabinet.png"
import { Clock, Instagram, Mail, MapPin, Music2, Youtube, Linkedin } from "lucide-react"
import { cn } from "@/lib/utils"
import { officialSocialLinks } from "@/lib/social-links"
import type { getPublicSiteSettings } from "@/lib/public-site-settings"

const organizationLinks = [
  { href: "/kabinet#visi-misi", label: "Visi & Misi" },
  { href: "/kabinet#struktur", label: "Struktur Organisasi" },
  { href: "/kabinet", label: "Kabinet" },
  { href: "/kabinet#divisi", label: "Divisi" },
]

function LogoBadge({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: typeof logoHima
  alt: string
  className?: string
  imageClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_22px_rgba(0,0,0,0.24)] ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={44}
        height={44}
        className={cn("h-[82%] w-[82%] object-contain", imageClassName)}
      />
    </div>
  )
}

type PublicSettings = Awaited<ReturnType<typeof getPublicSiteSettings>>

export function Footer({ settings }: { settings: PublicSettings }) {
  const { socialMedia, contactInfo, footerSettings } = settings
  const quickLinks = settings.quickLinks.filter((link) => link.enabled)
  const socialLinks = [
    { href: socialMedia.instagram, label: officialSocialLinks.instagram.label, icon: Instagram },
    { href: socialMedia.youtube, label: officialSocialLinks.youtube.label, icon: Youtube },
    { href: socialMedia.linkedin, label: officialSocialLinks.linkedin.label, icon: Linkedin },
    { href: socialMedia.tiktok, label: officialSocialLinks.tiktok.label, icon: Music2 },
  ]

  return (
    <footer className="border-t border-border/50 bg-[#1a1a1a]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 lg:pb-12 lg:pt-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.7fr_0.9fr_0.9fr_1.25fr] lg:gap-5">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="group flex items-start gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <LogoBadge src={logoHima} alt="Logo HIMA D3 SI UPNVJ" className="h-10 w-10 bg-yellow-300" />
                <LogoBadge
                  src={logoKabinet}
                  alt="Logo Kabinet Vidyakatra"
                  className="h-10 w-10"
                  imageClassName="h-[90%] w-[90%] -translate-x-[2px] -translate-y-[1px]"
                />
              </div>
              <div className="flex min-w-0 max-w-[18rem] flex-col pt-0.5">
                <span className="text-sm font-bold leading-snug tracking-wide text-white/90 sm:text-base">HIMA D3 Sistem Informasi UPNVJ</span>
                <span className="text-xs text-primary">Kabinet Vidyakatra</span>
              </div>
            </Link>
            {/* <p className="max-w-[19rem] text-sm leading-relaxed text-[#b8b8b8] text-justify">
              Himpunan Mahasiswa D3 Sistem Informasi UPN Veteran Jakarta merupakan wadah pengembangan potensi, kreativitas, kepemimpinan, serta kemampuan komunikasi dan kolaborasi mahasiswa.
            </p> */}
            {footerSettings.showSocialMedia && <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#b8b8b8] transition-all duration-200 hover:scale-105 hover:border-primary/60 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_18px_rgba(245,184,0,0.22)]"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>}
          </div>

          {/* Quick Links */}
          {footerSettings.showQuickLinks && <div className="space-y-4">
            <h3 className="font-semibold text-white/90">Navigasi</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.url}
                    className="text-sm text-[#b8b8b8] transition-colors duration-300 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>}

          {/* Organization */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white/90">Organisasi</h3>
            <ul className="space-y-2">
              {organizationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#b8b8b8] transition-colors duration-300 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          {footerSettings.showContactInfo && <div className="space-y-4">
            <h3 className="font-semibold text-white/90">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#b8b8b8]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="whitespace-pre-line">{contactInfo.address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#b8b8b8]">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${contactInfo.email}`} className="transition-colors duration-300 hover:text-primary">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#b8b8b8]">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>{contactInfo.officeHours}</span>
              </li>
            </ul>
          </div>}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col gap-2 border-t border-border/50 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#b8b8b8]">
            {footerSettings.copyrightText}
          </p>
        </div>
      </div>
    </footer>
  )
}
