import { requireUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DocumentsClient } from "@/components/documents-client"

export default async function DocumentsPage() {
  const user = await requireUser()

  return (
    <DashboardLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <DocumentsClient />
    </DashboardLayout>
  )
}
