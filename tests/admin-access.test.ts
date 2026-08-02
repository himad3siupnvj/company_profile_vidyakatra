import { describe, expect, it } from "vitest"
import {
  canAccessAdminPath,
  getAccessibleAdminNavigation,
  getAccessibleQuickActions,
} from "@/lib/admin-access"

describe("admin access helpers", () => {
  it("filters navigation by role permissions", () => {
    const staffNav = getAccessibleAdminNavigation("staff").map((item) => item.name)

    expect(staffNav).toContain("Dashboard")
    expect(staffNav).toContain("Berita Acara")
    expect(getAccessibleAdminNavigation("administrator").map((item) => item.name)).toContain("Kabinet")
    expect(staffNav).not.toContain("Settings")
    expect(staffNav).not.toContain("User Management")
  })

  it("filters quick actions by role permissions", () => {
    const staffActions = getAccessibleQuickActions("staff").map((item) => item.title)
    const adminActions = getAccessibleQuickActions("administrator").map((item) => item.title)

    expect(staffActions).toEqual(["Buat Berita Acara"])
    expect(adminActions).toContain("Tambah Pengurus")
    expect(adminActions).toContain("Atur Social Overview")
  })

  it("guards admin routes by required permissions", () => {
    expect(canAccessAdminPath("staff", "/x-panel/news")).toBe(true)
    expect(canAccessAdminPath("administrator", "/x-panel/cabinets")).toBe(true)
    expect(canAccessAdminPath("staff", "/x-panel/cabinets")).toBe(false)
    expect(canAccessAdminPath("staff", "/x-panel/settings")).toBe(false)
    expect(canAccessAdminPath("administrator", "/x-panel/settings")).toBe(true)
  })
})
