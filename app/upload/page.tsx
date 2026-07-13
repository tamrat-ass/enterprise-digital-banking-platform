import { BankingLayout } from "@/components/banking-layout"
import { FileUploadFormWrapper } from "@/components/file-upload-wrapper"
import { getCurrentUser, requireUser } from "@/lib/session"

export default async function UploadPage() {
  await requireUser()
  const user = await getCurrentUser()
  if (!user) return null

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <FileUploadFormWrapper />
    </BankingLayout>
  )
}
