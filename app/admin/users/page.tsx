'use client'

import React, { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { ArrowLeft, Search, Users, Loader, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  currentRole?: string
}

interface Role {
  id: string
  name: string
  key: string
  level: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/rbac/roles', { credentials: 'include' }),
      ])

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRoles(rolesData.data || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data || [])
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return

    try {
      setAssigning(true)
      const response = await fetch('/api/rbac/user-roles', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, roleId: selectedRole }),
      })

      if (!response.ok) throw new Error('Failed to assign role')

      setSuccessMessage('Role assigned successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Reset selections
      setSelectedUser(null)
      setSelectedRole(null)

      // Refresh users
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setAssigning(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <h1 className="text-3xl font-bold text-gray-900">User Role Management</h1>
              <p className="text-gray-600 mt-1">Assign roles to users and control system access</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Assign Role Section */}
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Assign Role to User</h2>

          <div className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select User</label>
              <select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Role</label>
              <select
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a role...</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.key.includes('system') ? '(System)' : '(Custom)'} - Level {role.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAssignRole}
              disabled={!selectedUser || !selectedRole || assigning}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {assigning ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Role'
              )}
            </button>
          </div>
        </div>

        {/* Users List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Users</h2>
            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white border border-[#E6E6E6] rounded-lg p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No users found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white border border-[#E6E6E6] rounded-lg p-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-600 text-sm">{user.email}</p>
                      {user.currentRole && (
                        <p className="text-blue-600 text-xs mt-2 font-medium">
                          Current Role: {user.currentRole}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedUser(user.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedUser === user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Select a user from the list</li>
            <li>• Choose a role to assign</li>
            <li>• Click "Assign Role" to update permissions</li>
            <li>• Changes take effect immediately</li>
            <li>• Each user can have only one primary role</li>
          </ul>
        </div>
      </div>
    </BankingLayout>
  )
}
