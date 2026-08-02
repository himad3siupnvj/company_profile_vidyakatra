# CLAUDE.md — CMS HIMA D3SI

> Single Source of Truth (SSOT) for CMS HIMA D3SI v1
>
> Stack: Next.js · TypeScript · Tailwind CSS · shadcn/ui · Drizzle ORM · PostgreSQL · Supabase Storage · Tiptap

---

# 1. Project Overview

CMS HIMA D3SI adalah sistem manajemen konten internal untuk website HIMA D3 Sistem Informasi.

Fokus utama: memudahkan pengurus mengelola konten website publik tanpa perlu coding.

**Masuk scope V1:**
- Authentication & Claim Account System
- User Management
- Role & Permission
- Article Management + Approval Workflow
- Tiptap / Notion-like Editor
- Organizational Structure Management
- Website Settings
- Asset Management
- Period Management
- Data Export

**Keluar dari scope V1:**
- Event Management
- Gallery / Album
- Analytics kompleks
- Komentar artikel
- Registrasi publik
- Multi organisasi

CMS bersifat internal-only.
Tidak ada registrasi publik.
Semua akun dibuat administrator.

---

# 2. Members vs Users

## Konsep

**members** — source of truth organisasi.
- Menyimpan seluruh anggota kepengurusan.
- Dipakai untuk struktur organisasi publik.
- Tidak semua member harus punya akun CMS.

**users** — akun login CMS.
- Terhubung ke member melalui `memberId` (FK di tabel users).
- Dipakai untuk authentication, permission, dashboard, dan approval.

## Relasi

```
users.memberId → members.id
```

- Satu user terhubung ke satu member.
- Member bisa ada tanpa user (tidak semua anggota perlu login).
- User selalu terhubung ke member.

## Keuntungan

- Struktur organisasi tidak bergantung pada akun login.
- Pergantian periode lebih mudah.
- Data organisasi tetap utuh walaupun anggota tidak pernah login.

---

# 3. Account Claim System

Akun tidak langsung aktif saat dibuat admin. User harus klaim akun sendiri.

> **Catatan V1 (deployment saat ini): single administrator mode.**
> Pembuatan akun (`POST /api/admin/users`) dan halaman `/claim` dinonaktifkan (return 403).
> CMS berjalan dengan satu akun administrator. Admin dapat me-reset password user lewat
> `PATCH /api/admin/users` (`action: "reset_password"`) yang memindahkan user kembali ke status
> `unclaimed` dengan claim code baru agar user bisa klaim ulang. Fondasi claim system tetap
> tersedia di schema (`passwordHash` nullable, `claimCode`, status `unclaimed`).

**Flow:**
```
Admin membuat akun (email + claim code)
→ passwordHash = null (belum diklaim)
→ Status = unclaimed
→ Claim code dapat dilihat administrator dari dashboard User Management
→ User menerima claim code
→ User membuka halaman /claim
→ User input: email + claim code + password baru
→ passwordHash terisi
→ Claim code dihapus / diinvalidasi
→ Status berubah: unclaimed → active
→ User dapat login
```

**Rules:**
- `passwordHash` boleh `null` saat akun belum diklaim
- User `unclaimed` tidak bisa login
- Claim code bersifat one-time use
- Claim code diinvalidasi setelah berhasil diklaim
- Claim code hanya visible bagi administrator di dashboard

---

# 4. Core Product Goals

- Admin dapat mengelola website tanpa edit kode.
- Artikel menggunakan modern Notion-like editor.
- Artikel memiliki workflow approval sebelum publish.
- Publish dilakukan otomatis oleh sistem setelah approval — bukan tombol manual.
- Role organisasi tetap detail.
- Permission system tetap sederhana.
- Sistem scalable dan maintainable.
- Architecture ramah untuk AI-assisted development.

---

# 5. Non Goals (v1)

- Tidak ada public registration
- Tidak ada comment system
- Tidak ada analytics kompleks
- Tidak ada multi-organization support
- Tidak ada realtime collaboration editor
- Tidak ada event management
- Tidak ada gallery / album
- Tidak ada approval bertingkat
- Tidak ada dokumen internal besar

