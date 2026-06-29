"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ChevronDown,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  Music2,
  X,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { publicEmailComposeHref } from "@/lib/contact-links";
import { officialSocialLinks } from "@/lib/social-links";
import type { PublicSocialMedia } from "@/lib/public-site-settings";
import logoHima from "@/assets/hima.png";
import logoKabinet from "@/assets/logoKabinet.png";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/kabinet", label: "Kabinet" },
  { href: "/berita", label: "Berita Acara" },
];

function getLinkTarget(href: string) {
  return href.startsWith("/") ? undefined : "_blank";
}

function getLinkRel(href: string) {
  return href.startsWith("/") ? undefined : "noopener noreferrer";
}

function LogoBadge({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: typeof logoHima;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.22)] ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={40}
        height={40}
        className={cn("h-[82%] w-[82%] object-contain", imageClassName)}
      />
    </div>
  );
}

export function Navbar({ socialMedia }: { socialMedia: PublicSocialMedia }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollaborateOpen, setIsCollaborateOpen] = useState(false);
  const collaborateLinks = [
    { href: socialMedia.instagram, label: officialSocialLinks.instagram.label, icon: Instagram },
    { href: socialMedia.youtube, label: officialSocialLinks.youtube.label, icon: Youtube },
    { href: socialMedia.linkedin, label: officialSocialLinks.linkedin.label, icon: Linkedin },
    { href: socialMedia.tiktok, label: officialSocialLinks.tiktok.label, icon: Music2 },
    { href: publicEmailComposeHref, label: "Email", icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="group flex min-w-0 items-center gap-2">
          <LogoBadge
            src={logoHima}
            alt="Logo Himpunan Mahasiswa D3 Sistem Informasi UPNVJ"
            className="h-9 w-9 bg-yellow-300"
          />
          <LogoBadge
            src={logoKabinet}
            alt="Logo Kabinet Vidyakatra"
            className="h-9 w-9"
            imageClassName="h-[90%] w-[90%] -translate-x-[2px] -translate-y-[1px]"
          />
          <div className="hidden min-w-0 flex-col lg:flex lg:max-w-[250px] xl:max-w-[420px]">
            <span className="whitespace-nowrap text-sm font-bold leading-tight tracking-wide">
              <span className="xl:hidden">HIMA D3 Sistem Informasi UPNVJ</span>
              <span className="hidden xl:inline">
                Himpunan Mahasiswa D3 Sistem Informasi UPNVJ
              </span>
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-primary">
              Kabinet Vidyakatra
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden min-w-0 items-center justify-end gap-0.5 rounded-full border border-border bg-muted/60 px-1.5 py-1 shadow-sm backdrop-blur-xl md:flex lg:gap-1 lg:px-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsCollaborateOpen(false)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors duration-200 ease-out lg:px-3 xl:px-4",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCollaborateOpen((open) => !open)}
              className="group relative inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground lg:px-3 xl:px-4"
              aria-expanded={isCollaborateOpen}
            >
              Collaborate
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  isCollaborateOpen && "rotate-180",
                )}
              />
            </button>
            {isCollaborateOpen && (
              <div className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-xl border border-border/50 bg-background p-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
                {collaborateLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={getLinkTarget(link.href)}
                    rel={getLinkRel(link.href)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-primary"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="shrink-0 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-border bg-background p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigasi publik</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <Link
                    href="/"
                    className="flex min-w-0 items-center gap-3"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex shrink-0 items-center gap-2">
                      <LogoBadge
                        src={logoHima}
                        alt="Logo Himpunan Mahasiswa D3 Sistem Informasi UPNVJ"
                        className="h-9 w-9 bg-yellow-300"
                      />
                      <LogoBadge
                        src={logoKabinet}
                        alt="Logo Kabinet Vidyakatra"
                        className="h-9 w-9"
                        imageClassName="h-[90%] w-[90%] -translate-x-[2px] -translate-y-[1px]"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold tracking-wide">
                        HIMA D3 SI UPNVJ
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Kabinet Vidyakatra
                      </span>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-1 flex-col gap-1 p-4">
                  {navItems.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                        >
                          {item.label}
                        </Link>
                    );
                  })}
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      Collaborate
                    </p>
                    <div className="mt-2 grid gap-1">
                      {collaborateLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target={getLinkTarget(link.href)}
                          rel={getLinkRel(link.href)}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-1 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                        >
                          <link.icon className="h-4 w-4 text-primary" />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
