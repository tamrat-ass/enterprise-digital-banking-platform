'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BankingLayout } from "@/components/banking-layout"
import { ArrowLeft, Save, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import Link from 'next/link'

interface Permission {
  id: string
  module: string
  permissionKey: string
  permissionName: string
  description: string | null
}

interface Role {
  id: string
  name: string
  description: string
  isSystem: boolean
  isActive: boolean
  permissions: Permission[]
  permissionCount: number
  userCount: number
}

interface PermissionsByModule {
  [module: string]: Permission[]
}

export default function EditRolePage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.id as string

  const [role, setRole] = useState<Role | null>(null)
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [userPermissions, setUserPermissions] = useState<string[]>([]) // Add user permissions

  useEffect(() => {
    fetchData()
    // Fetch current user's permissions
    fetchCurrentUserPermissions()
  }, [])

  const fetchCurrentUserPermissions = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUserPermissions(data.data?.permissions || [])
      }
    } catch (err) {
      console.error('Failed to fetch current user permissions:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [roleRes, permsRes] = await Promise.all([
        fetch(`/api/rbac/roles/${roleId}`, { credentials: 'include' }),
        fetch('/api/rbac/permissions', { credentials: 'include' }),
      ])

      if (!roleRes.ok) throw new Error('Failed to fetch role')
      if (!permsRes.ok) throw new Error('Failed to fetch permissions')

      const roleData = await roleRes.json()
      const permsData = await permsRes.json()

      setRole(roleData.data)
      setRoleName(roleData.data.name)
      setRoleDescription(roleData.data.description || '')

      // Group permissions by module
      const grouped: PermissionsByModule = {}
      for (const perm of permsData.data || []) {
        if (!grouped[perm.module]) {
          grouped[perm.module] = []
        }
        grouped[perm.module].push(perm)
      }
      setPermissionsByModule(grouped)

      // Set selected permissions
      const selected = new Set(roleData.data.permissions.map((p: Permission) => p.id))
      setSelectedPermissions(selected)

      // Expand all modules by default
      setExpandedModules(new Set(Object.keys(grouped)))
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(module)) {
      newExpanded.delete(module)
    } else {
      newExpanded.add(module)
    }
    setExpandedModules(newExpanded)
  }

  const toggleAllPermissions = () => {
    if (selectedPermissions.size === getTotalPermissions()) {
      setSelectedPermissions(new Set())
    } else {
      const allPerms = new Set<string>()
      Object.values(permissionsByModule).forEach(perms => {
        perms.forEach(p => allPerms.add(p.id))
      })
      setSelectedPermissions(allPerms)
    }
  }

  const getTotalPermissions = () => {
    return Object.values(permissionsByModule).reduce((sum, perms) => sum + perms.length, 0)
  }

  const handleSave = async () => {
    if (!role) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const response = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissionIds: Array.from(selectedPermissions),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update role')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.push('/admin/roles')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: (userPermissions.length > 0 ? userPermissions : ['admin.view']) as any }}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </BankingLayout>
    )
  }

  if (!role) {
    return (
      <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: (userPermissions.length > 0 ? userPermissions : ['admin.view']) as any }}>
        <div className="space-y-4">
          <Link href="/admin/roles" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft size={20} />
            Back to Roles
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            Role not found
          </div>
        </div>
      </BankingLayout>
    )
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: (userPermissions.length > 0 ? userPermissions : ['admin.view']) as any }}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/admin/roles" className="p-2 hover:bg-gray-100 rounded-lg mt-1">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
            <p className="text-gray-600 mt-1">Manage role details and assign permissions</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            Role updated successfully! Redirecting...
          </div>
        )}

        {role.isSystem && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-700">
            <Lock size={20} />
            This is a system role. You can edit all details including permissions.
          </div>
        )}

        {/* Role Details */}
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Role Details</h2>

          <div className="space-y-6">
            {/* Role Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={role.isSystem}
              />
            </div>

            {/* Role Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={role.isSystem}
              />
            </div>
          </div>
        </div>

        {/* Permission Assignment */}
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Permissions</h2>
              <p className="text-gray-600 text-sm mt-1">
                {selectedPermissions.size} of {getTotalPermissions()} permissions selected
              </p>
            </div>
            <button
              onClick={toggleAllPermissions}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              {selectedPermissions.size === getTotalPermissions() ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Permissions by Module */}
          <div className="space-y-4">
            {Object.keys(permissionsByModule).sort().map((module) => (
              <div key={module} className="border border-gray-200 rounded-lg">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-semibold text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg capitalize">{module}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {permissionsByModule[module].filter(p => selectedPermissions.has(p.id)).length}/{permissionsByModule[module].length}
                    </span>
                  </div>
                  <span className={`transform transition-transform ${expandedModules.has(module) ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Module Permissions */}
                {expandedModules.has(module) && (
                  <div className="px-4 py-4 bg-white border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionsByModule[module].map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{perm.permissionName}</p>
                          {perm.description && (
                            <p className="text-gray-600 text-xs mt-1">{perm.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/admin/roles"
            className="flex-1 px-6 py-3 border border-[#E6E6E6] text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white px-6 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </BankingLayout>
  )
}
