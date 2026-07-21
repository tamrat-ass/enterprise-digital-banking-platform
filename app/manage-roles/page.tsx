import { getCurrentUser, requireUser } from "@/lib/session"
import { BankingLayout } from "@/components/banking-layout"
import { RolesPageClient } from "./roles-page-client"
import { redirect } from "next/navigation"

export default async function ManageRolesPage() {
  // Server-side: Validate authentication and fetch user data
  await requireUser()
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  if (!user.permissions || user.permissions.length === 0) {
    redirect('/no-access')
  }

  const layoutUser = {
    name: user.name || "User",
    role: user.roleName || "Administrator",
    department: user.departmentName || "Administration",
    permissions: user.permissions
  }

  return (
    <BankingLayout user={layoutUser}>
      <RolesPageClient />
    </BankingLayout>
  )
}
