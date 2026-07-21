import { z } from "zod"

/**
 * Shared validation schemas for the platform
 */

/* ================================================================ */
/* Documents                                                        */
/* ================================================================ */

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().nullable().default(null),
  category: z.string().min(1, "Category is required"),
  departmentId: z.string().optional(),
  accessLevel: z.enum(["internal", "restricted", "public"]).default("internal"),
  tags: z.array(z.string()).default([]),
  expiryDate: z.string().datetime().optional(),
})

export const updateDocumentSchema = createDocumentSchema.partial()

export const documentFilterSchema = z.object({
  category: z.string().optional(),
  status: z.enum(["draft", "approved", "archived"]).optional(),
  departmentId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  uploadedBy: z.string().optional(), // Filter by user who uploaded the document
})

/* ================================================================ */
/* Approvals & Workflows                                            */
/* ================================================================ */

export const createApprovalRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  entityType: z.enum([
    "document",
    "contract",
    "policy",
    "budget",
    "vendor",
    "project",
  ]),
  entityId: z.string(),
  workflowId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().datetime().optional(),
})

export const approveRequestSchema = z.object({
  approvalId: z.string(),
  comment: z.string().optional(),
  approve: z.boolean(),
})

export const approvalFilterSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  entityType: z.string().optional(),
  assignedToMe: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
})

/* ================================================================ */
/* Projects                                                         */
/* ================================================================ */

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  departmentId: z.string(),
  status: z
    .enum(["planning", "active", "on_hold", "completed", "cancelled"])
    .default("planning"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).default("low"),
})

export const updateProjectSchema = createProjectSchema.partial()

export const projectFilterSchema = z.object({
  status: z.string().optional(),
  departmentId: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
})

/* ================================================================ */
/* Vendors & Contracts                                              */
/* ================================================================ */

export const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  category: z.string().min(1, "Category is required"),
  contactEmail: z.string().email().optional(),
  status: z.enum(["active", "inactive", "under_review"]).default("active"),
  dueDiligenceStatus: z
    .enum(["pending", "in_progress", "completed"])
    .default("pending"),
  riskScore: z.number().min(0).max(100).optional(),
  riskRating: z
    .enum(["low", "medium", "high", "critical"])
    .default("medium"),
  contractValue: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  onboardedDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
})

export const updateVendorSchema = createVendorSchema.partial()

export const vendorFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  riskRating: z.string().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
})

export const createContractSchema = z.object({
  title: z.string().min(1, "Contract title is required"),
  counterparty: z.string().min(1, "Counterparty is required"),
  vendorId: z.string().optional(),
  type: z.enum([
    "service",
    "procurement",
    "employment",
    "licensing",
    "other",
  ]),
  value: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().default(false),
  status: z.enum(["draft", "active", "expired", "terminated"]).default("draft"),
})

export const updateContractSchema = createContractSchema.partial()

/* ================================================================ */
/* Risk & Compliance                                                */
/* ================================================================ */

export const createRiskSchema = z.object({
  title: z.string().min(1, "Risk title is required"),
  description: z.string().optional(),
  category: z.enum([
    "operational",
    "credit",
    "market",
    "liquidity",
    "regulatory",
    "reputational",
  ]),
  departmentId: z.string().optional(),
  likelihood: z.number().min(1).max(5).default(3),
  impact: z.number().min(1).max(5).default(3),
  status: z.enum(["open", "mitigated", "resolved", "monitored"]).default("open"),
  control: z.string().optional(),
})

export const updateRiskSchema = createRiskSchema.partial()

export const createComplianceItemSchema = z.object({
  framework: z.string().min(1, "Framework is required"),
  controlRef: z.string().min(1, "Control reference is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z
    .enum([
      "not_assessed",
      "compliant",
      "non_compliant",
      "partial",
      "remediation",
    ])
    .default("not_assessed"),
  ownerName: z.string().optional(),
  nextReview: z.string().datetime().optional(),
})

export const updateComplianceItemSchema = createComplianceItemSchema.partial()

/* ================================================================ */
/* Users & Permissions                                              */
/* ================================================================ */

export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
})

export const userFilterSchema = z.object({
  departmentId: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
})

/* ================================================================ */
/* Generic Helpers                                                  */
/* ================================================================ */

export const paginationSchema = z.object({
  page: z.number().default(1).catch(1),
  limit: z.number().default(20).catch(20),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type DocumentFilters = z.infer<typeof documentFilterSchema>

export type CreateApprovalInput = z.infer<typeof createApprovalRequestSchema>
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>
export type ApprovalFilters = z.infer<typeof approvalFilterSchema>

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectFilters = z.infer<typeof projectFilterSchema>

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
export type VendorFilters = z.infer<typeof vendorFilterSchema>

export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>

export type CreateRiskInput = z.infer<typeof createRiskSchema>
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>

export type CreateComplianceInput = z.infer<typeof createComplianceItemSchema>
export type UpdateComplianceInput = z.infer<typeof updateComplianceItemSchema>
