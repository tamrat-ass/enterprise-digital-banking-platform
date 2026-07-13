import { requireUser } from "@/lib/session"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProjectsClient } from "@/components/projects-client"

export default async function ProjectsPage() {
  const user = await requireUser()

  return (
    <DashboardLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <ProjectsClient />
    </DashboardLayout>
  )
}
