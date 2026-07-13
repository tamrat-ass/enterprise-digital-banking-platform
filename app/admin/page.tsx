'use client'

import React, { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { Settings, Users, Lock, BarChart3, ArrowRight, Loader } from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalRoles: number
  totalPermissions: number
  systemRoles: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/rbac/roles', { credentials: 'include' }),
        fetch('/api/rbac/permissions', { credentials: 'include' }),
      ])

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error('Failed to fetch stats')
      }

      const rolesData = await rolesRes.json()
      const permsData = await permsRes.json()

      const roles = rolesData.data || []
      const systemRoles = roles.filter((r: any) => r.isSystem).length

      setStats({
        totalRoles: roles.length,
        totalPermissions: (permsData.data || []).length,
        systemRoles,
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System' }}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600 mt-2">Manage roles, permissions, and user access control</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Roles */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-semibold">Total Roles</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats?.totalRoles}</p>
                  <p className="text-blue-700 text-xs mt-2">{stats?.systemRoles} system roles</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* System Roles */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-semibold">System Roles</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats?.systemRoles}</p>
                  <p className="text-purple-700 text-xs mt-2">Protected & immutable</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-600 text-sm font-semibold">Permissions</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats?.totalPermissions}</p>
                  <p className="text-green-700 text-xs mt-2">Total available</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Custom Roles */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-semibold">Custom Roles</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">{(stats?.totalRoles || 0) - (stats?.systemRoles || 0)}</p>
                  <p className="text-orange-700 text-xs mt-2">User-created</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Roles Management Card */}
          <Link href="/admin/roles" className="group">
            <div className="relative bg-white rounded-2xl shadow-sm border border-[#E6E6E6] p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden h-full">
              {/* Background accent */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors shadow-sm">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">MANAGE</span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Roles</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">Create, edit, and manage system roles. Define role hierarchies and assign permissions to control access across your platform.</p>

                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all duration-300">
                  <span>View All Roles</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Permissions Card */}
          <Link href="/admin/permissions" className="group">
            <div className="relative bg-white rounded-2xl shadow-sm border border-[#E6E6E6] p-8 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden h-full">
              {/* Background accent */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-green-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center group-hover:from-green-100 group-hover:to-green-200 transition-colors shadow-sm">
                    <Settings className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">VIEW</span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Permissions</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">Browse all available permissions organized by module. Understand exactly what each permission controls in your system.</p>

                <div className="flex items-center text-green-600 font-semibold group-hover:gap-3 transition-all duration-300">
                  <span>View All Permissions</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Users Card */}
          <Link href="/admin/users" className="group">
            <div className="relative bg-white rounded-2xl shadow-sm border border-[#E6E6E6] p-8 hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden h-full">
              {/* Background accent */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-purple-100 group-hover:to-purple-200 transition-colors shadow-sm">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">ASSIGN</span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">Users</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">Assign and manage user roles. Control who has access to what, and update permissions in real-time as organizational needs change.</p>

                <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all duration-300">
                  <span>Manage Users</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2">Getting Started</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• View all roles and permissions</li>
                  <li>• Assign roles to users</li>
                  <li>• Create custom roles for your needs</li>
                  <li>• System roles are protected</li>
                </ul>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-purple-900 mb-2">System Architecture</h4>
                <p className="text-purple-800 text-sm">This RBAC system uses database-backed roles and permissions. Changes take effect immediately. System roles cannot be deleted or modified.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BankingLayout>
  )
}
