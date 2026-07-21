/**
 * Role-Based Access Control definitions for the platform.
 * Permissions are namespaced as `<module>.<action>`.
 */

export const MODULES = [
  "dashboard",
  "documents",
  "workflows",
  "approvals",
  "projects",
  "vendors",
  "contracts",
  "risk",
  "compliance",
  "users",
  "audit",
  "analytics",
  "roles",
  "categories",
  "reports",
] as const

export type ModuleKey = (typeof MODULES)[number]

export type Permission = `${ModuleKey}.${"view" | "create" | "edit" | "delete" | "approve" | "admin" | "update" | "upload" | "preview" | "download"}`

export type RoleKey =
  | "super_admin"
  | "executive"
  | "compliance_officer"
  | "auditor"
  | "department_head"
  | "staff"

export interface RoleDefinition {
  key: RoleKey
  name: string
  description: string
  level: number
  permissions: Permission[] | "*"
}

export const ROLES: Record<RoleKey, RoleDefinition> = {
  super_admin: {
    key: "super_admin",
    name: "Super Administrator",
    description: "Full unrestricted access to every module and configuration.",
    level: 100,
    permissions: "*",
  },
  executive: {
    key: "executive",
    name: "Executive",
    description: "Bank leadership. Read-heavy oversight across all modules plus approvals.",
    level: 90,
    permissions: [
      "dashboard.view",
      "documents.view",
      "workflows.view",
      "approvals.view",
      "approvals.approve",
      "projects.view",
      "vendors.view",
      "contracts.view",
      "risk.view",
      "compliance.view",
      "analytics.view",
      "audit.view",
    ],
  },
  compliance_officer: {
    key: "compliance_officer",
    name: "Compliance Officer",
    description: "Owns risk, compliance and policy governance across the bank.",
    level: 70,
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.create",
      "documents.edit",
      "approvals.view",
      "approvals.approve",
      "risk.view",
      "risk.create",
      "risk.edit",
      "compliance.view",
      "compliance.create",
      "compliance.edit",
      "vendors.view",
      "contracts.view",
      "analytics.view",
      "audit.view",
    ],
  },
  auditor: {
    key: "auditor",
    name: "Internal Auditor",
    description: "Read-only access plus full visibility into audit trails.",
    level: 60,
    permissions: [
      "dashboard.view",
      "documents.view",
      "workflows.view",
      "approvals.view",
      "projects.view",
      "vendors.view",
      "contracts.view",
      "risk.view",
      "compliance.view",
      "audit.view",
      "analytics.view",
    ],
  },
  department_head: {
    key: "department_head",
    name: "Department Head",
    description: "Manages a department's documents, projects and approvals.",
    level: 50,
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.create",
      "documents.edit",
      "approvals.view",
      "approvals.approve",
      "projects.view",
      "projects.create",
      "projects.edit",
      "vendors.view",
      "contracts.view",
      "risk.view",
    ],
  },
  staff: {
    key: "staff",
    name: "Staff Member",
    description: "Day-to-day contributor. Creates documents and submits requests.",
    level: 10,
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.create",
      "approvals.view",
      "projects.view",
    ],
  },
}

export function hasPermission(
  rolePermissions: Permission[] | undefined,
  permission: Permission,
): boolean {
  if (!rolePermissions) return false
  return rolePermissions.includes(permission)
}

export function canAccessModule(
  rolePermissions: Permission[] | undefined,
  moduleKey: ModuleKey,
): boolean {
  if (!rolePermissions) return false
  return rolePermissions.some((p) => p.startsWith(`${moduleKey}.`))
}
