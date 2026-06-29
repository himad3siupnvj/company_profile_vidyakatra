"use client"

import Image from "next/image"
import Link from "next/link"
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.22)] ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105",
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

type AdminSidebarProps = {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function AdminSidebar({ collapsed, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname()
  const { currentUser } = useAdminUser()
  const navigation = getAccessibleAdminNavigation(currentUser?.role)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link href="/x-panel" className="group flex items-center gap-2">
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
                <span className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">HIMA D3 SI UPNVJ</span>
                <span className="text-xs text-sidebar-primary">Kabinet Vidyakatra</span>
              </div>
            </Link>
          )}
          {collapsed && (
            <LogoBadge src={logoHima} alt="Logo HIMA D3 SI UPNVJ" className="mx-auto h-9 w-9 bg-yellow-300" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            const Icon = navigationIcons[item.name as keyof typeof navigationIcons] ?? LayoutDashboard
            const isActive = pathname === item.href || 
              (item.href !== "/x-panel" && pathname.startsWith(item.href))
            
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "border border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary shadow-[0_0_18px_rgba(245,184,0,0.15)]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="border-border bg-card text-card-foreground">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.name}>{linkContent}</div>
          })}
        </nav>

        {/* View Site Button */}
        <div className="border-t border-sidebar-border p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" target="_blank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-border bg-card text-card-foreground">
                View Site
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/" target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                View Site
              </Button>
            </Link>
          )}
        </div>

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(!collapsed)}
            className="w-full justify-center text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Ciutkan</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
