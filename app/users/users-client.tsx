'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { COLORS } from '@/lib/colors'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  Lock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader,
  X,
  AlertCircle,
  CheckCircle2,
  Key,
} from 'lucide-react'

// Types
interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'invited' | 'disabled'
  roles: UserRole[]
}

interface UserRole {
  id: string
  roleId: string
  roleName: string
}

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
  permissionIds?: string[]
}

interface AddUserForm {
  name: string
  email: string
  roles: string[]
}

interface EditUserForm {
  name: string
  status: 'active' | 'invited' | 'disabled'
  roleId: string
}

// Helper: Get role color
function getRoleColor(roleName: string): string {
  const colorMap: Record<string, string> = {
    'Super Admin': 'bg-blue-100',
    'System Admin': 'bg-indigo-100',
    'Executive': 'bg-purple-100',
    'Department Head': 'bg-emerald-100',
    'Compliance Officer': 'bg-violet-100',
    'Auditor': 'bg-rose-100',
    'Approver': 'bg-cyan-100',
    'Document Officer': 'bg-orange-100',
    'Staff': 'bg-green-100',
    'Viewer': 'bg-slate-100',
  }
  return colorMap[roleName] || 'bg-slate-100'
}

// Helper: Validate email
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Helper: Get available roles for a user (those not already assigned)
function getAvailableRoles(allRoles: Role[], userRoles: UserRole[]): Role[] {
  const assignedRoleIds = new Set(userRoles.map((ur) => ur.roleId))
  return allRoles.filter((r) => !assignedRoleIds.has(r.id))
}

// Helper: Filter users by search and filters
function filterUsers(users: User[], searchTerm: string, statusFilter: string): User[] {
  return users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })
}

