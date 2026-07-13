import { NextRequest } from "next/server"
import {
  DocumentService,
  ProjectService,
  VendorService,
  ApprovalService,
  RiskService,
  ComplianceService,
} from "@/lib/services"
import {
  requirePermission,
  successResponse,
  withErrorHandling,
} from "@/lib/api-utils"

/**
 * GET /api/stats
 * Get overall dashboard statistics
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, user } = await requirePermission(req, "dashboard:view")
  if (error) return error

  const [
    docStats,
    projectStats,
    vendorStats,
    approvalStats,
    riskStats,
    complianceStats,
  ] = await Promise.all([
    DocumentService.getDocumentStats(),
    ProjectService.getProjectStats(),
    VendorService.getVendorStats(),
    ApprovalService.getApprovalStats(),
    RiskService.getRiskStats(),
    ComplianceService.getComplianceStats(),
  ])

  return successResponse({
    documents: docStats,
    projects: projectStats,
    vendors: vendorStats,
    approvals: approvalStats,
    risks: riskStats,
    compliance: complianceStats,
  })
})
