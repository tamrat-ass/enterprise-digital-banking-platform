import { BankingLayout } from "@/components/banking-layout"
import { CategoriesManager } from "@/components/categories-manager"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function CategoriesPage() {
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
      <div className="space-y-6">
        <CategoriesManager />
      </div>
    </BankingLayout>
  )
}

