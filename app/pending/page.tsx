import { BankingLayout } from "@/components/banking-layout"
import { ApprovalKanban } from "@/components/approval-kanban"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function PendingApprovalPage() {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-2">Documents awaiting your approval</p>
        </div>
        <ApprovalKanban />
      </div>
    </BankingLayout>
  )
}

