import { requireUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RisksClient } from "@/components/risks-client"

export default async function RisksPage() {
  const user = await requireUser()

  return (
    <DashboardLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <RisksClient />
    </DashboardLayout>
  )
}
