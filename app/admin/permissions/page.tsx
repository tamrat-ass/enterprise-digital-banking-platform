'use client'

import React, { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Permission {
  id: string
  key: string
  name: string
  module: string
  action: string
}

export default function PermissionsManagementPage() {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rbac/permissions?groupBy=module', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }

      const data = await response.json()
      setPermissions(data.data || {})
      setError(null)
    } catch (err) {
      console.error('Error fetching permissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
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
            <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
          </div>
          <div className="bg-white border border-[#E6E6E6] rounded-2xl p-8 text-center">
            <p className="text-gray-600">Loading permissions...</p>
          </div>
        </div>
      </BankingLayout>
    )
  }

  const modules = Object.keys(permissions).sort()

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
            <p className="text-gray-600 mt-1">System permissions organized by module</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Permissions by Module */}
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="bg-white border border-[#E6E6E6] rounded-2xl p-8 text-center">
              <p className="text-gray-600">No permissions found</p>
            </div>
          ) : (
            modules.map(module => (
              <div key={module} className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  {module} Module
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions[module].map(perm => (
                    <div key={perm.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-semibold text-gray-900 text-sm">{perm.key}</div>
                      <div className="text-gray-600 text-xs mt-1">{perm.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
          <p className="text-blue-800 text-sm">
            Total Modules: <span className="font-semibold">{modules.length}</span> • 
            Total Permissions: <span className="font-semibold">{Object.values(permissions).flat().length}</span>
          </p>
        </div>
      </div>
    </BankingLayout>
  )
}
