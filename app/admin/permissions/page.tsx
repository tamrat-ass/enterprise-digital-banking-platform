'use client'

import React, { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { ErrorBoundary } from "@/lib/error-boundary"
import { ArrowLeft, Search, Loader, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Permission {
  id: string
  module: string
  permissionKey: string
  permissionName: string
  description: string | null
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rbac/permissions?groupBy=module', {
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch permissions')

      const data = await response.json()
      setPermissions(data.data || {})
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(key)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const allPermissions = Object.values(permissions).flat()
  const filteredPermissions = allPermissions.filter(p =>
    `${p.module}.${p.permissionKey}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  )

  const modules = Object.keys(permissions).sort()
  const totalPermissions = allPermissions.length

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      documents: 'from-blue-50 to-blue-100 border-blue-200',
      approvals: 'from-purple-50 to-purple-100 border-purple-200',
      reports: 'from-green-50 to-green-100 border-green-200',
      users: 'from-orange-50 to-orange-100 border-orange-200',
      audit: 'from-red-50 to-red-100 border-red-200',
      roles: 'from-indigo-50 to-indigo-100 border-indigo-200',
      categories: 'from-amber-50 to-amber-100 border-amber-200',
    }
    return colors[module] || 'from-gray-50 to-gray-100 border-gray-200'
  }

  return (
    <ErrorBoundary>
      <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: ['admin.view'] as any }}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg mt-1">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Permissions</h1>
              <p className="text-gray-600 mt-1">Browse all system permissions organized by module</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-600 text-sm font-semibold">Total Permissions</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{totalPermissions}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 text-sm font-semibold">Modules</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{modules.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-600 text-sm font-semibold">Actions</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">6</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search permissions by key or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Permissions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : searchTerm ? (
          <div className="space-y-2">
            {filteredPermissions.length === 0 ? (
              <div className="bg-white border border-[#E6E6E6] rounded-lg p-8 text-center">
                <p className="text-gray-600">No permissions found</p>
              </div>
            ) : (
              filteredPermissions.map(perm => (
                <div key={perm.id} className="bg-white border border-[#E6E6E6] rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-mono font-semibold text-gray-900">{perm.module}.{perm.permissionKey}</p>
                    <p className="text-gray-600 text-sm">{perm.permissionName}</p>
                    {perm.description && (
                      <p className="text-gray-500 text-xs mt-1">{perm.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700`}>
                      {perm.permissionKey}
                    </span>
                    <button
                      onClick={() => handleCopy(`${perm.module}.${perm.permissionKey}`)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      {copiedId === `${perm.module}.${perm.permissionKey}` ? (
                        <Check size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {modules.length === 0 ? (
              <div className="bg-white border border-[#E6E6E6] rounded-lg p-8 text-center">
                <p className="text-gray-600">No permissions found</p>
              </div>
            ) : (
              modules.map(module => (
                <div key={module} className={`bg-gradient-to-br ${getModuleColor(module)} border rounded-xl p-6`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                    {module} Module
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({permissions[module].length} permissions)
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions[module].map(perm => (
                      <div
                        key={perm.id}
                        className="bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => handleCopy(`${perm.module}.${perm.permissionKey}`)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-mono font-semibold text-gray-900 text-sm break-all group-hover:text-blue-600">
                            {perm.permissionKey}
                          </p>
                          {copiedId === `${perm.module}.${perm.permissionKey}` ? (
                            <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Copy size={16} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="text-gray-600 text-xs">{perm.permissionName}</p>
                        {perm.description && (
                          <p className="text-gray-500 text-xs mt-1">{perm.description}</p>
                        )}
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700`}>
                          {perm.permissionKey}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 mb-2">Permission Format</h3>
          <p className="text-indigo-800 text-sm mb-3">
            Permissions follow the format <code className="bg-indigo-100 px-2 py-1 rounded font-mono">module.permissionKey</code>
          </p>
          <p className="text-indigo-700 text-sm">
            Example: <code className="bg-indigo-100 px-2 py-1 rounded font-mono">documents.upload</code>, 
            <code className="bg-indigo-100 px-2 py-1 rounded font-mono ml-2">users.create</code>, 
            <code className="bg-indigo-100 px-2 py-1 rounded font-mono ml-2">audit.view</code>
          </p>
        </div>
      </div>
    </BankingLayout>
    </ErrorBoundary>
  )
}
