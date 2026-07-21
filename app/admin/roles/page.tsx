import { getCurrentUser, requireUser } from "@/lib/session"
import { BankingLayout } from "@/components/banking-layout"
import { RolesPageClient } from "./roles-client"

export default async function RolesPage() {
  // Server-side: Validate authentication and fetch user data
  await requireUser()
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const layoutUser = {
    name: user.name || "User",
    role: user.roleName || "Administrator",
    department: user.departmentName || "Administration",
    permissions: user.permissions || []
  }

  return (
    <BankingLayout user={layoutUser}>
      <RolesPageClient />
    </BankingLayout>
  )
}
