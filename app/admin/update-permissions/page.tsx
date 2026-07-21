'use client'

import { useState } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface UpdateStatus {
  status: 'idle' | 'updating' | 'success' | 'error'
  message: string
  added?: {
    permissions: number
    rolePermissions: number
  }
  totals?: {
    totalPermissions: number
    totalRolePermissions: number
  }
  error?: string
}

export default function UpdatePermissionsPage() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    status: 'idle',
    message: 'Click "Update Permissions" to add any missing dashboard permissions',
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpdatePermissions = async () => {
    try {
      setIsProcessing(true)
      setUpdateStatus({
        status: 'updating',
        message: 'Updating permissions...',
      })

      const response = await fetch('/api/admin/update-permissions', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUpdateStatus({
          status: 'success',
          message: `✅ Permissions updated successfully!`,
          added: data.added,
          totals: data.totals,
        })
      } else {
        setUpdateStatus({
          status: 'error',
          message: '❌ Failed to update permissions',
          error: data.message || 'Unknown error',
        })
      }
    } catch (err) {
      setUpdateStatus({
        status: 'error',
        message: '❌ Error updating permissions',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: ['admin.view'] as any }}>
      <div className="max-w-2xl mx-auto py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Update Permissions</h1>
            <p className="text-gray-600 mt-2">
              Add missing dashboard and other permissions to the system
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">What this does:</h2>
            <ul className="text-blue-800 space-y-2">
              <li>✓ Adds missing dashboard permissions (create, edit, delete, admin)</li>
              <li>✓ Ensures all roles have correct permissions</li>
              <li>✓ Safe to run multiple times (uses conflict detection)</li>
              <li>✓ Preserves existing permissions and role assignments</li>
            </ul>
          </div>

          {/* Status Messages */}
          {updateStatus.status === 'updating' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-blue-900 font-medium">{updateStatus.message}</span>
            </div>
          )}

          {updateStatus.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-green-900 font-medium">{updateStatus.message}</span>
              </div>
              {updateStatus.added && (
                <div className="text-green-800 space-y-2 ml-9">
                  <p>• Added {updateStatus.added.permissions} new permissions</p>
                  <p>• Updated {updateStatus.added.rolePermissions} role-permission mappings</p>
                </div>
              )}
              {updateStatus.totals && (
                <div className="text-green-800 space-y-2 ml-9 mt-4 pt-4 border-t border-green-300">
                  <p><strong>Total permissions in system:</strong> {updateStatus.totals.totalPermissions}</p>
                  <p><strong>Total role assignments:</strong> {updateStatus.totals.totalRolePermissions}</p>
                </div>
              )}
              <div className="mt-4 text-sm text-green-700">
                ℹ️ Dashboard permissions are now available! Go to /admin/dashboard to assign them to roles.
              </div>
            </div>
          )}

          {updateStatus.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <span className="text-red-900 font-medium">{updateStatus.message}</span>
              </div>
              {updateStatus.error && (
                <p className="text-red-800 ml-9 text-sm">{updateStatus.error}</p>
              )}
            </div>
          )}

          {updateStatus.status === 'idle' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <span className="text-amber-900">Dashboard permissions not yet added to your system</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-4">
            <button
              onClick={handleUpdatePermissions}
              disabled={isProcessing}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Updating...' : 'Update Permissions'}
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Why is this needed?</h3>
            <p className="text-gray-700 text-sm">
              The dashboard module permissions were recently added to the system. If you initialized RBAC before this update,
              the dashboard permissions won't be in your database yet. This button will add them for you.
            </p>

            <h3 className="font-semibold text-gray-900 pt-4">What permissions are added?</h3>
            <ul className="text-gray-700 text-sm space-y-2">
              <li>• <strong>dashboard.view</strong> - View Dashboard</li>
              <li>• <strong>dashboard.create</strong> - Create Dashboard Items</li>
              <li>• <strong>dashboard.edit</strong> - Edit Dashboard</li>
              <li>• <strong>dashboard.delete</strong> - Delete Dashboard Items</li>
              <li>• <strong>dashboard.admin</strong> - Administer Dashboard</li>
            </ul>

            <h3 className="font-semibold text-gray-900 pt-4">Is it safe?</h3>
            <p className="text-gray-700 text-sm">
              Yes! This operation uses database conflict detection. If a permission already exists, it will be skipped.
              You can run this multiple times without causing issues. It also preserves all existing role assignments.
            </p>
          </div>

          {/* Next Steps */}
          {updateStatus.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">Next Steps:</h3>
              <ol className="text-green-800 space-y-2 ml-4">
                <li>1. Go to <a href="/admin/dashboard" className="font-semibold underline hover:text-green-700">/admin/dashboard</a></li>
                <li>2. Click a role to edit it</li>
                <li>3. Scroll to the "Dashboard" module (now visible!)</li>
                <li>4. Check the dashboard permissions you want to assign</li>
                <li>5. Click "Save Changes"</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </BankingLayout>
  )
}
