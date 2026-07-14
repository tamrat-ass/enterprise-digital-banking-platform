import { BankingLayout } from "@/components/banking-layout"
import { getCurrentUser, requireUser } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function RolesPage() {
  const user = await requireUser()

  if (!user) return null

  // If user is super_admin, redirect to admin interface
  if (user.roleKey === "super_admin") {
    redirect("/admin/roles")
  }

  return (
    <BankingLayout user={{
      name: user.name || "User",
      role: user.roleName || "Administrator",
      department: user.departmentName || "Administration"
    }}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-2">View your role and assigned permissions</p>
        </div>

        {/* Current Role Section */}
        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-[#E6E6E6]">
            <h2 className="text-xl font-bold text-gray-900">Your Role</h2>
          </div>
          
          <div className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{user.roleName}</h3>
                <p className="text-gray-600 mt-2 text-sm">
                  Role Key: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{user.roleKey}</span>
                </p>
                <p className="text-gray-700 mt-4">
                  You have <span className="font-bold text-blue-600">{user.permissions?.length || 0}</span> permissions assigned to your role.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        <div className="bg-white rounded-xl border border-[#E6E6E6] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-[#E6E6E6]">
            <h2 className="text-xl font-bold text-gray-900">Your Permissions</h2>
          </div>

          <div className="p-8">
            {user.permissions && user.permissions.length > 0 ? (
              <div className="grid gap-4">
                {user.permissions.map((permission, index) => {
                  const [module, action] = permission.split(":")
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-gray-900">{permission}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="capitalize font-medium">{module}</span>: {action} permission
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No permissions assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Access */}
        {user.roleKey === "super_admin" && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900 mb-2">Administration Access</h3>
                <p className="text-purple-800 text-sm mb-4">
                  As a Super Administrator, you have full access to the RBAC management interface.
                </p>
                <Link 
                  href="/admin" 
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Go to Admin Panel
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">About Roles & Permissions</h3>
          <p className="text-blue-800 text-sm">
            Your role determines which features you can access throughout the application. 
            Each permission follows the format <code className="bg-blue-100 px-2 py-1 rounded font-mono">module:action</code> 
            (e.g., documents:view, approvals:approve). 
            {user.roleKey === "super_admin" && 
              " As a Super Administrator, you can manage all roles and permissions from the admin panel."
            }
          </p>
        </div>
      </div>
    </BankingLayout>
  )
}