---

# 6. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Rich Text Editor | Tiptap |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Storage | Supabase Storage |
| Auth | Jose JWT + httpOnly Cookie |
| Validation | Zod |
| Unit Test | Vitest |
| Component Test | React Testing Library |
| E2E Test | Playwright |

---

# 7. Development Rules

## IMPORTANT

- Follow existing architecture.
- Do not refactor unrelated files.
- Keep implementation minimal.
- Keep components small and reusable.
- Do not hardcode role checks.
- Always use permission helpers.
- Do not replace architecture decisions unless explicitly requested.
- Keep dashboard responsive.
- Keep article editor reusable.

## Forbidden Patterns

### BAD

```ts
if (user.role === "kepala_departemen")
```

### GOOD

```ts
if (hasPermission(user, "article.approve"))
```

---

# 8. Role System

## Role Enum

```txt
administrator
ketua
wakil_ketua
koordinator
wakil_koordinator
sekretaris
bendahara
kepala_departemen
wakil_kepala_departemen
kepala_biro
wakil_kepala_biro
kepala_divisi
staff
```

**Rules:**
- 1 user = 1 role. Tidak ada double role.
- Role = hak akses sistem.
- Jabatan/posisi organisasi disimpan di data member, bukan role sistem.

---

# 9. Permission Groups

## Super Admin
- administrator

## Executive
- ketua
- wakil_ketua

## Reviewer
- koordinator
- wakil_koordinator
- kepala_departemen
- wakil_kepala_departemen
- kepala_biro
- wakil_kepala_biro
- kepala_divisi

## Contributor
- sekretaris
- bendahara
- staff

---

# 10. Permission Matrix

| Permission | Super Admin | Executive | Reviewer | Contributor |
|---|:---:|:---:|:---:|:---:|
| user.manage | ✅ | ❌ | ❌ | ❌ |
| role.manage | ✅ | ❌ | ❌ | ❌ |
| settings.manage | ✅ | ✅ | ❌ | ❌ |
| article.create | ✅ | ✅ | ✅ | ✅ |
| article.read_all | ✅ | ✅ | ✅ | ❌ |
| article.edit_own | ✅ | ✅ | ✅ | ✅ |
| article.edit_all | ✅ | ✅ | ❌ | ❌ |
| article.submit | ✅ | ✅ | ✅ | ✅ |
| article.review | ✅ | ✅ | ✅ | ❌ |
| article.approve | ✅ | ✅ | ✅ | ❌ |
| article.reject | ✅ | ✅ | ✅ | ❌ |
| article.archive | ✅ | ✅ | ❌ | ❌ |
| article.delete | ✅ | ❌ | ❌ | ❌ |
| article.restore | ✅ | ❌ | ❌ | ❌ |
| media.upload | ✅ | ✅ | ✅ | ✅ |
| media.manage | ✅ | ✅ | ✅ | ❌ |
| media.delete | ✅ | ✅ | ❌ | ❌ |
| member.manage | ✅ | ✅ | ❌ | ❌ |
| org_unit.manage | ✅ | ✅ | ❌ | ❌ |
| period.manage | ✅ | ✅ | ❌ | ❌ |
| data.export | ✅ | ✅ | ❌ | ❌ |

> `article.publish` tidak ada. Publish dilakukan otomatis oleh sistem setelah `approved`.

---

# 11. Permission Architecture

```txt
lib/
  permissions/
    roles.ts
    permissions.ts
    hasPermission.ts
```

```ts
hasPermission(user, "article.approve")
```

Never hardcode role logic directly inside UI.

---

# 12. User Status

```txt
unclaimed   → akun dibuat admin, belum diklaim user
active      → akun aktif, sudah diklaim
inactive    → akun dinonaktifkan admin
```

**Rules:**
- `unclaimed` dan `inactive` tidak bisa login
- Hanya `active` yang bisa mengakses dashboard

---

# 13. Dashboard per Role

