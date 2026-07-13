'use client'

import React, { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Role {
  id: string
  name: string
  key: string
  description: string
  level: number
  isSystem: boolean
  isActive: boolean
  permissions: Array<{
    id: string
    key: string
    name: string
    module: string
    action: string
  }>
}

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rbac/roles', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data = await response.json()
      setRoles(data.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System' }}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          </div>
          <div className="bg-white border border-[#E6E6E6] rounded-2xl p-8 text-center">
            <p className="text-gray-600">Loading roles...</p>
          </div>
        </div>
      </BankingLayout>
    )
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
              <p className="text-gray-600 mt-1">Manage system roles and their permissions</p>
            </div>
          </div>
          <Link href="/admin/roles/create" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus size={20} />
            New Role
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Roles Grid */}
        <div className="grid gap-4">
          {roles.length === 0 ? (
            <div className="bg-white border border-[#E6E6E6] rounded-2xl p-8 text-center">
              <p className="text-gray-600">No roles found</p>
            </div>
          ) : (
            roles.map(role => (
              <div key={role.id} className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          System
                        </span>
                      )}
                      {!role.isActive && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 5).map(perm => (
                        <span key={perm.id} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {perm.module}:{perm.action}
                        </span>
                      ))}
                      {role.permissions.length > 5 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{role.permissions.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/admin/roles/${role.id}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                      <Edit2 size={20} />
                    </Link>
                    {!role.isSystem && (
                      <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </BankingLayout>
  )
}