// Main Component
export function UsersPageClient() {
  // State: Data
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // State: UI
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited' | 'disabled'>('all')

  // State: Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // State: Form data
  const [addUserForm, setAddUserForm] = useState<AddUserForm>({ name: '', email: '', roles: [] })
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({ name: '', status: 'active', roleId: '' })
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' })

  // State: Loading operations
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingUser, setUpdatingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState(false)

  // Effect: Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Fetch users and roles
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch users
      const usersRes = await fetch('/api/users', { credentials: 'include' })
      if (!usersRes.ok) throw new Error('Failed to fetch users')
      const usersData = await usersRes.json()

      // Fetch roles
      const rolesRes = await fetch('/api/rbac/roles', { credentials: 'include' })
      if (!rolesRes.ok) throw new Error('Failed to fetch roles')
      const rolesData = await rolesRes.json()

      const formattedRoles = (rolesData.data || []).map((role: any) => ({
        ...role,
      }))

      setUsers(usersData.data || [])
      setRoles(formattedRoles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Handlers: User operations
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!addUserForm.name.trim() || !addUserForm.email.trim()) {
      setError('Name and email are required')
      return
    }

    if (!validateEmail(addUserForm.email)) {
      setError('Invalid email format')
      return
    }

    if (!addUserForm.roles || addUserForm.roles.length === 0) {
      setError('Please select a role for the user')
      return
    }

    try {
      setCreatingUser(true)
      setError(null)

      // Step 1: Create the user
      const createRes = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addUserForm.name, email: addUserForm.email }),
      })

      if (!createRes.ok) throw new Error('Failed to create user')
      const userData = await createRes.json()
      const newUserId = userData.data.id

      // Step 2: Assign the selected role to the user
      if (newUserId && addUserForm.roles[0]) {
        const roleRes = await fetch(`/api/rbac/user-roles`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: newUserId,
            roleId: addUserForm.roles[0],
          }),
        })

        if (!roleRes.ok) {
          console.warn('Failed to assign role to user, but user was created')
        } else {
          console.log('[Add User] Role assigned successfully, refreshing session...')
          // Refresh session to pick up new permissions
          try {
            const refreshRes = await fetch('/api/auth/refresh-session', {
              method: 'POST',
              credentials: 'include',
            })
            const refreshData = await refreshRes.json()
            if (refreshData.requiresReload) {
              // Reload page to pick up new permissions
              console.log('[Add User] Reloading page to apply new permissions...')
              setTimeout(() => window.location.reload(), 1000)
            }
          } catch (refreshErr) {
            console.warn('Session refresh failed, user may need to sign out and back in:', refreshErr)
          }
        }
      }

      await fetchData()
      setShowAddUserModal(false)
      setAddUserForm({ name: '', email: '', roles: [] })
      setSuccessMessage('User created successfully and role assigned')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser || !editUserForm.name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setUpdatingUser(true)
      setError(null)

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUserForm.name,
          status: editUserForm.status,
        }),
      })

      if (!res.ok) throw new Error('Failed to update user')

      // If a new role is selected and different from current role, assign it
      if (editUserForm.roleId) {
        const currentRoleId = selectedUser.roles && selectedUser.roles.length > 0 ? selectedUser.roles[0].roleId : null
        
        // If role is different from current, assign the new role
        if (editUserForm.roleId !== currentRoleId) {
          // First remove old role if exists
          if (currentRoleId) {
            await fetch(`/api/rbac/user-roles/${selectedUser.id}/${currentRoleId}`, {
              method: 'DELETE',
              credentials: 'include',
            })
          }

          // Then assign new role
          const roleRes = await fetch(`/api/rbac/user-roles`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: selectedUser.id,
              roleId: editUserForm.roleId,
            }),
          })

          if (!roleRes.ok) {
            console.warn('Failed to assign role, but user was updated')
          } else {
            console.log('[Edit User] Role assigned successfully, refreshing session...')
            // Refresh session to pick up new permissions
            try {
              const refreshRes = await fetch('/api/auth/refresh-session', {
                method: 'POST',
                credentials: 'include',
              })
              const refreshData = await refreshRes.json()
              if (refreshData.requiresReload) {
                // Reload page to pick up new permissions
                console.log('[Edit User] Reloading page to apply new permissions...')
                setTimeout(() => window.location.reload(), 1000)
              }
            } catch (refreshErr) {
              console.warn('Session refresh failed, user may need to sign out and back in:', refreshErr)
            }
          }
        }
      }

      await fetchData()
      setShowEditUserModal(false)
      setSelectedUser(null)
      setEditUserForm({ name: '', status: 'active', roleId: '' })
      setSuccessMessage(`User updated successfully. ${editUserForm.roleId ? 'Please refresh the page for new permissions to take effect.' : ''}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setUpdatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setDeletingUserId(userId)
      setError(null)

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to delete user')

      await fetchData()
      setSuccessMessage('User deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) return

    if (!resetPasswordForm.password.trim()) {
      setError('Password is required')
      return
    }

    if (resetPasswordForm.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(resetPasswordForm.password)
    const hasLowercase = /[a-z]/.test(resetPasswordForm.password)
    const hasNumber = /\d/.test(resetPasswordForm.password)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(resetPasswordForm.password)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, number, and special character')
      return
    }

    try {
      setResettingPassword(true)
      setError(null)

      console.log('[Frontend] Reset Password - Sending password:', resetPasswordForm.password)
      console.log('[Frontend] Reset Password - Password length:', resetPasswordForm.password.length)

      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          password: resetPasswordForm.password,
        }),
      })

      if (!res.ok) throw new Error('Failed to reset password')

      console.log('[Frontend] Reset Password - Success response received')
      await fetchData()
      setShowResetPasswordModal(false)
      setSelectedUser(null)
      setResetPasswordForm({ password: '', confirmPassword: '' })
      setSuccessMessage('Password reset successfully for ' + selectedUser.name)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  // Computed
  const filteredUsers = filterUsers(users, searchTerm, statusFilter)
  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: Users, color: 'bg-blue-100' },
    { label: 'Active Users', value: users.filter((u) => u.status === 'active').length.toString(), icon: CheckCircle, color: 'bg-green-100' },
    { label: 'Total Roles', value: roles.length.toString(), icon: Users, color: 'bg-purple-100' },
    { label: 'Pending Invitations', value: users.filter((u) => u.status === 'invited').length.toString(), icon: Lock, color: 'bg-amber-100' },
  ]

  // Render
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className={`text-lg font-medium ${COLORS.text.primary}`}>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 py-6">
        <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>User Management</h1>
        <p className={`${COLORS.text.secondary} mt-2`}>Manage users, assign roles, and control access</p>
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

      {/* Stats */}
      <div className={`px-6 py-4 grid grid-cols-4 gap-4`}>
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

      {/* Users Section */}
      <div className={`${COLORS.background.card} rounded-lg m-6`}>
        {/* Search and Filter */}
        <div className={`px-6 py-4 ${COLORS.border.bottom} flex justify-between items-center gap-4`}>
          <div className="flex gap-4 flex-1">
            <div className={`flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2 flex-1`}>
              <Search className={`w-5 h-5 ${COLORS.icons.secondary}`} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-transparent outline-none flex-1 text-sm ${COLORS.text.primary}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className={`px-4 py-2 ${COLORS.button.primary} rounded-lg font-medium flex items-center gap-2`}
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${COLORS.border.bottom} bg-slate-50`}>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Name</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Email</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Roles</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${COLORS.text.primary}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${COLORS.text.secondary}`}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className={`${COLORS.border.bottom} hover:bg-slate-50 transition-colors`}>
                      <td className={`px-6 py-4 font-semibold ${COLORS.text.primary}`}>{user.name}</td>
                      <td className={`px-6 py-4 ${COLORS.text.secondary} text-sm`}>{user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {user.roles.length === 0 ? (
                            <span className={`text-xs ${COLORS.text.tertiary}`}>No roles</span>
                          ) : (
                            user.roles.map((role) => (
                              <span
                                key={role.roleId}
                                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRoleColor(role.roleName)} text-slate-700`}
                              >
                                {role.roleName}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'active'
                              ? COLORS.status.success.badge
                              : user.status === 'invited'
                              ? COLORS.status.info.badge
                              : COLORS.status.error.badge
                          }`}
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 relative">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setResetPasswordForm({ password: '', confirmPassword: '' })
                              setShowResetPasswordModal(true)
                            }}
                            className={`p-2 hover:bg-slate-100 rounded transition-colors ${COLORS.text.secondary} hover:text-yellow-600`}
                            title="Reset password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              const currentRoleId = user.roles && user.roles.length > 0 ? user.roles[0].roleId : ''
                              setEditUserForm({ name: user.name, status: user.status, roleId: currentRoleId })
                              setShowEditUserModal(true)
                            }}
                            className={`p-2 hover:bg-slate-100 rounded transition-colors ${COLORS.text.secondary} hover:text-blue-600`}
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className={`p-2 hover:bg-slate-100 rounded transition-colors ${COLORS.text.secondary} hover:text-red-600 disabled:opacity-50`}
                            title="Delete user"
                          >
                            {deletingUserId === user.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className={`${COLORS.background.card} rounded-lg p-6 w-full max-w-md`}>
            <h2 className={`text-xl font-bold ${COLORS.text.primary} mb-4`}>Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={addUserForm.name}
                  onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary}`}
                  placeholder="Ahadu staff"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary}`}
                  placeholder="ahadustaff@ahadubank.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Select Role <span className="text-red-600">*</span>
                </label>
                <select
                  value={addUserForm.roles[0] || ''}
                  onChange={(e) => setAddUserForm({ ...addUserForm, roles: e.target.value ? [e.target.value] : [] })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary} bg-white`}
                >
                  <option value="">-- Select a role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={`flex-1 px-4 py-2 border ${COLORS.border.light} rounded font-medium ${COLORS.text.secondary} hover:bg-slate-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className={`flex-1 px-4 py-2 ${COLORS.button.primary} rounded font-medium disabled:opacity-50`}
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className={`${COLORS.background.card} rounded-lg p-6 w-full max-w-md`}>
            <h2 className={`text-xl font-bold ${COLORS.text.primary} mb-4`}>Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Status
                </label>
                <select
                  value={editUserForm.status}
                  onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary} bg-white`}
                >
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Assign Role
                </label>
                <select
                  value={editUserForm.roleId}
                  onChange={(e) => setEditUserForm({ ...editUserForm, roleId: e.target.value })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary} bg-white`}
                >
                  <option value="">-- No Role --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false)
                    setSelectedUser(null)
                  }}
                  className={`flex-1 px-4 py-2 border ${COLORS.border.light} rounded font-medium ${COLORS.text.secondary} hover:bg-slate-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className={`flex-1 px-4 py-2 ${COLORS.button.primary} rounded font-medium disabled:opacity-50`}
                >
                  {updatingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className={`${COLORS.background.card} rounded-lg p-6 w-full max-w-md`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${COLORS.text.primary}`}>Reset Password</h2>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setSelectedUser(null)
                  setResetPasswordForm({ password: '', confirmPassword: '' })
                }}
                className={`p-1 hover:bg-slate-100 rounded ${COLORS.text.secondary}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm ${COLORS.text.secondary} mb-4`}>Set new password for <span className="font-semibold">{selectedUser.name}</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  New Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.password}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, password: e.target.value })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary}`}
                  placeholder="Min 8 chars, uppercase, lowercase, number, special"
                />
                <p className={`text-xs ${COLORS.text.secondary} mt-1`}>
                  Must contain: uppercase, lowercase, number, special character
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${COLORS.text.primary} mb-1`}>
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                  className={`w-full px-3 py-2 border ${COLORS.border.light} rounded-lg ${COLORS.text.primary}`}
                  placeholder="Re-enter password"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false)
                    setSelectedUser(null)
                    setResetPasswordForm({ password: '', confirmPassword: '' })
                  }}
                  className={`flex-1 px-4 py-2 border ${COLORS.border.light} rounded font-medium ${COLORS.text.secondary} hover:bg-slate-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className={`flex-1 px-4 py-2 ${COLORS.button.primary} rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {resettingPassword ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