| Role | Akses |
|---|---|
| Administrator | User Management, Website Settings, Organization Management, Articles, Export Data |
| Ketua / Wakil Ketua | Articles, Organization Management, Website Settings, Export Data |
| Koordinator / Wakil Koordinator | Review artikel lintas unit, Monitoring artikel |
| Kepala Departemen / Biro | Review artikel unit masing-masing |
| Kepala Divisi | Review artikel divisi masing-masing |
| Staff / Sekretaris / Bendahara | Artikel milik sendiri, Draft, Status pengajuan |

---

# 14. Article Workflow

## Status Enum

```txt
draft
submitted
approved
rejected
published
archived
```

## Flow

```txt
draft → submitted
submitted → approved
submitted → rejected
rejected → draft (dapat diedit ulang)
approved → published (otomatis oleh sistem)
published → archived
```

## Auto-Publish Rules

- Setelah artikel berstatus `approved`, sistem menjalankan validasi basic secara otomatis.
- Jika validasi lolos → status berubah ke `published` otomatis.
- Tidak ada tombol publish manual.
- Approval adalah keputusan terakhir manusia dalam workflow.

## Validasi Basic Sebelum Auto-Publish

> **Catatan implementasi:** validasi saat ini hanya memeriksa `title` dan `content` (via
> `hasArticleTextContent`). `thumbnailUrl` dan `categoryId` TIDAK diwajibkan sebelum approve;
> public renderer memiliki fallback (mis. `thumbnail` default `/news/default.jpg`, kategori
> `uncategorized`). Bila perlu, cek ulang sebelum memperketat.

- `title` tidak kosong
- `content` tidak kosong

## Approval Scope

Artikel dari suatu divisi dapat di-approve oleh:
- Kepala Divisi terkait
- Kepala / Wakil Kepala Departemen terkait
- Kepala / Wakil Kepala Biro terkait
- Koordinator / Wakil Koordinator
- Ketua / Wakil Ketua
- Administrator

Cukup satu approver. Tidak ada approval berlapis.

## General Rules

- Contributor hanya dapat edit artikel sendiri jika status `draft` atau `rejected`.
- Archived article tidak tampil di public API.

---

# 15. Article Editor Specification

## Philosophy

Editor harus terasa seperti halaman artikel final.
Bukan textarea CMS biasa.
Terinspirasi dari Notion.

## Modes

### Edit Mode
- Toolbar visible, slash command aktif, content editable, upload tersedia

### Preview Mode
- Readonly, toolbar hidden, tampilan identik dengan halaman artikel publik

## Supported Blocks

- Paragraph, Heading 1/2/3, Quote
- Bullet list, Ordered list, Divider
- Link, Image

## Slash Commands

```txt
/heading  /image  /quote  /bullet  /numbered  /divider
```

## Editor Stack

| Need | Library |
|---|---|
| Editor | Tiptap |
| Core extension | StarterKit |
| Image | Tiptap Image Extension |
| Slash command | Custom extension |
| Storage | JSONB |

## Editor Layout

```txt
[Save Draft] [Submit] [Preview]

[Cover Image Upload]
[Category Badge]
[Editable Title]
[Editable Excerpt]
[Author · Date · Read Time]

[Tiptap Editor Body]

[Sidebar Metadata Panel]
```

> Tidak ada tombol `[Publish]`. Publish dilakukan otomatis oleh sistem.

## UX Rules

- Never use plain textarea.
- Upload image harus natural.
- Preview harus mirip halaman final.
- Writing experience harus clean.

---

# 16. Period Management

Setiap data organisasi terhubung ke periode kepengurusan via `periodId` (FK langsung di tiap tabel).

## Status Enum

```txt
upcoming
active
archived
```

## Rules

- Hanya satu period yang boleh berstatus `active` pada satu waktu.
- Public API hanya mengembalikan data dari period `active`.
- Data lama tetap tersimpan dan bisa diakses via filter `periodId`.
- Tidak dibuat sistem arsip kompleks — cukup filter berdasarkan `period.status`.

---

# 17. Organizational Structure

## organizational_units

Menggantikan tabel `departments`. Mewakili unit organisasi level atas.

**type enum:**
```txt
department
bureau
```

## divisions

Berada di bawah `organizational_units`.

## core_teams

