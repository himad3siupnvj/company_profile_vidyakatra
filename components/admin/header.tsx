"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, Menu, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AdminSidebarMobile } from "./sidebar-mobile"
import { useAdminUser } from "@/components/admin/admin-user-context"
import { getFirstNameInitial } from "@/lib/name-initials"

interface AdminHeaderProps {
  sidebarCollapsed?: boolean
}

export function AdminHeader({ sidebarCollapsed: _sidebarCollapsed }: AdminHeaderProps) {
  const router = useRouter()
  const { currentUser } = useAdminUser()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/x-panel/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-2 border-b bg-background px-3 sm:px-4 md:px-6">
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 max-w-[85vw] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigasi admin</SheetTitle>
          </SheetHeader>
          <AdminSidebarMobile />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <Button asChild variant="outline" size="sm" className="hidden gap-2 md:inline-flex">
          <Link href="/" target="_blank">
            <ExternalLink className="h-4 w-4" />
            Lihat Situs
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex min-w-0 items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getFirstNameInitial(currentUser?.name ?? "Admin")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">{currentUser?.name ?? "Admin"}</span>
                <span className="text-xs text-muted-foreground">{currentUser?.email ?? "Memuat akun..."}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/x-panel/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
