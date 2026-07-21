import { BankingLayout } from "@/components/banking-layout"
import { MyFilesTable } from "@/components/my-files-table"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function MyFilesPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
          <p className="text-gray-600 mt-2">Your personal documents and files</p>
        </div>
        <MyFilesTable />
      </div>
    </BankingLayout>
  )
}

