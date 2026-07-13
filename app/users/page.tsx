import { BankingLayout } from "@/components/banking-layout"
import { getCurrentUser, requireUser } from "@/lib/session"

export default async function UsersPage() {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage system users</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-600">Users management interface coming soon</p>
        </div>
      </div>
    </BankingLayout>
  )
}
