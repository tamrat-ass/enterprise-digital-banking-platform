import { BankingLayout } from "@/components/banking-layout"
import { CategoriesManager } from "@/components/categories-manager"
import { getCurrentUser, requireUser } from "@/lib/session"

export default async function CategoriesPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <div className="space-y-6">
        <CategoriesManager />
      </div>
    </BankingLayout>
  )
}
