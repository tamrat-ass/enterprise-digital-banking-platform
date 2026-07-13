import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  numeric,
  date,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/* ---------------------------------------------------------------- */
/* Better Auth tables (do not rename columns)                       */
/* ---------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Organisation / RBAC                                              */
/* ---------------------------------------------------------------- */

export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  headName: text("head_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const divisions = pgTable("divisions", {
  id: text("id").primaryKey(),
  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  headName: text("head_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const documentCategories = pgTable("document_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6B4423"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(), // super_admin, executive, etc.
  description: text("description"),
  level: integer("level").notNull().default(1), // For hierarchy
  isSystem: boolean("is_system").notNull().default(false), // Can't be deleted
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(), // "documents:view", "documents:create", etc.
  name: text("name").notNull(),
  description: text("description"),
  module: text("module").notNull(), // "documents", "approvals", etc.
  action: text("action").notNull(), // "view", "create", "edit", "delete", etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const rolePermissions = pgTable("role_permissions", {
  id: text("id").primaryKey(),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const userRoles = pgTable("user_roles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: text("assigned_by"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
})

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  jobTitle: text("job_title"),
  departmentId: text("department_id"),
  divisionId: text("division_id"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Document Management                                              */
/* ---------------------------------------------------------------- */

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  departmentId: text("department_id"),
  divisionId: text("division_id"),
  status: text("status").notNull().default("draft"),
  currentVersion: integer("current_version").notNull().default(1),
  tags: jsonb("tags").notNull().default([]),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name"),
  accessLevel: text("access_level").notNull().default("internal"),
  expiryDate: date("expiry_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const documentVersions = pgTable("document_versions", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  version: integer("version").notNull(),
  changeNote: text("change_note"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  pdfPath: text("pdf_path"),  // Nullable, no explicit default
  authorId: text("author_id"),
  authorName: text("author_name"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),  // Use SQL function, not defaultNow()
})

export const documentShares = pgTable("document_shares", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull(),
  userId: text("user_id").notNull(),
  permission: text("permission").notNull().default("view"),
  sharedBy: text("shared_by"),
  sharedAt: timestamp("shared_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Workflow & Approvals                                             */
/* ---------------------------------------------------------------- */

export const workflows = pgTable("workflows", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  entityType: text("entity_type").notNull(),
  steps: jsonb("steps").notNull().default([]),
  slaHours: integer("sla_hours"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const approvalRequests = pgTable("approval_requests", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id"),
  title: text("title").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  currentStep: integer("current_step").notNull().default(1),
  totalSteps: integer("total_steps").notNull().default(1),
  status: text("status").notNull().default("pending"),
  requestedBy: text("requested_by"),
  requestedByName: text("requested_by_name"),
  assigneeName: text("assignee_name"),
  priority: text("priority").notNull().default("medium"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Projects                                                         */
/* ---------------------------------------------------------------- */

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  departmentId: text("department_id"),
  status: text("status").notNull().default("planning"),
  priority: text("priority").notNull().default("medium"),
  progress: integer("progress").notNull().default(0),
  budget: numeric("budget"),
  spent: numeric("spent").default("0"),
  ownerName: text("owner_name"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  riskLevel: text("risk_level").default("low"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Vendors & Contracts                                              */
/* ---------------------------------------------------------------- */

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("active"),
  riskScore: integer("risk_score").default(0),
  riskRating: text("risk_rating").default("low"),
  dueDiligenceStatus: text("due_diligence_status").default("pending"),
  performanceScore: integer("performance_score"),
  contractValue: numeric("contract_value"),
  onboardedDate: date("onboarded_date"),
  renewalDate: date("renewal_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const contracts = pgTable("contracts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  counterparty: text("counterparty"),
  vendorId: text("vendor_id"),
  type: text("type"),
  status: text("status").notNull().default("draft"),
  value: numeric("value"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  autoRenew: boolean("auto_renew").default(false),
  ownerName: text("owner_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Risk & Compliance                                                */
/* ---------------------------------------------------------------- */

export const risks = pgTable("risks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  departmentId: text("department_id"),
  likelihood: integer("likelihood").default(1),
  impact: integer("impact").default(1),
  severity: text("severity").default("low"),
  status: text("status").notNull().default("open"),
  ownerName: text("owner_name"),
  control: text("control"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const complianceItems = pgTable("compliance_items", {
  id: text("id").primaryKey(),
  framework: text("framework").notNull(),
  controlRef: text("control_ref"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not_assessed"),
  ownerName: text("owner_name"),
  lastReviewed: date("last_reviewed"),
  nextReview: date("next_review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/* ---------------------------------------------------------------- */
/* Notifications & Audit                                            */
/* ---------------------------------------------------------------- */

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("userId"),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").default("info"),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("userId"),
  actorName: text("actor_name"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  module: text("module"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
