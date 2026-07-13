import { BankingLayout } from "@/components/banking-layout"
import { DepartmentsManager } from "@/components/departments-manager"
import { getCurrentUser, requireUser } from "@/lib/session"

export default async function DepartmentsPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <DepartmentsManager />
    </BankingLayout>
  )
}