Pengurus inti (BPH, koordinator, dll) yang tidak terikat ke satu unit/departemen.
Mirror `organizational_units` namun independen.

Fields: `slug`, `name`, `type`, `description`, `imageUrl`, `workPrograms` (JSONB),
`sortOrder`, `periodId`. Member terhubung lewat `members.coreTeamId` (FK).

- Public renderer membaca `core_teams` dari DB; bila tabel kosong/gagal, fallback ke
  definisi default di `lib/public-core-team.ts`.
- Seeding awal: `npm run seed:core-teams` (script di `scripts/seed-core-teams.mjs`).

---

# 18. Asset Management

Semua file upload masuk ke tabel `assets`.

**Digunakan untuk:**
- Logo website, thumbnail artikel, gambar konten artikel, foto anggota, asset umum

**Validation Rules (Global):**
- Tipe file: `image/*`
- Max size: **1 MB** per file
- Validasi MIME type dilakukan server-side

> Tidak ada gallery atau album pada V1.

## Upload Flow

```txt
Client select file
→ API upload
→ Validate MIME & size
→ Upload to Supabase Storage
→ Get public URL
→ Save asset record
→ Return URL
→ Insert URL into editor / form
```

## Bucket Structure

```txt
articles/
  thumbnails/
  content/
  sources/
    berita-acara/

members/
  avatars/

assets/
  general/
```

---

# 19. Website Settings

Dapat diubah tanpa coding. Dikelola oleh Super Admin dan Executive.

Fields: nama website, logo, hero section, kontak & email, sosial media, footer, SEO dasar.

---

# 20. Data Export

**Permission:** administrator, ketua, wakil_ketua

**Format:** CSV

## Export Options

**Export per Modul** (tombol individual di dashboard):
- Export Members
- Export Users
- Export Articles
- Export Organizational Units
- Export Divisions
- Export Periods
- Export Audit Logs

**Export All Data** → menghasilkan `export-YYYY-MM-DD.zip` berisi:

```txt
export-2026-05-29.zip
├── members.csv
├── users.csv
├── articles.csv
├── organizational_units.csv
├── divisions.csv
├── periods.csv
└── audit_logs.csv
```

**Tujuan:**
- Backup organisasi
- Serah terima kepengurusan
- Migrasi data
- Arsip manual

**Alasan CSV:** familiar untuk ketua, wakil ketua, sekretaris — langsung bisa dibuka di Excel / Google Sheets.

## Audit Trail Export

Setiap aksi export dicatat ke audit log:

```ts
action: "export.data"
metadata: {
  exportedEntity: "members" | "users" | "articles" | ... | "all",
  format: "csv",
  fileName: "export-2026-05-29.zip" | "members.csv"
}
```

---

# 21. Database Rules

- All IDs use UUID.
- Article content uses JSONB.
- Important tables use soft delete (`deletedAt`, `deletedBy`).
- Use timestamps everywhere.
- Use foreign keys.

---

# 22. Berita Acara PDF Generation

Draft generator, bukan auto publisher. Admin wajib review dan edit manual sebelum masuk workflow normal.

## Flow

```txt
User uploads PDF (max 10 MB)
→ Validate file type & size
→ Upload to Supabase Storage (articles/sources/berita-acara/)
→ Extract text from PDF
→ Generate article draft (title, excerpt, content JSONB, category suggestion)
→ Save as draft
→ Redirect to editor
→ User reviews & edits manually
→ Submit through normal workflow
```

## Rules

- Generated article selalu mulai sebagai `draft`
- Generator tidak auto-fill: `thumbnailUrl`, `thumbnailAlt`, publish status
- Tidak bypass editor atau workflow

---

# 23. Audit Log

Phase V1: **backend logging only**. Belum perlu halaman audit log di UI.

## Events

```txt
user.create
user.claim
user.disable

article.create
article.submit
article.approve
article.reject
article.archive

settings.update

export.data
```

## Schema

```ts
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id"),          // siapa yang melakukan
  action: varchar("action"),          // event type
  entityType: varchar("entity_type"), // "article" | "user" | "settings" | dll
  entityId: uuid("entity_id"),        // ID entitas terkait
  metadata: jsonb("metadata"),        // detail tambahan, e.g. exportedEntity
  createdAt: timestamp("created_at").defaultNow(),
})
```

