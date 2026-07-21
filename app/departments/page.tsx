import { BankingLayout } from "@/components/banking-layout"
import { DepartmentsManager } from "@/components/departments-manager"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function DepartmentsPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  if (!user.permissions || user.permissions.length === 0) {
    redirect('/no-access')
  }

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration",
      permissions: user.permissions
    }}>
      <DepartmentsManager />
    </BankingLayout>
  )
}

