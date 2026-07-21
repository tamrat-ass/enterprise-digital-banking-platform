import { BankingLayout } from "@/components/banking-layout"
import { BankingDashboard } from "@/components/banking-dashboard"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  // Allow dashboard access if user has ANY permission
  // (dashboard is a general overview, not a restricted feature)
  // Specific dashboard sections can have their own permission checks
  if (!user.permissions || user.permissions.length === 0) {
    redirect('/no-access')
  }

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration",
      permissions: user.permissions || [] // PASS PERMISSIONS TO BANKINGLAYOUT!
    }}>
      <BankingDashboard />
    </BankingLayout>
  )
}
