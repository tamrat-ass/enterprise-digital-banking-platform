'use client'

import React, { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { ArrowLeft, Plus, Edit2, Trash2, Search, Filter, ChevronDown, Lock, Shield } from 'lucide-react'
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

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all')

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    filterRoles()
  }, [roles, searchTerm, filterType])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rbac/roles', { credentials: 'include' })

      if (!response.ok) throw new Error('Failed to fetch roles')

      const data = await response.json()
      setRoles(data.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const filterRoles = () => {
    let filtered = roles

    if (filterType === 'system') {
      filtered = filtered.filter(r => r.isSystem)
    } else if (filterType === 'custom') {
      filtered = filtered.filter(r => !r.isSystem)
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRoles(filtered)
  }

  const getRoleLevelColor = (level: number) => {
    if (level >= 80) return 'bg-red-50 border-red-200'
    if (level >= 50) return 'bg-blue-50 border-blue-200'
    if (level >= 20) return 'bg-green-50 border-green-200'
    return 'bg-gray-50 border-gray-200'
  }

  const getRoleLevelBadgeColor = (level: number) => {
    if (level >= 80) return 'bg-red-100 text-red-700'
    if (level >= 50) return 'bg-blue-100 text-blue-700'
    if (level >= 20) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System' }}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg mt-1">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
              <p className="text-gray-600 mt-1">Create and manage system roles with granular permissions</p>
            </div>
          </div>
          <Link href="/admin/roles/create" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
            <Plus size={20} />
            Create Role
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles by name or key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'system', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Roles List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No roles found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                className={`border rounded-xl p-6 transition-all hover:shadow-md ${getRoleLevelColor(role.level)}`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {/* Title & Badges */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Lock size={12} />
                          System
                        </span>
                      )}
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleLevelBadgeColor(role.level)}`}>
                        Level {role.level}
                      </span>
                      {!role.isActive && (
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4">{role.description || 'No description'}</p>

                    {/* Key & Permissions */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {role.key}
                        </span>
                      </div>

                      {/* Permission Tags */}
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.slice(0, 8).map((perm) => (
                          <span
                            key={perm.id}
                            className="px-2.5 py-1 bg-white bg-opacity-60 text-gray-700 text-xs font-medium rounded-full border border-gray-200 hover:bg-opacity-100 transition-all"
                          >
                            {perm.module}:<span className="font-semibold">{perm.action}</span>
                          </span>
                        ))}
                        {role.permissions.length > 8 && (
                          <span className="px-2.5 py-1 bg-white bg-opacity-60 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                            +{role.permissions.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/roles/${role.id}`}
                      className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
                      title="Edit role"
                    >
                      <Edit2 size={20} />
                    </Link>
                    {!role.isSystem && (
                      <button
                        className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete role"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">System Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.filter(r => r.isSystem).length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Custom Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.filter(r => !r.isSystem).length}</p>
            </div>
          </div>
        </div>
      </div>
    </BankingLayout>
  )
}
