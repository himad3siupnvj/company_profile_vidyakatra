import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userStatus = pgEnum("user_status", [
  "unclaimed",
  "active",
  "inactive",
]);

export const userRole = pgEnum("user_role", [
  "administrator",
  "ketua",
  "wakil_ketua",
  "koordinator",
  "wakil_koordinator",
  "sekretaris",
  "bendahara",
  "kepala_departemen",
  "wakil_kepala_departemen",
  "kepala_biro",
  "wakil_kepala_biro",
  "kepala_divisi",
  "staff",
]);

export const periodStatus = pgEnum("period_status", [
  "upcoming",
  "active",
  "archived",
]);

export const orgUnitType = pgEnum("org_unit_type", ["department", "bureau"]);

export const articleStatus = pgEnum("article_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "published",
  "archived",
]);

// ─── Periods ──────────────────────────────────────────────────────────────────

export const periods = pgTable("periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(), // e.g. "2024/2025"
  status: periodStatus("status").notNull().default("upcoming"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const requestRateLimits = pgTable("request_rate_limits", {
  bucketKey: text("bucket_key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Members ──────────────────────────────────────────────────────────────────
// Source of truth organisasi. Tidak semua member harus punya akun CMS.

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  // jabatan/posisi organisasi (bukan role sistem)
  position: varchar("position", { length: 160 }).notNull(),
  organizationalUnitId: uuid("organizational_unit_id"),  // FK ditambah setelah tabel didefinisikan
  coreTeamId: uuid("core_team_id").references((): AnyPgColumn => coreTeams.id, {
    onDelete: "set null",
  }),
  divisionId: uuid("division_id"),                       // FK ditambah setelah tabel didefinisikan
  periodId: uuid("period_id").references(() => periods.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 255 }),
  // null = tampilkan inisial nama sebagai fallback di UI
  avatarUrl: text("avatar_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by"),
});

// ─── Users ────────────────────────────────────────────────────────────────────
// Akun login CMS. Selalu terhubung ke member via memberId.

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    // null = belum diklaim (unclaimed)
    passwordHash: text("password_hash"),
    // one-time claim code; visible admin di dashboard, diinvalidasi setelah klaim
    claimCode: text("claim_code"),
    role: userRole("role").notNull().default("staff"),
    status: userStatus("status").notNull().default("unclaimed"),
    // FK ke members — user selalu terhubung ke data member organisasi
    memberId: uuid("member_id").references(() => members.id, {
      onDelete: "set null",
    }),
    periodId: uuid("period_id").references(() => periods.id, {
      onDelete: "set null",
    }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

// ─── Organizational Units ─────────────────────────────────────────────────────

export const organizationalUnits = pgTable("organizational_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  type: orgUnitType("type").notNull(), // "department" | "bureau"
  periodId: uuid("period_id").references(() => periods.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  imageUrl: text("image_url"),
  workPrograms: jsonb("work_programs")
    .$type<Array<{
      name: string
      description: string
      status: "Rutin" | "Berjalan" | "Rencana"
    }>>()
    .notNull()
    .default([]),
  color: varchar("color", { length: 80 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// ─── Divisions ────────────────────────────────────────────────────────────────

export const divisions = pgTable("divisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  organizationalUnitId: uuid("organizational_unit_id").references(
    () => organizationalUnits.id,
    { onDelete: "set null" },
  ),
  periodId: uuid("period_id").references(() => periods.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// ─── Core Teams ──────────────────────────────────────────────────────────────
// Pengurus inti (BPH, Koordinator) — mirror organizational_units tapi独立.

export const coreTeams = pgTable("core_teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 60 }).notNull().default("Pengurus Inti"),
  description: text("description"),
  imageUrl: text("image_url"),
  workPrograms: jsonb("work_programs")
    .$type<Array<{
      name: string
      description: string
      status: "Rutin" | "Berjalan" | "Rencana"
    }>>()
    .notNull()
    .default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  periodId: uuid("period_id").references(() => periods.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// members.core_team_id → core_teams.id (FK dideklarasikan inline di tabel members).

// ─── Article Categories ───────────────────────────────────────────────────────

export const articleCategories = pgTable("article_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// ─── Articles ─────────────────────────────────────────────────────────────────

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 260 }).notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content").notNull(), // Tiptap JSONB format
    categoryId: uuid("category_id").references(() => articleCategories.id, {
      onDelete: "set null",
    }),
    status: articleStatus("status").notNull().default("draft"),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    authorName: varchar("author_name", { length: 160 }),
    reviewerId: uuid("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    organizationalUnitId: uuid("organizational_unit_id").references(
      () => organizationalUnits.id,
      { onDelete: "set null" },
    ),
    divisionId: uuid("division_id").references(() => divisions.id, {
      onDelete: "set null",
    }),
    periodId: uuid("period_id").references(() => periods.id, {
      onDelete: "set null",
    }),
    thumbnailUrl: text("thumbnail_url"),
    thumbnailAlt: text("thumbnail_alt"),
    seoTitle: varchar("seo_title", { length: 220 }),
    seoDescription: text("seo_description"),
    unitName: text("unit_name"),
    canonicalUrl: text("canonical_url"),
    ogImageUrl: text("og_image_url"),
    readTime: varchar("read_time", { length: 40 }),
    views: integer("views").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    rejectedNote: text("rejected_note"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("articles_slug_idx").on(table.slug),
    index("articles_public_feed_idx").on(table.status, table.deletedAt, table.publishedAt),
    index("articles_author_idx").on(table.authorId, table.deletedAt, table.updatedAt),
    index("articles_dashboard_sort_idx").on(table.deletedAt, table.updatedAt),
  ],
);

// ─── Assets ───────────────────────────────────────────────────────────────────
// Semua file upload terpusat di sini. image/* only, max 1 MB (global).

export const articleVersions = pgTable(
  "article_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    reason: varchar("reason", { length: 40 }).notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("article_versions_article_number_idx").on(
      table.articleId,
      table.versionNumber,
    ),
    index("article_versions_article_created_idx").on(
      table.articleId,
      table.createdAt,
    ),
  ],
);

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  fileName: varchar("file_name", { length: 260 }).notNull(),
  mimeType: varchar("mime_type", { length: 80 }).notNull(), // image/* only
  sizeBytes: integer("size_bytes").notNull(),               // max 1 MB = 1_048_576 bytes
  uploadedBy: uuid("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

// ─── Site Settings ────────────────────────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
});


// ─── Audit Logs ───────────────────────────────────────────────────────────────
// V1: backend logging only. Belum perlu halaman UI audit log.
//
// Events:
//   user.create | user.claim | user.disable
//   article.create | article.submit | article.approve | article.reject | article.archive
//   settings.update
//   export.data  → metadata: { exportedEntity, format, fileName }

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }),
    entityId: uuid("entity_id"),
    // untuk export.data: { exportedEntity, format, fileName }
    // untuk article events: { previousStatus, newStatus }
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("audit_logs_created_at_idx").on(table.createdAt)],
);