---

# 24. Article Versioning

## Minimum v1

- Save version before publish.
- Save version before major update.
- Allow admin to view history.

## Future Scope

- Restore version.
- Compare versions.

---

# 25. Public API Rules

Public API hanya mengembalikan konten `published`, non-soft-deleted, dari period `active`.

```txt
/api/articles
/api/articles/:slug
/api/articles/featured
/api/members
/api/organizational-units
/api/divisions
```

> `/api/events`, `/api/albums` tidak ada di V1.

---

# 26. Security Rules

- Protect `/dashboard` dan `/api/cms` via middleware auth.
- JWT stored in httpOnly cookie.
- Bcrypt untuk password hash.
- Validate permission before mutation.
- Validate MIME type server-side.
- Never expose service role key.
- Use soft delete.
- Claim code one-time use, diinvalidasi setelah klaim.
- Claim code hanya visible bagi administrator.

---

# 27. Testing Plan

## Unit Test Targets

- permission helpers, workflow transition
- slug generator, readTime calculator
- soft delete helper, account claim flow

## Integration Test Targets

- create & update article
- workflow actions (submit → approve → auto-publish)
- media upload, soft delete
- duplicate slug handling, account claim
- export CSV + ZIP generation

## E2E Flow

```txt
login
→ create article → upload thumbnail → add image block
→ save draft → submit → approve
→ verify auto-published → check public article
```

## QA Checklist

- Contributor cannot publish manually.
- Reviewer can approve.
- Auto-publish triggers after approve + validation pass.
- Soft delete works.
- Preview matches public page.
- Upload validation works (1 MB limit, image/* only).
- Unclaimed / inactive user cannot login.
- Export generates correct CSV / ZIP.
- Export logged to audit log.

---

# 28. Component Architecture

```txt
app/
  dashboard/
  api/
  claim/
components/
  dashboard/
  articles/
  editor/
  media/
  members/
  shared/
lib/
  auth/
  permissions/
  db/
  storage/
  utils/
  export/       ← CSV + ZIP generation helpers
```

## Important Components

**Dashboard:** DashboardLayout, Sidebar, Topbar, DataTable, ConfirmDialog

**Articles:** ArticleEditorPage, ArticleTable, ArticlePreview, ArticleStatusBadge

**Editor:** NotionArticleEditor, BubbleMenu, SlashCommandMenu, ImageUploadBlock, PreviewRenderer

**Members:** MemberAvatar (wajib support inisial fallback), MemberTable, MemberForm

**Shared:** PermissionGate, ProtectedRoute, RoleBadge

---

# 29. Environment Variables

```env
DATABASE_URL=

JWT_SECRET=
JWT_EXPIRES_IN=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=

NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
```

---

# 30. Implementation Strategy

## IMPORTANT WORKFLOW

```txt
PLAN → APPROVE → EXECUTE
```

Jangan brainstorm architecture sambil coding.

## Recommended Development Order

1. Project setup
2. Auth foundation + account claim system
3. Permission system
4. Period management schema
5. Dashboard shell
6. Organizational units + divisions
7. Member management
8. Article schema / API + article_categories
9. Tiptap editor (tanpa tombol publish)
10. Auto-publish system
11. Asset management
12. Website settings
13. Data export (CSV + ZIP)
14. Audit log (backend only)
15. Public API
16. Testing & hardening

---

# 31. Codex / Claude Rules

- Use small scoped tasks.
- Open new chat for new feature.
- Do not paste huge unrelated files.
- Reference this file instead of repeating architecture.
- Keep prompts implementation-focused.

```txt
Analyze requirements first. Do not code yet.
Give implementation plan only.
```

Then: `Implement step 1 only.`

- Never refactor unrelated files.
- Never redesign architecture unless requested.
- Follow CLAUDE.md strictly.
- Prefer incremental implementation.

---

# 32. Single Source of Truth

This file is the main architecture and product reference for CMS HIMA D3SI v1.

All implementation decisions should follow this document unless explicitly overridden.