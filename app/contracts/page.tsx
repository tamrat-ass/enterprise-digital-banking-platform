import { requireUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ContractsClient } from "@/components/contracts-client"

export default async function ContractsPage() {
  const user = await requireUser()

  return (
    <DashboardLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <ContractsClient />
    </DashboardLayout>
  )
}
