"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Edit,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { OrganizationChart } from "@/components/admin/organization-chart"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"
import { optimizeImageForUpload } from "@/lib/client-image-processing"

interface Member {
  id: string
  name: string
  position: string
  department: string
  avatar: string
}

interface OrganizationalUnit {
  id: string
  name: string
  type: "department" | "bureau"
  description: string
  imageUrl: string
  head: string
  memberCount: number
  color: string
  sortOrder: number
  workPrograms: WorkProgram[]
}

type WorkProgram = {
  name: string
  description: string
  status: "Rutin" | "Berjalan" | "Rencana"
}

interface CoreTeam {
  id: string
  slug: string
  name: string
  type: string
  description: string
  imageUrl: string
  workPrograms: WorkProgram[]
  sortOrder: number
}

interface UnitForm {
  name: string
  type: string
  description: string
  color: string
  customType: string
}

const emptyUnitForm: UnitForm = {
  name: "",
  type: "department",
  description: "",
  color: "bg-primary",
  customType: "",
}

const unitColors = [
  { value: "bg-primary", label: "Primary", swatch: "bg-primary" },
  { value: "bg-blue-500", label: "Blue", swatch: "bg-blue-500" },
  { value: "bg-emerald-500", label: "Emerald", swatch: "bg-emerald-500" },
  { value: "bg-amber-500", label: "Amber", swatch: "bg-amber-500" },
  { value: "bg-rose-500", label: "Rose", swatch: "bg-rose-500" },
  { value: "bg-violet-500", label: "Violet", swatch: "bg-violet-500" },
] as const

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function OrganizationManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [units, setUnits] = useState<OrganizationalUnit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [activeTab, setActiveTab] = useState("members")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isSavingMember, setIsSavingMember] = useState(false)
  const [isUploadingMemberImage, setIsUploadingMemberImage] = useState(false)
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null)
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnitForm)
  const [isSavingUnit, setIsSavingUnit] = useState(false)
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false)
  const [programUnit, setProgramUnit] = useState<OrganizationalUnit | null>(null)
  const [programsForm, setProgramsForm] = useState<WorkProgram[]>([])
  const [isSavingPrograms, setIsSavingPrograms] = useState(false)
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null)
  const [uploadingUnitId, setUploadingUnitId] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const [coreTeams, setCoreTeams] = useState<CoreTeam[]>([])
  const [isCoreTeamDialogOpen, setIsCoreTeamDialogOpen] = useState(false)
  const [editingCoreTeam, setEditingCoreTeam] = useState<CoreTeam | null>(null)
  const [coreTeamForm, setCoreTeamForm] = useState({ slug: "", name: "", type: "Pengurus Inti", description: "" })
  const [isSavingCoreTeam, setIsSavingCoreTeam] = useState(false)
  const [isCoreTeamProgramDialogOpen, setIsCoreTeamProgramDialogOpen] = useState(false)
  const [coreTeamProgramTarget, setCoreTeamProgramTarget] = useState<CoreTeam | null>(null)
  const [coreTeamProgramsForm, setCoreTeamProgramsForm] = useState<WorkProgram[]>([])
  const [isSavingCoreTeamPrograms, setIsSavingCoreTeamPrograms] = useState(false)
  const [uploadingCoreTeamId, setUploadingCoreTeamId] = useState<string | null>(null)
  const [deletingCoreTeamId, setDeletingCoreTeamId] = useState<string | null>(null)
  const memberImageInputRef = useRef<HTMLInputElement>(null)
  const [newMember, setNewMember] = useState({
    name: "",
    position: "",
    department: "",
  })

  const loadOrganization = async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/organization")
      if (!response.ok) throw new Error("Failed to load organization data")

      const data = await response.json()
      setMembers(data.members ?? [])
      setUnits(data.organizationalUnits ?? data.departments ?? [])
      setCoreTeams(data.coreTeams ?? [])
    } catch {
      setErrorMessage("Data organisasi belum bisa dimuat. Coba refresh halaman.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("action") === "add") {
      setEditingMember(null)
      setNewMember({ name: "", position: "", department: "" })
      setIsAddMemberOpen(true)
    }
    if (params.get("tab") === "structure") setActiveTab("structure")
    if (params.get("tab") === "units") setActiveTab("units")
    void loadOrganization()
  }, [])

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.position.toLowerCase().includes(query)
      const matchesUnit = filterUnit === "all" || member.department === filterUnit
      return matchesSearch && matchesUnit
    })
  }, [filterUnit, members, searchQuery])

  const handleSingleUnitImageUpload = async (
    unit: OrganizationalUnit,
    file: File | undefined,
  ) => {
    if (!file) return

    setUploadingUnitId(unit.id)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.86,
      })
      const formData = new FormData()
      formData.append("unitId", unit.id)
      formData.append("files", optimizedFile)

      const response = await fetch("/api/admin/organization/images", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok || !data.uploaded?.[0]) {
        throw new Error(data.error || data.unmatched?.[0]?.reason || "Logo gagal diunggah.")
      }

      const imageUrl = data.uploaded[0].url as string
      setUnits((current) =>
        current.map((item) => (item.id === unit.id ? { ...item, imageUrl } : item)),
      )
      setSuccessMessage(`Logo ${unit.name} berhasil diperbarui.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Logo gagal diunggah.")
    } finally {
      setUploadingUnitId(null)
    }
  }

  const openCreateMember = () => {
    setEditingMember(null)
    setNewMember({ name: "", position: "", department: "" })
    setIsAddMemberOpen(true)
  }

  const openEditMember = (member: Member) => {
    setEditingMember(member)
    setNewMember({
      name: member.name,
      position: member.position,
      department: member.department === "Unassigned" ? "" : member.department,
    })
    setIsAddMemberOpen(true)
  }

  const handleSaveMember = async () => {
    setErrorMessage("")
    setSuccessMessage("")

    if (!newMember.name.trim() || !newMember.position.trim()) {
      setErrorMessage("Nama lengkap dan jabatan wajib diisi.")
      return
    }

    setIsSavingMember(true)

    try {
      const response = await fetch("/api/admin/organization", {
        method: editingMember?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "member",
          id: editingMember?.id || undefined,
          avatar: editingMember?.avatar,
          ...newMember,
        }),
      })

      if (!response.ok) throw new Error("Failed to save member")

      const data = await response.json()
      setMembers((current) =>
        editingMember?.id
          ? current.map((member) => (member.id === data.member.id ? data.member : member))
          : [...current, data.member],
      )
      setIsAddMemberOpen(false)
      setEditingMember(null)
      setNewMember({ name: "", position: "", department: "" })
      setSuccessMessage(
        editingMember?.id ? "Data anggota berhasil diperbarui." : "Anggota berhasil ditambahkan.",
      )
    } catch {
      setErrorMessage("Data anggota belum berhasil disimpan. Periksa kembali datanya.")
    } finally {
      setIsSavingMember(false)
    }
  }

  const handleMemberImageUpload = async (file: File | undefined) => {
    if (!file) return

    setIsUploadingMemberImage(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 900,
        maxHeight: 1200,
        quality: 0.82,
      })
      const formData = new FormData()
      formData.append("files", optimizedFile)

      if (editingMember) {
        formData.append("memberId", editingMember.id)
      } else {
        formData.append("skipMember", "true")
      }

      const response = await fetch("/api/admin/organization/member-images", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok || !data.uploaded?.[0]) {
        throw new Error(data.error || data.unmatched?.[0]?.reason || "Foto gagal diunggah.")
      }

      const avatar = data.uploaded[0].url as string

      if (editingMember) {
        const updatedMember = { ...editingMember, avatar }
        setEditingMember(updatedMember)
        setMembers((current) =>
          current.map((member) => (member.id === updatedMember.id ? updatedMember : member)),
        )
        setSuccessMessage(`Foto ${editingMember.name} berhasil diperbarui.`)
      } else {
        setEditingMember({ id: "", name: "", position: "", department: "", avatar })
        setSuccessMessage("Foto berhasil diunggah. Simpan anggota untuk menerapkan.")
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Foto gagal diunggah.")
    } finally {
      setIsUploadingMemberImage(false)
      if (memberImageInputRef.current) memberImageInputRef.current.value = ""
    }
  }

  const handleDeleteMember = async (id: string) => {
    const previousMembers = members
    setMembers((current) => current.filter((member) => member.id !== id))
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await fetch(`/api/admin/organization?id=${id}&type=member`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete member")
      setSuccessMessage("Anggota berhasil dihapus.")
    } catch {
      setMembers(previousMembers)
      setErrorMessage("Anggota belum berhasil dihapus.")
    }
  }

  const openCreateUnit = () => {
    setEditingUnit(null)
    setUnitForm(emptyUnitForm)
    setIsUnitDialogOpen(true)
  }

  const openEditUnit = (unit: OrganizationalUnit) => {
    const isKnownType = unit.type === "department" || unit.type === "bureau"
    setEditingUnit(unit)
    setUnitForm({
      name: unit.name,
      type: isKnownType ? unit.type : "other",
      description: unit.description,
      color: unit.color,
      customType: isKnownType ? "" : unit.type,
    })
    setIsUnitDialogOpen(true)
  }

  const handleSaveUnit = async () => {
    if (!unitForm.name.trim()) {
      setErrorMessage("Nama departemen atau biro wajib diisi.")
      return
    }

    setIsSavingUnit(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/admin/organization", {
        method: editingUnit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "organizational-unit",
          id: editingUnit?.id,
          name: unitForm.name,
          unitType: unitForm.type === "other" ? unitForm.customType : unitForm.type,
          description: unitForm.description,
          workPrograms: editingUnit?.workPrograms ?? [],
          color: unitForm.color,
          sortOrder: editingUnit?.sortOrder ?? units.length,
        }),
      })

      if (!response.ok) throw new Error("Failed to save organizational unit")

      const data = await response.json()
      const savedUnit = data.organizationalUnit as OrganizationalUnit
      setUnits((current) =>
        editingUnit
          ? current.map((unit) => (unit.id === savedUnit.id ? { ...unit, ...savedUnit, head: unit.head, memberCount: unit.memberCount } : unit))
          : [...current, savedUnit],
      )
      setIsUnitDialogOpen(false)
      setEditingUnit(null)
      setUnitForm(emptyUnitForm)
      setSuccessMessage(
        editingUnit
          ? "Departemen atau biro berhasil diperbarui."
          : "Departemen atau biro berhasil ditambahkan.",
      )
    } catch {
      setErrorMessage("Departemen atau biro belum berhasil disimpan.")
    } finally {
      setIsSavingUnit(false)
    }
  }

  const handleDeleteUnit = async (unit: OrganizationalUnit) => {
    const confirmed = window.confirm(
      `Hapus ${unit.type === "bureau" ? "biro" : "departemen"} ${unit.name}? Anggota di dalamnya akan menjadi unassigned.`,
    )
    if (!confirmed) return

    setDeletingUnitId(unit.id)
    setErrorMessage("")

    try {
      const response = await fetch(
        `/api/admin/organization?id=${unit.id}&type=organizational-unit`,
        { method: "DELETE" },
      )
      if (!response.ok) throw new Error("Failed to delete organizational unit")

      setUnits((current) => current.filter((item) => item.id !== unit.id))
      setMembers((current) =>
        current.map((member) =>
          member.department === unit.name ? { ...member, department: "Unassigned" } : member,
        ),
      )
      if (filterUnit === unit.name) setFilterUnit("all")
      setSuccessMessage("Departemen atau biro berhasil dihapus.")
    } catch {
      setErrorMessage("Departemen atau biro belum berhasil dihapus.")
    } finally {
      setDeletingUnitId(null)
    }
  }

  const openProgramsDialog = (unit: OrganizationalUnit) => {
    setProgramUnit(unit)
    setProgramsForm(unit.workPrograms)
    setIsProgramDialogOpen(true)
  }

  const addProgram = () => {
    setProgramsForm((current) => [
      ...current,
      { name: "", description: "", status: "Rencana" },
    ])
  }

  const updateProgram = (index: number, patch: Partial<WorkProgram>) => {
    setProgramsForm((current) =>
      current.map((program, programIndex) =>
        programIndex === index ? { ...program, ...patch } : program,
      ),
    )
  }

  const removeProgram = (index: number) => {
    setProgramsForm((current) =>
      current.filter((_, programIndex) => programIndex !== index),
    )
  }

  const handleSavePrograms = async () => {
    if (!programUnit) return

    const workPrograms = programsForm.map((program) => ({
      ...program,
      name: program.name.trim(),
      description: program.description.trim(),
    }))

    if (workPrograms.some((program) => !program.name)) {
      setErrorMessage("Nama setiap program kerja wajib diisi.")
      return
    }

    setIsSavingPrograms(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await fetch("/api/admin/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "organizational-unit",
          id: programUnit.id,
          name: programUnit.name,
          unitType: programUnit.type,
          description: programUnit.description,
          imageUrl: programUnit.imageUrl,
          color: programUnit.color,
          sortOrder: programUnit.sortOrder,
          workPrograms,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Program kerja gagal disimpan.")

      const savedUnit = data.organizationalUnit as OrganizationalUnit
      setUnits((current) =>
        current.map((unit) => (unit.id === savedUnit.id ? { ...unit, ...savedUnit, head: unit.head, memberCount: unit.memberCount } : unit)),
      )
      setIsProgramDialogOpen(false)
      setProgramUnit(null)
      setSuccessMessage(`Program kerja ${savedUnit.name} berhasil disimpan.`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Program kerja gagal disimpan.",
      )
    } finally {
      setIsSavingPrograms(false)
    }
  }

  const openCreateCoreTeam = () => {
    setEditingCoreTeam(null)
    setCoreTeamForm({ slug: "", name: "", type: "Pengurus Inti", description: "" })
    setIsCoreTeamDialogOpen(true)
  }

  const openEditCoreTeam = (ct: CoreTeam) => {
    setEditingCoreTeam(ct)
    setCoreTeamForm({ slug: ct.slug, name: ct.name, type: ct.type, description: ct.description })
    setIsCoreTeamDialogOpen(true)
  }

  const handleSaveCoreTeam = async () => {
    if (!coreTeamForm.name.trim() || !coreTeamForm.slug.trim()) {
      setErrorMessage("Nama dan slug wajib diisi.")
      return
    }
    setIsSavingCoreTeam(true)
    setErrorMessage("")
    try {
      const response = await fetch("/api/admin/organization/core-teams", {
        method: editingCoreTeam ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCoreTeam?.id,
          ...coreTeamForm,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan pengurus inti.")

      setCoreTeams((current) =>
        editingCoreTeam
          ? current.map((ct) => (ct.id === editingCoreTeam.id ? data.coreTeam : ct))
          : [...current, data.coreTeam],
      )
      setIsCoreTeamDialogOpen(false)
      setEditingCoreTeam(null)
      setSuccessMessage(editingCoreTeam ? "Pengurus inti berhasil diperbarui." : "Pengurus inti berhasil ditambahkan.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan pengurus inti.")
    } finally {
      setIsSavingCoreTeam(false)
    }
  }

  const handleDeleteCoreTeam = async (ct: CoreTeam) => {
    if (!window.confirm(`Hapus ${ct.name}?`)) return
    setDeletingCoreTeamId(ct.id)
    try {
      const response = await fetch(`/api/admin/organization/core-teams?id=${ct.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Gagal menghapus.")
      setCoreTeams((current) => current.filter((t) => t.id !== ct.id))
      setSuccessMessage(`${ct.name} berhasil dihapus.`)
    } catch {
      setErrorMessage("Gagal menghapus pengurus inti.")
    } finally {
      setDeletingCoreTeamId(null)
    }
  }

  const handleCoreTeamImageUpload = async (ct: CoreTeam, file: File | undefined) => {
    if (!file) return
    setUploadingCoreTeamId(ct.id)
    setErrorMessage("")
    try {
      const optimizedFile = await optimizeImageForUpload(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.86 })
      const formData = new FormData()
      formData.append("coreTeamId", ct.id)
      formData.append("files", optimizedFile)

      const response = await fetch("/api/admin/organization/core-teams-image", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Logo gagal diunggah.")

      setCoreTeams((current) => current.map((t) => (t.id === ct.id ? { ...t, imageUrl: data.url } : t)))
      setSuccessMessage(`Logo ${ct.name} berhasil diperbarui.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Logo gagal diunggah.")
    } finally {
      setUploadingCoreTeamId(null)
    }
  }

  const openCoreTeamPrograms = (ct: CoreTeam) => {
    setCoreTeamProgramTarget(ct)
    setCoreTeamProgramsForm(ct.workPrograms)
    setIsCoreTeamProgramDialogOpen(true)
  }

  const handleSaveCoreTeamPrograms = async () => {
    if (!coreTeamProgramTarget) return
    const workPrograms = coreTeamProgramsForm.map((p) => ({ ...p, name: p.name.trim(), description: p.description.trim() }))
    if (workPrograms.some((p) => !p.name)) {
      setErrorMessage("Nama setiap program kerja wajib diisi.")
      return
    }
    setIsSavingCoreTeamPrograms(true)
    setErrorMessage("")
    try {
      const response = await fetch("/api/admin/organization/core-teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: coreTeamProgramTarget.id,
          slug: coreTeamProgramTarget.slug,
          name: coreTeamProgramTarget.name,
          type: coreTeamProgramTarget.type,
          description: coreTeamProgramTarget.description,
          workPrograms,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan program kerja.")
      setCoreTeams((current) => current.map((ct) => (ct.id === coreTeamProgramTarget.id ? data.coreTeam : ct)))
      setIsCoreTeamProgramDialogOpen(false)
      setCoreTeamProgramTarget(null)
      setSuccessMessage(`Program kerja ${coreTeamProgramTarget.name} berhasil disimpan.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan program kerja.")
    } finally {
      setIsSavingCoreTeamPrograms(false)
    }
  }

  const departmentCount = units.filter((unit) => unit.type === "department").length
  const bureauCount = units.filter((unit) => unit.type === "bureau").length

  if (isLoading) {
    return <AdminPageSkeleton tabs={3} cards={2} />
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pengelolaan Organisasi</h1>
          <p className="text-muted-foreground">
            Kelola pengurus, departemen, biro, dan struktur organisasi Kabinet Vidyakatra.
          </p>
        </div>
        <Dialog
          open={isAddMemberOpen}
          onOpenChange={(open) => {
            setIsAddMemberOpen(open)
            if (!open) setEditingMember(null)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Anggota" : "Tambah Anggota"}</DialogTitle>
              <DialogDescription>
                {editingMember
                  ? "Perbarui nama, jabatan, atau penempatan unit anggota."
                  : "Tambahkan nama dan jabatan untuk kebutuhan statistik serta struktur organisasi."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={editingMember?.avatar ?? ""} />
                  <AvatarFallback>{editingMember ? getInitials(editingMember.name) : "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Foto profil publik</p>
                  <p className="text-xs text-muted-foreground">
                    Dipakai untuk Ketua, Wakil, Sekben, Koordinator, dan struktur organisasi.
                  </p>
                  <input
                    ref={memberImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      void handleMemberImageUpload(event.target.files?.[0])
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    disabled={isUploadingMemberImage}
                    onClick={() => memberImageInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {isUploadingMemberImage
                      ? "Mengunggah..."
                      : editingMember?.avatar
                        ? "Ganti Foto"
                        : "Unggah Foto"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(event) => setNewMember({ ...newMember, name: event.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="position">Jabatan</Label>
                  <Input
                    id="position"
                    value={newMember.position}
                    onChange={(event) =>
                      setNewMember({ ...newMember, position: event.target.value })
                    }
                    placeholder="Contoh: Staff"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-unit">Departemen / Biro</Label>
                  <Select
                    value={newMember.department || "_"}
                    onValueChange={(value) => setNewMember({ ...newMember, department: value === "_" ? "" : value })}
                  >
                    <SelectTrigger id="member-unit">
                      <SelectValue placeholder="Pilih unit (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">-</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveMember} disabled={isSavingMember}>
                {isSavingMember ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : editingMember ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Anggota"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deletingMember !== null} onOpenChange={(open) => { if (!open) setDeletingMember(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Anggota</AlertDialogTitle>
              <AlertDialogDescription>
                Yakin ingin menghapus <strong>{deletingMember?.name}</strong> dari data organisasi? Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (deletingMember) void handleDeleteMember(deletingMember.id); setDeletingMember(null) }}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {errorMessage && (
        <div className="sticky top-0 z-10 flex items-center gap-2 rounded-md border border-destructive/30 bg-background/95 px-4 py-3 text-sm text-destructive shadow-sm backdrop-blur">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="sticky top-0 z-10 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-background/95 px-4 py-3 text-sm text-emerald-600 shadow-sm backdrop-blur">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-md bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Anggota</p>
              <p className="text-2xl font-bold">{members.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-md bg-blue-500/10 p-3">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Departemen</p>
              <p className="text-2xl font-bold">{departmentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-md bg-amber-500/10 p-3">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Biro</p>
              <p className="text-2xl font-bold">{bureauCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Anggota</TabsTrigger>
          <TabsTrigger value="units">Departemen & Biro</TabsTrigger>
          <TabsTrigger value="structure">Struktur Organisasi</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Semua Anggota</CardTitle>
                  <CardDescription className="mt-1">
                    Data ini dipakai untuk statistik jumlah anggota dan penyusunan bagan.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari anggota..."
                      className="w-full pl-9 sm:w-64"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                  <Select value={filterUnit} onValueChange={setFilterUnit}>
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue placeholder="Semua unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua unit</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="gap-2" onClick={openCreateMember}>
                    <Plus className="h-4 w-4" />
                    Tambah Anggota
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anggota</TableHead>
                      <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                      <TableHead className="hidden lg:table-cell">Departemen / Biro</TableHead>
                      <TableHead className="sticky right-0 w-12 bg-background" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{member.position}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary">{member.department}</Badge>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${member.name}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditMember(member)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeletingMember(member)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && filteredMembers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          Anggota tidak ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Departemen & Biro</h2>
              <p className="text-sm text-muted-foreground">
                Buat unit terlebih dahulu, lalu unggah gambar secara massal dengan nama
                file yang sesuai, misalnya medkom.png, psdm.jpg, atau sosial-politik.webp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" onClick={openCreateUnit}>
                <Plus className="h-4 w-4" />
                Tambah Departemen / Biro
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Pengurus Inti</CardTitle>
                  <CardDescription>
                    Kelola logo, deskripsi, dan program kerja pengurus inti untuk profil publik.
                  </CardDescription>
                </div>
                <Button className="gap-2" onClick={openCreateCoreTeam}>
                  <Plus className="h-4 w-4" />
                  Tambah
                </Button>
              </div>
            </CardHeader>
          </Card>

          {coreTeams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {coreTeams.map((ct) => (
                <Card key={ct.id} className="overflow-hidden">
                  <label className="block cursor-pointer group/logo relative">
                    {ct.imageUrl ? (
                      <div className="flex h-32 items-center justify-center border-b bg-muted/30 p-5 transition-opacity group-hover/logo:opacity-70">
                        <img
                          src={ct.imageUrl}
                          alt={`Logo ${ct.name}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                            <ImagePlus className="h-3.5 w-3.5" />
                            {uploadingCoreTeamId === ct.id ? "Mengunggah..." : "Ganti Logo"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-32 flex-col items-center justify-center gap-2 border-b bg-muted/10 p-5 transition-colors hover:bg-muted/20">
                        <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                        <span className="text-xs text-muted-foreground/50">
                          {uploadingCoreTeamId === ct.id ? "Mengunggah..." : "Upload Logo"}
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingCoreTeamId !== null}
                      onChange={(event) => {
                        void handleCoreTeamImageUpload(ct, event.target.files?.[0])
                        event.currentTarget.value = ""
                      }}
                    />
                  </label>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge variant="outline" className="mb-2">{ct.type}</Badge>
                        <CardTitle className="text-base">{ct.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 min-h-8">
                          {ct.description || "Belum ada deskripsi."}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${ct.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditCoreTeam(ct)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={deletingCoreTeamId === ct.id}
                            onClick={() => handleDeleteCoreTeam(ct)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="border-t pt-4">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => openCoreTeamPrograms(ct)}
                    >
                      <ClipboardList className="h-4 w-4" />
                      Kelola Proker
                      <Badge variant="secondary" className="ml-auto">
                        {ct.workPrograms.length}
                      </Badge>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed px-6 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada pengurus inti.</p>
            </div>
          )}

          {units.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {units.map((unit) => (
                <Card key={unit.id} className="overflow-hidden">
                  <label className="block cursor-pointer group/logo relative">
                    {unit.imageUrl ? (
                      <div className="flex h-36 items-center justify-center border-b bg-muted/30 p-5 transition-opacity group-hover/logo:opacity-70">
                        <img
                          src={unit.imageUrl}
                          alt={`Logo ${unit.name}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                            <ImagePlus className="h-3.5 w-3.5" />
                            {uploadingUnitId === unit.id ? "Mengunggah..." : "Ganti Logo"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 border-b bg-muted/10 p-5 transition-colors hover:bg-muted/20">
                        <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                        <span className="text-xs text-muted-foreground/50">
                          {uploadingUnitId === unit.id ? "Mengunggah..." : "Upload Logo"}
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingUnitId !== null}
                      onChange={(event) => {
                        void handleSingleUnitImageUpload(unit, event.target.files?.[0])
                        event.currentTarget.value = ""
                      }}
                    />
                  </label>
                  <div
                    className={`h-1.5 ${unit.color.startsWith("#") ? "" : unit.color}`}
                    style={unit.color.startsWith("#") ? { backgroundColor: unit.color } : undefined}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline">
                            {unit.type === "bureau" ? "Biro" : "Departemen"}
                          </Badge>
                          <Badge variant="secondary">{unit.memberCount} anggota</Badge>
                        </div>
                        <CardTitle className="text-base">{unit.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 min-h-10">
                          {unit.description || "Belum ada deskripsi."}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${unit.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditUnit(unit)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={deletingUnitId === unit.id}
                            onClick={() => handleDeleteUnit(unit)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="border-t pt-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Kepala Unit</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {unit.head === "-" ? "?" : getInitials(unit.head)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {unit.head === "-" ? "Belum ditentukan" : unit.head}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full gap-2"
                      onClick={() => openProgramsDialog(unit)}
                    >
                      <ClipboardList className="h-4 w-4" />
                      Kelola Proker
                      <Badge variant="secondary" className="ml-auto">
                        {unit.workPrograms.length}
                      </Badge>
                    </Button>

                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed px-6 text-center">
              <Building2 className="mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold">Belum ada departemen atau biro</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Tambahkan unit pertama agar anggota dapat ditempatkan dan bagan organisasi bisa dibuat.
              </p>
              <Button className="mt-4 gap-2" onClick={openCreateUnit}>
                <Plus className="h-4 w-4" />
                Tambah Departemen / Biro
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="structure">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bagan Organisasi</CardTitle>
                <CardDescription>
                  Struktur ini otomatis mengikuti jabatan anggota dan unit organisasi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 && units.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center text-center">
                    <Network className="mb-4 h-10 w-10 text-muted-foreground" />
                    <h3 className="font-semibold">Bagan organisasi masih kosong</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tambahkan departemen, biro, dan anggota untuk membuat bagan organisasi.
                    </p>
                  </div>
                ) : (
                  <OrganizationChart members={members} units={units} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUnit ? "Edit Departemen / Biro" : "Tambah Departemen / Biro"}</DialogTitle>
            <DialogDescription>
              Unit ini digunakan untuk penempatan anggota, profil publik, dan bagan organisasi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Nama Unit</Label>
              <Input
                id="unit-name"
                value={unitForm.name}
                onChange={(event) => setUnitForm({ ...unitForm, name: event.target.value })}
                placeholder="Contoh: Media dan Komunikasi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-type">Jenis Unit</Label>
              <Select
                value={unitForm.type}
                onValueChange={(value: string) =>
                  setUnitForm({ ...unitForm, type: value })
                }
              >
                <SelectTrigger id="unit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Departemen</SelectItem>
                  <SelectItem value="bureau">Biro</SelectItem>
                  <SelectItem value="other">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
              {unitForm.type === "other" && (
                <Input
                  value={unitForm.customType}
                  onChange={(e) => setUnitForm({ ...unitForm, customType: e.target.value })}
                  placeholder="Contoh: Sekretariat"
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-description">Deskripsi</Label>
              <Textarea
                id="unit-description"
                rows={4}
                value={unitForm.description}
                onChange={(event) =>
                  setUnitForm({ ...unitForm, description: event.target.value })
                }
                placeholder="Jelaskan tanggung jawab singkat unit ini"
              />
            </div>
            <div className="space-y-2">
              <Label>Warna Bagan</Label>
              <div className="flex flex-wrap gap-2">
                {unitColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm ${unitForm.color === color.value ? "border-foreground" : "border-border"
                      }`}
                    onClick={() => setUnitForm({ ...unitForm, color: color.value })}
                  >
                    <span className={`h-3 w-3 rounded-full ${color.swatch}`} />
                    {color.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm ${!unitColors.some((c) => c.value === unitForm.color) ? "border-foreground" : "border-border"
                    }`}
                  onClick={() => setUnitForm({ ...unitForm, color: "#3b82f6" })}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: unitForm.color.startsWith("bg-") ? undefined : unitForm.color }}
                  />
                  Custom
                </button>
              </div>
              {!unitColors.some((c) => c.value === unitForm.color) && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={unitForm.color}
                    onChange={(e) => setUnitForm({ ...unitForm, color: e.target.value })}
                    className="h-8 w-8 cursor-pointer rounded border"
                  />
                  <Input
                    value={unitForm.color}
                    onChange={(e) => setUnitForm({ ...unitForm, color: e.target.value })}
                    placeholder="#3b82f6"
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveUnit} disabled={isSavingUnit}>
              {isSavingUnit ? "Menyimpan..." : editingUnit ? "Simpan Perubahan" : "Tambah Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isProgramDialogOpen}
        onOpenChange={(open) => {
          setIsProgramDialogOpen(open)
          if (!open) setProgramUnit(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kelola Proker {programUnit?.name}</DialogTitle>
            <DialogDescription>
              Daftar ini langsung tampil pada halaman detail departemen atau biro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {programsForm.map((program, index) => (
              <div key={index} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Program kerja {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus program kerja ${index + 1}`}
                    onClick={() => removeProgram(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
                  <div className="space-y-2">
                    <Label htmlFor={`program-name-${index}`}>Nama Proker</Label>
                    <Input
                      id={`program-name-${index}`}
                      value={program.name}
                      onChange={(event) => updateProgram(index, { name: event.target.value })}
                      placeholder="Contoh: Study Club"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={program.status}
                      onValueChange={(value: WorkProgram["status"]) =>
                        updateProgram(index, { status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rutin">Rutin</SelectItem>
                        <SelectItem value="Berjalan">Berjalan</SelectItem>
                        <SelectItem value="Rencana">Rencana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`program-description-${index}`}>Deskripsi</Label>
                  <Textarea
                    id={`program-description-${index}`}
                    rows={3}
                    value={program.description}
                    onChange={(event) =>
                      updateProgram(index, { description: event.target.value })
                    }
                    placeholder="Jelaskan tujuan atau bentuk kegiatan proker"
                  />
                </div>
              </div>
            ))}

            {programsForm.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Belum ada program kerja untuk unit ini.
              </div>
            )}

            <Button type="button" variant="outline" className="w-full gap-2" onClick={addProgram}>
              <Plus className="h-4 w-4" />
              Tambah Program Kerja
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePrograms} disabled={isSavingPrograms}>
              {isSavingPrograms ? "Menyimpan..." : "Simpan Proker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCoreTeamDialogOpen}
        onOpenChange={(open) => {
          setIsCoreTeamDialogOpen(open)
          if (!open) setEditingCoreTeam(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCoreTeam ? "Edit Pengurus Inti" : "Tambah Pengurus Inti"}</DialogTitle>
            <DialogDescription>
              {editingCoreTeam ? "Perbarui informasi pengurus inti." : "Tambahkan pengurus inti baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ct-slug">Slug</Label>
              <Input
                id="ct-slug"
                value={coreTeamForm.slug}
                onChange={(e) => setCoreTeamForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="Contoh: sekben, koordinator"
                disabled={!!editingCoreTeam}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-name">Nama</Label>
              <Input
                id="ct-name"
                value={coreTeamForm.name}
                onChange={(e) => setCoreTeamForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Sekretaris & Bendahara"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-type">Tipe</Label>
              <Input
                id="ct-type"
                value={coreTeamForm.type}
                onChange={(e) => setCoreTeamForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Contoh: Pengurus Inti"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-description">Deskripsi</Label>
              <Textarea
                id="ct-description"
                rows={3}
                value={coreTeamForm.description}
                onChange={(e) => setCoreTeamForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi singkat peran pengurus inti ini"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCoreTeamDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveCoreTeam} disabled={isSavingCoreTeam}>
              {isSavingCoreTeam ? "Menyimpan..." : editingCoreTeam ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCoreTeamProgramDialogOpen}
        onOpenChange={(open) => {
          setIsCoreTeamProgramDialogOpen(open)
          if (!open) setCoreTeamProgramTarget(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kelola Proker {coreTeamProgramTarget?.name}</DialogTitle>
            <DialogDescription>
              Daftar program kerja yang tampil pada halaman detail pengurus inti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {coreTeamProgramsForm.map((program, index) => (
              <div key={index} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Program kerja {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus program kerja ${index + 1}`}
                    onClick={() => setCoreTeamProgramsForm((c) => c.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
                  <div className="space-y-2">
                    <Label htmlFor={`ct-prog-name-${index}`}>Nama Proker</Label>
                    <Input
                      id={`ct-prog-name-${index}`}
                      value={program.name}
                      onChange={(e) =>
                        setCoreTeamProgramsForm((c) =>
                          c.map((p, i) => (i === index ? { ...p, name: e.target.value } : p)),
                        )
                      }
                      placeholder="Contoh: Study Club"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={program.status}
                      onValueChange={(value: WorkProgram["status"]) =>
                        setCoreTeamProgramsForm((c) =>
                          c.map((p, i) => (i === index ? { ...p, status: value } : p)),
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rutin">Rutin</SelectItem>
                        <SelectItem value="Berjalan">Berjalan</SelectItem>
                        <SelectItem value="Rencana">Rencana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ct-prog-desc-${index}`}>Deskripsi</Label>
                  <Textarea
                    id={`ct-prog-desc-${index}`}
                    rows={3}
                    value={program.description}
                    onChange={(e) =>
                      setCoreTeamProgramsForm((c) =>
                        c.map((p, i) => (i === index ? { ...p, description: e.target.value } : p)),
                      )
                    }
                    placeholder="Jelaskan tujuan atau bentuk kegiatan proker"
                  />
                </div>
              </div>
            ))}
            {coreTeamProgramsForm.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Belum ada program kerja.
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                setCoreTeamProgramsForm((c) => [...c, { name: "", description: "", status: "Rencana" }])
              }
            >
              <Plus className="h-4 w-4" />
              Tambah Program Kerja
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCoreTeamProgramDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveCoreTeamPrograms} disabled={isSavingCoreTeamPrograms}>
              {isSavingCoreTeamPrograms ? "Menyimpan..." : "Simpan Proker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
