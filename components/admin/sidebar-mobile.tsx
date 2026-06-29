"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import logoHima from "@/assets/hima.png"
import logoKabinet from "@/assets/logoKabinet.png"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Home,
  Users,
  Target,
  Newspaper,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { getAccessibleAdminNavigation } from "@/lib/admin-access"
import { useAdminUser } from "@/components/admin/admin-user-context"

const navigationIcons = {
  Dashboard: LayoutDashboard,
  "Home Page": Home,
  Organization: Users,
  Kabinet: Target,
  "Berita Acara": Newspaper,
  Settings,
  "Auth Health": ShieldCheck,
} as const

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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.22)] ring-1 ring-white/30",
        className
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
  )
}

export function AdminSidebarMobile() {
  const pathname = usePathname()
  const { currentUser } = useAdminUser()
  const navigation = getAccessibleAdminNavigation(currentUser?.role)

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4 pr-11">
        <Link href="/x-panel" className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5">
            <LogoBadge src={logoHima} alt="Logo HIMA D3 SI UPNVJ" className="h-9 w-9 bg-yellow-300" />
            <LogoBadge
              src={logoKabinet}
              alt="Logo Kabinet Vidyakatra"
              className="h-9 w-9"
              imageClassName="h-[90%] w-[90%] -translate-x-[2px] -translate-y-[1px]"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-sidebar-foreground">HIMA D3 SI UPNVJ</span>
            <span className="truncate text-xs text-sidebar-primary">Kabinet Vidyakatra</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="min-w-0 flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const Icon = navigationIcons[item.name as keyof typeof navigationIcons] ?? LayoutDashboard
          const isActive = pathname === item.href || 
            (item.href !== "/x-panel" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
