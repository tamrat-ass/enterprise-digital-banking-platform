'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { COLORS } from '@/lib/colors'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Loader,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string | null
  userCount?: number
  permissionCount?: number
  isActive: boolean
  isSystem?: boolean
  permissions: any[]
  permissionIds?: string[]
}

interface Permission {
  id: string
  name?: string
  permissionName?: string
  module: string
  description?: string
}

export function RolesPageClient() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [creatingRole, setCreatingRole] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [permissionsByModule, setPermissionsByModule] = useState<Record<string, Permission[]>>({})

  const stats = [
    { label: 'Total Roles', value: roles.length.toString(), icon: Shield, color: 'bg-blue-100' },
    { label: 'Total Users', value: roles.reduce((sum, r) => sum + (r.userCount || 0), 0).toString(), icon: Users, color: 'bg-green-100' },
    { label: 'Total Permissions', value: permissions.length.toString(), icon: Shield, color: 'bg-purple-100' },
    { label: 'Active Assignments', value: roles.reduce((sum, r) => sum + (r.userCount || 0), 0).toString(), icon: Shield, color: 'bg-amber-100' },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const rolesRes = await fetch('/api/rbac/roles', { credentials: 'include' })
      if (!rolesRes.ok) throw new Error('Failed to fetch roles')
      const rolesData = await rolesRes.json()

      const permsRes = await fetch('/api/rbac/permissions', { credentials: 'include' })
      if (!permsRes.ok) throw new Error('Failed to fetch permissions')
      const permsData = await permsRes.json()

      setRoles(rolesData.data || [])
      
      let flatPermissions: Permission[] = []
      let permsByModule: Record<string, Permission[]> = {}

      if (permsData.data) {
        if (typeof permsData.data === 'object' && !Array.isArray(permsData.data)) {
          Object.entries(permsData.data).forEach(([module, modulePerms]: [string, any]) => {
            if (Array.isArray(modulePerms)) {
              permsByModule[module] = modulePerms
              flatPermissions = flatPermissions.concat(modulePerms)
            }
          })
        } else if (Array.isArray(permsData.data)) {
          flatPermissions = permsData.data
          // Group flat permissions by module
          flatPermissions.forEach(perm => {
            const mod = perm.module || 'Other'
            if (!permsByModule[mod]) permsByModule[mod] = []
            permsByModule[mod].push(perm)
          })
        }
      }
      
      setPermissions(flatPermissions)
      setPermissionsByModule(permsByModule)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const [editingRole, setEditingRole] = useState<Role | null>(null)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 py-6">
        <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>Roles & Permissions Management</h1>
        <p className={`${COLORS.text.secondary} mt-2`}>Manage system roles and assign permissions</p>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4 mb-6">
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
            </div>
          )
        })}
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className={`text-lg font-medium ${COLORS.text.primary}`}>Loading roles...</p>
          </div>
        </div>
      ) : (
        <div className="px-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className={`flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2 flex-1 max-w-md`}>
              <Search className={`w-5 h-5 ${COLORS.icons.secondary}`} />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-transparent outline-none flex-1 text-sm ${COLORS.text.primary}`}
              />
            </div>
            <button
              onClick={() => {
                setShowCreateModal(true)
                setCreateForm({ name: '', description: '' })
              }}
              className={`px-4 py-2 ${COLORS.button.primary} rounded-lg font-medium flex items-center gap-2`}
            >
              <Plus size={18} />
              Create Role
            </button>
          </div>

          {/* Roles List */}
          <div className={`${COLORS.background.card} rounded-lg`}>
            {roles.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className={`w-12 h-12 ${COLORS.icons.secondary} mx-auto mb-4`} />
                <p className={`text-lg font-semibold ${COLORS.text.primary}`}>No roles found</p>
                <p className={`${COLORS.text.secondary} mt-2`}>Create a new role to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${COLORS.border.bottom} bg-slate-50`}>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Role Name</th>
                      <th className={`px-6 py-3 text-center text-xs font-semibold ${COLORS.text.primary}`}>Users</th>
                      <th className={`px-6 py-3 text-center text-xs font-semibold ${COLORS.text.primary}`}>Permissions</th>
                      <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Description</th>
                      <th className={`px-6 py-3 text-center text-xs font-semibold ${COLORS.text.primary}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles
                      .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(role => (
                        <tr key={role.id} className={`${COLORS.border.bottom} hover:bg-slate-50 transition-colors`}>
                          <td className={`px-6 py-4 font-semibold ${COLORS.text.primary}`}>{role.name}</td>
                          <td className={`px-6 py-4 text-center ${COLORS.text.primary}`}>{role.userCount || 0}</td>
                          <td className={`px-6 py-4 text-center ${COLORS.text.primary}`}>{role.permissionCount || 0}</td>
                          <td className={`px-6 py-4 text-sm ${COLORS.text.secondary}`}>{role.description || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedRoleId(role.id)
                                  setEditingRoleId(role.id)
                                  setEditingRole(role)
                                  setEditForm({ name: role.name, description: role.description || '' })
                                  setSelectedPermissions(new Set(role.permissionIds || []))
                                  setShowEditModal(true)
                                }}
                                className={`p-2 hover:bg-slate-100 rounded ${COLORS.text.secondary} hover:text-blue-600 transition-colors`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this role?')) {
                                    handleDeleteRole(role.id)
                                  }
                                }}
                                disabled={deletingRoleId === role.id}
                                className={`p-2 hover:bg-slate-100 rounded ${COLORS.text.secondary} hover:text-red-600 transition-colors disabled:opacity-50`}
                              >
                                {deletingRoleId === role.id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${COLORS.background.card} rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`flex justify-between items-center p-6 ${COLORS.border.bottom}`}>
              <h2 className={`text-2xl font-bold ${COLORS.text.primary}`}>Create New Role</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ name: '', description: '' })
                  setSelectedPermissions(new Set())
                }}
                className={`p-1 hover:bg-slate-100 rounded ${COLORS.text.secondary}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleCreateRole} className="p-6 space-y-6">
              {/* Role Name */}
              <div>
                <label className={`block text-sm font-semibold ${COLORS.text.primary} mb-2`}>
                  Role Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Manager, Auditor, Administrator"
                  className={`w-full px-4 py-2 border ${COLORS.border.standard} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${COLORS.text.primary}`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-semibold ${COLORS.text.primary} mb-2`}>
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe the purpose of this role..."
                  rows={3}
                  className={`w-full px-4 py-2 border ${COLORS.border.standard} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${COLORS.text.primary}`}
                />
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-semibold ${COLORS.text.primary}`}>Assign Permissions</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(new Set(permissions.map(p => p.id)))}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(new Set())}
                      className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Permissions by Module */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(permissionsByModule).length === 0 ? (
                    <p className={`text-sm ${COLORS.text.secondary}`}>No permissions available</p>
                  ) : (
                    Object.entries(permissionsByModule).map(([module, perms]) => (
                      <div key={module} className={`border ${COLORS.border.standard} rounded-lg`}>
                        <button
                          type="button"
                          onClick={() => {
                            const newExpanded = new Set(expandedModules)
                            if (newExpanded.has(module)) {
                              newExpanded.delete(module)
                            } else {
                              newExpanded.add(module)
                            }
                            setExpandedModules(newExpanded)
                          }}
                          className={`w-full flex items-center justify-between p-3 hover:bg-slate-50`}
                        >
                          <div className="flex items-center gap-3">
                            {expandedModules.has(module) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span className={`font-semibold ${COLORS.text.primary}`}>{module}</span>
                            <span className={`text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded`}>
                              {perms.filter(p => selectedPermissions.has(p.id)).length}/{perms.length}
                            </span>
                          </div>
                        </button>

                        {expandedModules.has(module) && (
                          <div className={`p-3 space-y-2 border-t ${COLORS.border.standard} bg-slate-50`}>
                            {perms.map(perm => (
                              <label key={perm.id} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(perm.id)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedPermissions)
                                    if (e.target.checked) {
                                      newSelected.add(perm.id)
                                    } else {
                                      newSelected.delete(perm.id)
                                    }
                                    setSelectedPermissions(newSelected)
                                  }}
                                  className="w-4 h-4 cursor-pointer accent-blue-600"
                                />
                                <div>
                                  <p className={`text-sm font-medium ${COLORS.text.primary}`}>
                                    {perm.permissionName || perm.name || perm.id}
                                  </p>
                                  {perm.description && (
                                    <p className={`text-xs ${COLORS.text.secondary}`}>{perm.description}</p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex gap-3 pt-4 border-t ${COLORS.border.standard}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm({ name: '', description: '' })
                    setSelectedPermissions(new Set())
                  }}
                  className={`flex-1 px-4 py-2 border ${COLORS.border.standard} rounded-lg font-medium ${COLORS.text.primary} hover:bg-slate-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole || !createForm.name.trim()}
                  className={`flex-1 px-4 py-2 ${COLORS.button.primary} rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {creatingRole ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${COLORS.background.card} rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`flex justify-between items-center p-6 ${COLORS.border.bottom}`}>
              <h2 className={`text-2xl font-bold ${COLORS.text.primary}`}>Edit Role</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingRoleId(null)
                  setEditingRole(null)
                  setEditForm({ name: '', description: '' })
                  setSelectedPermissions(new Set())
                }}
                className={`p-1 hover:bg-slate-100 rounded ${COLORS.text.secondary}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleEditRole} className="p-6 space-y-6">
              {/* System Role Warning */}
              {editingRole?.isSystem && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">System Role</p>
                    <p className="text-sm text-blue-800">This is a system role. You can edit the name, description, and permissions.</p>
                  </div>
                </div>
              )}

              {/* Role Name */}
              <div>
                <label className={`block text-sm font-semibold ${COLORS.text.primary} mb-2`}>
                  Role Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Manager, Auditor, Administrator"
                  className={`w-full px-4 py-2 border ${COLORS.border.standard} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${COLORS.text.primary}`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-semibold ${COLORS.text.primary} mb-2`}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Describe the purpose of this role..."
                  rows={3}
                  className={`w-full px-4 py-2 border ${COLORS.border.standard} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${COLORS.text.primary}`}
                />
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-semibold ${COLORS.text.primary}`}>Assign Permissions</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(new Set(permissions.map(p => p.id)))}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(new Set())}
                      className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Permissions by Module */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(permissionsByModule).length === 0 ? (
                    <p className={`text-sm ${COLORS.text.secondary}`}>No permissions available</p>
                  ) : (
                    Object.entries(permissionsByModule).map(([module, perms]) => (
                      <div key={module} className={`border ${COLORS.border.standard} rounded-lg`}>
                        <button
                          type="button"
                          onClick={() => {
                            const newExpanded = new Set(expandedModules)
                            if (newExpanded.has(module)) {
                              newExpanded.delete(module)
                            } else {
                              newExpanded.add(module)
                            }
                            setExpandedModules(newExpanded)
                          }}
                          className={`w-full flex items-center justify-between p-3 hover:bg-slate-50`}
                        >
                          <div className="flex items-center gap-3">
                            {expandedModules.has(module) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span className={`font-semibold ${COLORS.text.primary}`}>{module}</span>
                            <span className={`text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded`}>
                              {perms.filter(p => selectedPermissions.has(p.id)).length}/{perms.length}
                            </span>
                          </div>
                        </button>

                        {expandedModules.has(module) && (
                          <div className={`p-3 space-y-2 border-t ${COLORS.border.standard} bg-slate-50`}>
                            {perms.map(perm => (
                              <label key={perm.id} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(perm.id)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedPermissions)
                                    if (e.target.checked) {
                                      newSelected.add(perm.id)
                                    } else {
                                      newSelected.delete(perm.id)
                                    }
                                    setSelectedPermissions(newSelected)
                                  }}
                                  className="w-4 h-4 cursor-pointer accent-blue-600"
                                />
                                <div>
                                  <p className={`text-sm font-medium ${COLORS.text.primary}`}>
                                    {perm.permissionName || perm.name || perm.id}
                                  </p>
                                  {perm.description && (
                                    <p className={`text-xs ${COLORS.text.secondary}`}>{perm.description}</p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex gap-3 pt-4 border-t ${COLORS.border.standard}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingRoleId(null)
                    setEditForm({ name: '', description: '' })
                    setSelectedPermissions(new Set())
                  }}
                  className={`flex-1 px-4 py-2 border ${COLORS.border.standard} rounded-lg font-medium ${COLORS.text.primary} hover:bg-slate-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole || !editForm.name.trim()}
                  className={`flex-1 px-4 py-2 ${COLORS.button.primary} rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {creatingRole ? <Loader className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  async function handleDeleteRole(roleId: string) {
    try {
      setDeletingRoleId(roleId)
      const res = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete role')
      await fetchData()
      setSuccessMessage('Role deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeletingRoleId(null)
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.name.trim()) {
      setError('Role name is required')
      return
    }

    try {
      setCreatingRole(true)
      setError(null)

      const res = await fetch('/api/rbac/roles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          permissionIds: Array.from(selectedPermissions),
        }),
      })

      if (!res.ok) throw new Error('Failed to create role')

      await fetchData()
      setShowCreateModal(false)
      setCreateForm({ name: '', description: '' })
      setSelectedPermissions(new Set())
      setSuccessMessage('Role created successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role')
    } finally {
      setCreatingRole(false)
    }
  }

  async function handleEditRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRoleId || !editForm.name.trim()) {
      setError('Role name is required')
      return
    }

    try {
      setCreatingRole(true)
      setError(null)

      // Build request body - include permissions for all roles now
      const body: any = {
        name: editForm.name,
        description: editForm.description,
        permissionIds: Array.from(selectedPermissions),
      }

      const res = await fetch(`/api/rbac/roles/${editingRoleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to update role')

      await fetchData()
      setShowEditModal(false)
      setEditingRoleId(null)
      setEditingRole(null)
      setEditForm({ name: '', description: '' })
      setSelectedPermissions(new Set())
      setSuccessMessage('Role updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setCreatingRole(false)
    }
  }
}
