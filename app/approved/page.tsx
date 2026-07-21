import { BankingLayout } from "@/components/banking-layout"
import { FileManagementTable } from "@/components/file-management-table"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function ApprovedFilesPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Approved Files</h1>
          <p className="text-gray-600 mt-2">Documents that have been approved</p>
        </div>
        <FileManagementTable />
      </div>
    </BankingLayout>
  )
}

