import { BankingLayout } from "@/components/banking-layout"
import { ApprovalKanban } from "@/components/approval-kanban"
import { getCurrentUser, requireUser } from "@/lib/session"

export default async function ApprovalsPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <ApprovalKanban />
    </BankingLayout>
  )
}
