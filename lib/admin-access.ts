import { hasPermission, type Permission, type UserRole } from "@/lib/permissions"

export type AdminNavItem = {
  name: string
  href: string
  permissions?: Permission[]
}

export type AdminQuickAction = AdminNavItem & {
  title: string
  description: string
}

export const adminNavigation: AdminNavItem[] = [
  { name: "Dashboard", href: "/x-panel" },
  { name: "Home Page", href: "/x-panel/home", permissions: ["settings.manage"] },
  { name: "Organization", href: "/x-panel/organization", permissions: ["member.manage", "org_unit.manage"] },
  { name: "Kabinet", href: "/x-panel/cabinets", permissions: ["settings.manage"] },
  { name: "Berita Acara", href: "/x-panel/news", permissions: ["article.create", "article.read_all", "article.edit_own"] },
  { name: "Settings", href: "/x-panel/settings", permissions: ["settings.manage"] },
  { name: "Auth Health", href: "/x-panel/auth-health", permissions: ["settings.manage"] },
]

export const adminQuickActions: AdminQuickAction[] = [
  {
    name: "Tambah Pengurus",
    title: "Tambah Pengurus",
    description: "Tambahkan pengurus kabinet Vidyakatra",
    href: "/x-panel/organization?action=add",
    permissions: ["member.manage", "org_unit.manage"],
  },
  {
    name: "Buat Berita Acara",
    title: "Buat Berita Acara",
    description: "Tulis draft berita acara untuk workflow approval",
    href: "/x-panel/news?action=create",
    permissions: ["article.create"],
  },
  {
    name: "Atur Social Overview",
    title: "Atur Social Overview",
    description: "Perbarui kanal dan insight sosial media",
    href: "/x-panel/settings?tab=social",
    permissions: ["settings.manage"],
  },
]

export function canAccessAdminItem(role: UserRole | null | undefined, item: AdminNavItem) {
  if (!item.permissions?.length) return true
  if (!role) return false

  return item.permissions.some((permission) => hasPermission(role, permission))
}

export function getAccessibleAdminNavigation(role: UserRole | null | undefined) {
  return adminNavigation.filter((item) => canAccessAdminItem(role, item))
}

export function getAccessibleQuickActions(role: UserRole | null | undefined) {
  return adminQuickActions.filter((item) => canAccessAdminItem(role, item))
}

export function canAccessAdminPath(role: UserRole | null | undefined, pathname: string) {
  if (pathname === "/x-panel/login") return true

  const route = [...adminNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || (item.href !== "/x-panel" && pathname.startsWith(item.href)))

  return route ? canAccessAdminItem(role, route) : true
}
