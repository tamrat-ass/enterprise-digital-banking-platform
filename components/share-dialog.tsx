'use client'

import React, { useState, useEffect } from 'react'
import { X, Users, Mail, Lock } from 'lucide-react'

interface ShareUser {
  id: string
  name: string
  email: string
}

interface SharePermission {
  userId: string
  permission: 'view' | 'download' | 'edit'
}

interface ShareDialogProps {
  fileId: string
  fileName: string
  isOpen: boolean
  onClose: () => void
  onShare: (permissions: SharePermission[]) => Promise<void>
}

export function ShareDialog({
  fileId,
  fileName,
  isOpen,
  onClose,
  onShare
}: ShareDialogProps) {
  const [users, setUsers] = useState<ShareUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Map<string, 'view' | 'download' | 'edit'>>(new Map())
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserToggle = (userId: string) => {
    const newSelected = new Map(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.set(userId, 'view')
    }
    setSelectedUsers(newSelected)
  }

  const handlePermissionChange = (userId: string, permission: 'view' | 'download' | 'edit') => {
    const newSelected = new Map(selectedUsers)
    newSelected.set(userId, permission)
    setSelectedUsers(newSelected)
  }

  const handleShare = async () => {
    try {
      setSharing(true)
      setError(null)

      const permissions: SharePermission[] = Array.from(selectedUsers.entries()).map(([userId, permission]) => ({
        userId,
        permission,
      }))

      await onShare(permissions)
      
      setSelectedUsers(new Map())
      setSearchTerm('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share file')
    } finally {
      setSharing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Share File</h2>
            <p className="text-sm text-gray-600 mt-1">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={sharing}
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <Users size={16} className="inline mr-2" />
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-500 py-4">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No users found</p>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedUsers.has(user.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      disabled={sharing}
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail size={14} />
                        {user.email}
                      </p>
                    </div>

                    {/* Permission Selector */}
                    {selectedUsers.has(user.id) && (
                      <select
                        value={selectedUsers.get(user.id) || 'view'}
                        onChange={(e) =>
                          handlePermissionChange(user.id, e.target.value as 'view' | 'download' | 'edit')
                        }
                        disabled={sharing}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="view">View</option>
                        <option value="download">Download</option>
                        <option value="edit">Edit</option>
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.size > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </p>
              <div className="mt-2 space-y-1">
                {Array.from(selectedUsers.entries()).map(([userId, permission]) => {
                  const user = users.find(u => u.id === userId)
                  return (
                    <p key={userId} className="text-sm text-gray-600">
                      {user?.name} - <span className="capitalize text-blue-600 font-semibold">{permission}</span>
                    </p>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            disabled={sharing}
            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={sharing || selectedUsers.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sharing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Lock size={18} />
                Share File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
