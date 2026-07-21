'use client'

import { useState } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { AlertCircle, CheckCircle, Loader, RefreshCw, Users } from 'lucide-react'

interface MaintenanceStatus {
  status: 'idle' | 'checking' | 'fixing' | 'success' | 'error'
  message: string
  details?: any
  affectedCount?: number
}

export default function PermissionsMaintenancePage() {
  const [fixStatus, setFixStatus] = useState<MaintenanceStatus>({
    status: 'idle',
    message: 'Ready to fix existing role assignments'
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRefreshAllPermissions = async () => {
    try {
      setIsProcessing(true)
      setFixStatus({
        status: 'fixing',
        message: 'Refreshing all user permissions...'
      })

      const response = await fetch('/api/admin/refresh-all-permissions', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setFixStatus({
          status: 'success',
          message: data.message,
          affectedCount: data.refreshedUsers?.count,
          details: data.refreshedUsers?.users || []
        })
      } else {
        setFixStatus({
          status: 'error',
          message: data.message || 'Failed to refresh permissions',
          details: data.error
        })
      }
    } catch (err) {
      setFixStatus({
        status: 'error',
        message: 'Error refreshing permissions',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFixExistingRoles = async () => {
    try {
      setIsProcessing(true)
      setFixStatus({
        status: 'checking',
        message: 'Checking existing user-role assignments...'
      })

      const response = await fetch('/api/admin/fix-existing-roles', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setFixStatus({
          status: 'success',
          message: `Checked ${data.stats?.totalAssignments} assignments - ${data.stats?.issuesFound} issues found`,
          details: data
        })
      } else {
        setFixStatus({
          status: 'error',
          message: data.message || 'Failed to check roles',
          details: data.error
        })
      }
    } catch (err) {
      setFixStatus({
        status: 'error',
        message: 'Error checking roles',
        details: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: ['admin.view'] as any }}>
      <div className="max-w-4xl mx-auto py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Permissions Maintenance</h1>
            <p className="text-gray-600 mt-2">
              Fix and refresh user permissions after role assignments or system updates
            </p>
          </div>

          {/* Status */}
          {fixStatus.status !== 'idle' && (
            <div className={`rounded-lg p-6 ${
              fixStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
              fixStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-start gap-4">
                {fixStatus.status === 'success' && (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-lg font-semibold text-green-900">✅ Success</h2>
                      <p className="text-green-700 mt-1">{fixStatus.message}</p>
                      {fixStatus.affectedCount && (
                        <p className="text-green-700 text-sm mt-2">
                          Affected users: <span className="font-bold">{fixStatus.affectedCount}</span>
                        </p>
                      )}
                      {fixStatus.details && Array.isArray(fixStatus.details) && fixStatus.details.length > 0 && (
                        <div className="mt-4 text-sm bg-white rounded p-3 max-h-48 overflow-y-auto">
                          {fixStatus.details.map((user: any, idx: number) => (
                            <div key={idx} className="text-green-800 py-1">
                              {user.name} ({user.email})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {fixStatus.status === 'error' && (
                  <>
                    <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-lg font-semibold text-red-900">Error</h2>
                      <p className="text-red-700 mt-1">{fixStatus.message}</p>
                      {fixStatus.details && (
                        <p className="text-red-600 text-sm mt-2 font-mono">{fixStatus.details}</p>
                      )}
                    </div>
                  </>
                )}
                {(fixStatus.status === 'checking' || fixStatus.status === 'fixing') && (
                  <>
                    <Loader className="w-8 h-8 text-blue-600 animate-spin flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-lg font-semibold text-blue-900">Processing...</h2>
                      <p className="text-blue-700 mt-1">{fixStatus.message}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Option 1: Refresh All Permissions */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <RefreshCw className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Option 1: Refresh All Permissions</h2>
                <p className="text-gray-600 mt-2">
                  Re-seed the RBAC system and refresh permissions for all users. Use this when:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                  <li>New permissions were added to the code</li>
                  <li>Existing users need updated role permissions</li>
                  <li>System-wide permission update is needed</li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={handleRefreshAllPermissions}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Refresh All Permissions
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
                  <p className="font-semibold">After clicking:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All users' roles will be updated</li>
                    <li>Permissions will refresh automatically on next request</li>
                    <li>Or users can sign out and back in to refresh immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Check Existing Roles */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <Users className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Option 2: Check Existing Assignments</h2>
                <p className="text-gray-600 mt-2">
                  Verify that all existing user-role assignments are valid and have permissions. Use this to:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1">
                  <li>Check for broken role assignments</li>
                  <li>Find roles without permissions</li>
                  <li>Identify users without proper role setup</li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={handleFixExistingRoles}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5" />
                        Check Assignments
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-4 bg-purple-50 border border-purple-200 rounded p-4 text-sm text-purple-800">
                  <p className="font-semibold">This will:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Check all user-role assignments</li>
                    <li>Verify roles exist and have permissions</li>
                    <li>Report any issues found</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="font-semibold text-amber-900 mb-3">When to Use Each Option</h3>
            <div className="space-y-3 text-amber-900 text-sm">
              <p>
                <span className="font-semibold">After RBAC Updates:</span> Use Option 1 to refresh all permissions
              </p>
              <p>
                <span className="font-semibold">Troubleshooting 403 Errors:</span> Use Option 2 to check user assignments
              </p>
              <p>
                <span className="font-semibold">System Maintenance:</span> Run Option 1 weekly to ensure all users have latest permissions
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Option 1: Refresh All Permissions</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                  <li>Re-seeds RBAC system with latest role definitions</li>
                  <li>Updates all roles with current permissions</li>
                  <li>Users get fresh permissions on next request</li>
                  <li>No disruption to users</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Option 2: Check Assignments</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                  <li>Finds all users with role assignments</li>
                  <li>Verifies each role exists</li>
                  <li>Checks that roles have permissions</li>
                  <li>Reports any issues found</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BankingLayout>
  )
}
