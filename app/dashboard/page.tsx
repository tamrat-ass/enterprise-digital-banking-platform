import { BankingLayout } from "@/components/banking-layout"
import { BankingDashboard } from "@/components/banking-dashboard"
import { getCurrentUser, requireUser } from "@/lib/session"

export default async function DashboardPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <BankingDashboard />
    </BankingLayout>
  )
}
