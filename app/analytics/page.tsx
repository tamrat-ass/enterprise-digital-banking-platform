import { requireUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsClient } from "@/components/analytics-client"

export default async function AnalyticsPage() {
  const user = await requireUser()

  return (
    <DashboardLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <AnalyticsClient />
    </DashboardLayout>
  )
}
