import { requireUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ComplianceClient } from "@/components/compliance-client"

export default async function CompliancePage() {
  const user = await requireUser()


  return (
    <DashboardLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <ComplianceClient />
    </DashboardLayout>
  )
}
