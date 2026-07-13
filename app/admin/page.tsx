import { BankingLayout } from "@/components/banking-layout"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const user = await requireUser()
  
  // Only super_admin can access this page
  if (user.roleKey !== "super_admin") {
    redirect("/dashboard")
  }

  return (
    <BankingLayout user={{
      name: user.name,
      role: user.roleName,
      department: user.departmentName || "Administration"
    }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">Manage system roles, permissions, and user assignments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roles Management */}
          <a href="/admin/roles" className="block">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Roles</h3>
              <p className="text-gray-600 text-sm mt-2">Create and manage system roles</p>
            </div>
          </a>

          {/* Permissions Management */}
          <a href="/admin/permissions" className="block">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Permissions</h3>
              <p className="text-gray-600 text-sm mt-2">Manage system permissions</p>
            </div>
          </a>

          {/* User Assignments */}
          <a href="/admin/users" className="block">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E6E6E6] p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">User Roles</h3>
              <p className="text-gray-600 text-sm mt-2">Assign roles to users</p>
            </div>
          </a>
        </div>
      </div>
    </BankingLayout>
  )
}
