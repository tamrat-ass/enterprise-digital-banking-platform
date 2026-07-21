'use client'

import { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { COLORS } from "@/lib/colors"
import {
  Search,
  Shield,
  Users,
  Lock,
  CheckCircle,
  Edit2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader,
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string | null
  userCount?: number
  permissionCount?: number
  isActive: boolean
  isSystem?: boolean
  abbreviation: string
  color: string
}

interface Permission {
  id: string
  module: string
  permissionKey: string
  permissionName: string
  description?: string | null
}

interface CurrentUser {
  id: string
  name: string
  email: string
  roleName: string
  departmentName: string | null
  department: string
  permissions?: string[] // ADD PERMISSIONS!
}

export default function AdminDashboard() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingChanges, setSavingChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchCurrentUser()
      await fetchData()
    }
    initializeDashboard()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/users/me', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentUser({
          ...data.data,
          department: data.data.departmentName || 'No Department',
        })
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      setCurrentUser({
        id: '',
        name: 'User',
        email: '',
        roleName: 'Staff Member',
        departmentName: null,
        department: 'No Department',
      })
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const rolesRes = await fetch('/api/rbac/roles', {
        credentials: 'include',
      })
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        const formattedRoles = (rolesData.data || []).map((role: any) => ({
          ...role,
          userCount: role.userCount || 0,
          permissionCount: role.permissionCount || 0,
          abbreviation: role.name.split(' ').map((w: string) => w[0]).join(''),
          color: getColorForRole(role.name),
        }))
        setRoles(formattedRoles)
        if (formattedRoles.length > 0) {
          setSelectedRole(formattedRoles[0])
          fetchRolePermissions(formattedRoles[0].id)
        }
      }

      const permsRes = await fetch('/api/rbac/permissions', {
        credentials: 'include',
      })
      if (permsRes.ok) {
        const permsData = await permsRes.json()
        setAllPermissions(permsData.data || [])
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const res = await fetch(`/api/rbac/roles/${roleId}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        const perms = data.data?.permissions || []
        setSelectedPermissions(new Set(perms.map((p: Permission) => p.id)))
      }
    } catch (err) {
      console.error('Failed to fetch role permissions:', err)
    }
  }

  const getColorForRole = (name: string): string => {
    const colors: { [key: string]: string } = {
      'Super Admin': COLORS.roles.superAdmin.badge,
      'System Admin': COLORS.roles.systemAdmin.badge,
      'Department Manager': COLORS.roles.departmentHead.badge,
      'Document Officer': COLORS.roles.documentOfficer.badge,
      'Approver': COLORS.roles.approver.badge,
      'Viewer': COLORS.roles.viewer.badge,
      'Auditor': COLORS.roles.auditor.badge,
    }
    return colors[name] || COLORS.roles.user.badge
  }

  const groupPermissionsByModule = (): Record<string, Permission[]> => {
    const grouped: Record<string, Permission[]> = {}
    allPermissions.forEach(perm => {
      // Skip departments module - not used in permission assignment
      if (perm.module === 'departments') return
      
      const module = perm.module.charAt(0).toUpperCase() + perm.module.slice(1)
      if (!grouped[module]) {
        grouped[module] = []
      }
      grouped[module].push(perm)
    })
    return grouped
  }

  // Sort modules with Dashboard first, then alphabetical
  const getSortedModules = (grouped: Record<string, Permission[]>): Array<[string, Permission[]]> => {
    const entries = Object.entries(grouped)
    // Sort: Dashboard first, then others alphabetically
    return entries.sort((a, b) => {
      if (a[0] === 'Dashboard') return -1
      if (b[0] === 'Dashboard') return 1
      return a[0].localeCompare(b[0])
    })
  }

  const togglePermission = (permissionId: string) => {
    const updated = new Set(selectedPermissions)
    if (updated.has(permissionId)) {
      updated.delete(permissionId)
    } else {
      updated.add(permissionId)
    }
    setSelectedPermissions(updated)
  }

  const toggleModulePermissions = (module: string, checked: boolean) => {
    const updated = new Set(selectedPermissions)
    const groupedPerms = groupPermissionsByModule()
    const modulePerms = (groupedPerms[module] || [])
    
    modulePerms.forEach(perm => {
      if (checked) {
        updated.add(perm.id)
      } else {
        updated.delete(perm.id)
      }
    })
    setSelectedPermissions(updated)
  }

  const isModuleChecked = (module: string): boolean => {
    const groupedPerms = groupPermissionsByModule()
    const modulePerms = (groupedPerms[module] || [])
    if (modulePerms.length === 0) return false
    return modulePerms.every(perm => selectedPermissions.has(perm.id))
  }

  const isModuleIndeterminate = (module: string): boolean => {
    const groupedPerms = groupPermissionsByModule()
    const modulePerms = (groupedPerms[module] || [])
    if (modulePerms.length === 0) return false
    const checked = modulePerms.some(perm => selectedPermissions.has(perm.id))
    const allChecked = modulePerms.every(perm => selectedPermissions.has(perm.id))
    return checked && !allChecked
  }

  const saveRoleChanges = async () => {
    if (!selectedRole) return

    try {
      setSavingChanges(true)
      const permissionIds = Array.from(selectedPermissions)
      
      const res = await fetch(`/api/rbac/roles/${selectedRole.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedRole.name,
          description: selectedRole.description,
          permissionIds,
        }),
      })

      if (res.ok) {
        await fetchData()
        setError(null)
        
        // Show success message
        alert(`✅ Role "${selectedRole.name}" updated successfully!\n\n⚠️ Users with this role will need to refresh their browser to see the new permissions.`)
      } else {
        setError('Failed to save role changes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSavingChanges(false)
    }
  }

  const deleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const res = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        await fetchData()
        setSelectedRole(null)
        setSelectedPermissions(new Set())
      } else {
        setError('Failed to delete role')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role')
    }
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = [
    { label: 'Total Roles', value: roles.length.toString(), icon: Shield, color: 'bg-blue-100' },
    { label: 'Total Users', value: roles.reduce((sum, r) => sum + (r.userCount || 0), 0).toString(), icon: Users, color: 'bg-green-100' },
    { label: 'Total Permissions', value: allPermissions.length.toString(), icon: Lock, color: 'bg-purple-100' },
    { label: 'Active Role Assignments', value: roles.reduce((sum, r) => sum + (r.userCount || 0) * (r.permissionCount || 0), 0).toString(), icon: CheckCircle, color: 'bg-amber-100' },
  ]

  const groupedPermissions = groupPermissionsByModule()

  if (error && !selectedRole) {
    return (
      <BankingLayout user={currentUser ? {
        name: currentUser.name,
        role: currentUser.roleName,
        department: currentUser.department,
        permissions: (currentUser.permissions || []) as any,
      } : {
        name: 'User',
        role: 'Staff Member',
        department: 'No Department',
        permissions: [] as any,
      }}>
        <div className={`p-6 ${COLORS.status.error.bg} border ${COLORS.status.error.border} rounded-lg ${COLORS.status.error.text}`}>
          Error: {error}
        </div>
      </BankingLayout>
    )
  }

  return (
    <BankingLayout user={currentUser ? {
      name: currentUser.name,
      role: currentUser.roleName,
      department: currentUser.department,
      permissions: (currentUser.permissions || []) as any,
    } : {
      name: 'User',
      role: 'Staff Member',
      department: 'No Department',
      permissions: [] as any,
    }}>
      <div className={`min-h-screen ${COLORS.background.page}`}>
        {/* Breadcrumb */}
        <div className={`px-6 py-4 text-sm ${COLORS.text.secondary}`}>
          <span>Home</span> <span className="mx-2">/</span>
          <span>User Management</span> <span className="mx-2">/</span>
          <span className={`${COLORS.text.light} font-medium`}>Roles & Permissions</span>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>Role & Permission Management</h1>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-4 gap-4 mb-8 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`${COLORS.background.card} rounded-lg p-4 h-24`}></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className={`${stat.color} rounded-lg p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${COLORS.text.secondary} text-sm`}>{stat.label}</p>
                        <p className={`text-2xl font-bold ${COLORS.text.primary} mt-1`}>{stat.value}</p>
                      </div>
                      <Icon className={`w-10 h-10 ${COLORS.icons.secondary}`} />
                    </div>
                    <p className={`${COLORS.text.secondary} text-xs mt-2`}>
                      {stat.label === 'Total Roles' && 'Active roles'}
                      {stat.label === 'Total Users' && 'Assigned users'}
                      {stat.label === 'Total Permissions' && 'System permissions'}
                      {stat.label === 'Active Role Assignments' && 'User role assignments'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tabs and Content */}
          <div className="flex gap-8">
            {/* Left Panel - Roles List */}
            <div className="flex-1">
              <div className={`${COLORS.background.card} rounded-lg`}>
                {/* Tabs */}
                <div className={`flex ${COLORS.border.bottom} px-6`}>
                  <button className={`py-4 px-4 border-b-2 border-blue-600 text-blue-600 font-medium`}>Roles</button>
                  <button className={`py-4 px-4 ${COLORS.text.secondary} font-medium`}>Permissions</button>
                </div>

                {/* Search and Create */}
                <div className={`px-6 py-4 ${COLORS.border.bottom} flex justify-between items-center gap-4`}>
                  <div className={`flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2 flex-1`}>
                    <Search className={`w-5 h-5 ${COLORS.icons.secondary}`} />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`bg-transparent outline-none flex-1 text-sm ${COLORS.text.primary}`}
                    />
                  </div>
                  <button className={`px-4 py-2 ${COLORS.button.primary} rounded-lg font-medium flex items-center gap-2`}>
                    <Plus size={18} />
                    Create Role
                  </button>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="p-6 text-center">
                    <Loader className={`w-8 h-8 animate-spin mx-auto ${COLORS.icons.primary}`} />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`${COLORS.border.bottom} bg-slate-50`}>
                            <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Role Name</th>
                            <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Users</th>
                            <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Permissions</th>
                            <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Status</th>
                            <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRoles.map((role) => (
                            <tr
                              key={role.id}
                              onClick={() => {
                                setSelectedRole(role)
                                fetchRolePermissions(role.id)
                              }}
                              className={`${COLORS.border.bottom} cursor-pointer hover:bg-slate-50 transition-colors ${
                                selectedRole?.id === role.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded ${role.color} flex items-center justify-center font-bold text-sm`}>
                                    {role.abbreviation}
                                  </div>
                                  <div>
                                    <p className={`font-semibold ${COLORS.text.primary}`}>{role.name}</p>
                                    <p className={`text-sm ${COLORS.text.secondary}`}>{role.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className={`px-6 py-4 text-center font-semibold ${COLORS.text.primary}`}>{role.userCount || 0}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1 ${COLORS.status.info.badge} px-3 py-1 rounded-full text-sm font-semibold`}>
                                  <Shield className="w-4 h-4" />
                                  {role.permissionCount || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-3 py-1 ${COLORS.status.success.badge} rounded-full text-xs font-semibold`}>
                                  Active
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button className={`p-2 hover:bg-slate-100 rounded ${COLORS.text.secondary} hover:text-blue-600 transition-colors`}>
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteRole(role.id)
                                    }}
                                    className={`p-2 hover:bg-slate-100 rounded ${COLORS.text.secondary} hover:text-red-600 transition-colors`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className={`px-6 py-4 ${COLORS.border.bottom} flex items-center justify-between text-sm ${COLORS.text.secondary}`}>
                      <span>Showing 1 to {filteredRoles.length} of {roles.length} roles</span>
                      <div className="flex gap-2">
                        <button className={`p-2 hover:bg-slate-100 rounded disabled:opacity-50`}>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className={`px-3 py-2 bg-blue-100 text-blue-600 rounded font-semibold text-xs`}>1</button>
                        <button className={`p-2 hover:bg-slate-100 rounded`}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel - Edit Role */}
            {selectedRole && (
              <div className={`w-96 ${COLORS.background.card} rounded-lg p-6 border ${COLORS.border.light} h-fit sticky top-6`}>
                <h2 className={`text-lg font-bold ${COLORS.text.primary} mb-2`}>Edit Role</h2>
                <p className={`${COLORS.text.secondary} text-sm mb-6`}>{selectedRole.name}</p>

                <div className={`flex gap-2 mb-6 ${COLORS.border.bottom}`}>
                  <button className={`px-4 py-2 ${COLORS.text.secondary} font-medium text-sm hover:text-blue-600`}>Role Details</button>
                  <button className={`px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium text-sm`}>Permissions</button>
                  <button className={`px-4 py-2 ${COLORS.text.secondary} font-medium text-sm hover:text-blue-600`}>Users ({selectedRole.userCount || 0})</button>
                </div>

                {/* Permissions Section */}
                <div>
                  <h3 className={`font-bold ${COLORS.text.primary} mb-4`}>Select Permissions</h3>

                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-sm ${COLORS.text.secondary}`}>
                      {selectedPermissions.size} selected
                    </span>
                    <div className="flex gap-2">
                      <button className="text-blue-600 text-sm font-medium hover:underline">Expand All</button>
                      <button className="text-blue-600 text-sm font-medium hover:underline">Collapse All</button>
                    </div>
                  </div>

                  {/* Permission List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(groupedPermissions).length > 0 ? (
                      getSortedModules(groupedPermissions).map(([module, perms]) => (
                        <div key={module}>
                          <label className={`flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer`}>
                            <input
                              type="checkbox"
                              checked={isModuleChecked(module)}
                              ref={(el) => {
                                if (el && isModuleIndeterminate(module)) {
                                  el.indeterminate = true
                                }
                              }}
                              onChange={(e) => toggleModulePermissions(module, e.target.checked)}
                              className="w-4 h-4 rounded"
                            />
                            <span className={`font-bold ${COLORS.text.primary} flex-1`}>{module}</span>
                            <span className={`text-xs ${COLORS.text.tertiary}`}>
                              {perms.filter(p => selectedPermissions.has(p.id)).length}/{perms.length}
                            </span>
                            <ChevronRight className={`w-4 h-4 ${COLORS.icons.secondary}`} />
                          </label>
                          <div className="ml-7 space-y-2">
                            {perms.map((perm) => (
                              <label key={perm.id} className={`flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer`}>
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="w-4 h-4 rounded"
                                />
                                <span className={`text-sm ${COLORS.text.secondary}`}>{perm.permissionName}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`${COLORS.text.secondary} text-sm`}>No permissions available</p>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className={`flex gap-3 mt-8 pt-6 ${COLORS.border.bottom}`}>
                  <button 
                    onClick={() => {
                      setSelectedRole(null)
                      setSelectedPermissions(new Set())
                    }}
                    className={`flex-1 px-4 py-2 border ${COLORS.border.light} rounded font-medium ${COLORS.text.secondary} hover:bg-slate-50`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveRoleChanges}
                    disabled={savingChanges}
                    className={`flex-1 px-4 py-2 ${COLORS.button.primary} rounded font-medium disabled:opacity-50`}
                  >
                    {savingChanges ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </BankingLayout>
  )
}
