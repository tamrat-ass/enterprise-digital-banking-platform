'use client'

import { useState, useEffect } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface InitStatus {
  status: 'checking' | 'initialized' | 'already_initialized' | 'error' | 'idle'
  message: string
  permissionCount?: number
  rolePermissionCount?: number
  error?: string
}

export default function InitRBACPage() {
  const [initStatus, setInitStatus] = useState<InitStatus>({
    status: 'idle',
    message: 'Click "Initialize RBAC" to start'
  })
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setInitStatus({ status: 'checking', message: 'Checking RBAC status...' })
      
      const response = await fetch('/api/admin/init-rbac', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setInitStatus({
          status: data.status === 'already_initialized' ? 'already_initialized' : 'initialized',
          message: data.message,
          permissionCount: data.permissionCount,
          rolePermissionCount: data.rolePermissionCount
        })
      } else {
        setInitStatus({
          status: 'error',
          message: data.message || 'Failed to check status',
          error: data.error
        })
      }
    } catch (err) {
      setInitStatus({
        status: 'error',
        message: 'Error checking RBAC status',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const handleInitialize = async () => {
    try {
      setIsInitializing(true)
      setInitStatus({ status: 'checking', message: 'Initializing RBAC system...' })
      
      const response = await fetch('/api/admin/init-rbac', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setInitStatus({
          status: 'initialized',
          message: data.message,
          permissionCount: data.permissionCount,
          rolePermissionCount: data.rolePermissionCount
        })
      } else {
        setInitStatus({
          status: 'error',
          message: data.message || 'Failed to initialize',
          error: data.error
        })
      }
    } catch (err) {
      setInitStatus({
        status: 'error',
        message: 'Error initializing RBAC',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: ['admin.view'] as any }}>
      <div className="max-w-2xl mx-auto py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">RBAC System Initialization</h1>
            <p className="text-gray-600 mt-2">
              Initialize the Role-Based Access Control system with predefined roles and permissions
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="flex items-start gap-4">
              {initStatus.status === 'checking' && (
                <>
                  <Loader className="w-8 h-8 text-blue-600 animate-spin flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Checking Status...</h2>
                    <p className="text-gray-600 mt-1">{initStatus.message}</p>
                  </div>
                </>
              )}

              {initStatus.status === 'initialized' && (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-green-900">✅ RBAC Initialized Successfully!</h2>
                    <p className="text-green-700 mt-1">{initStatus.message}</p>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="text-green-700">
                        <span className="font-semibold">{initStatus.permissionCount}</span> permissions created
                      </p>
                      <p className="text-green-700">
                        <span className="font-semibold">{initStatus.rolePermissionCount}</span> role-permission links created
                      </p>
                    </div>
                    <div className="mt-6 space-y-3">
                      <p className="text-green-700 font-semibold">What's included:</p>
                      <ul className="text-green-700 space-y-1 ml-4">
                        <li>✓ 6 System Roles (Super Admin, System Admin, Document Officer, Approver, Viewer, Auditor)</li>
                        <li>✓ 25 Permissions across 7 modules</li>
                        <li>✓ All role-permission links configured</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {initStatus.status === 'already_initialized' && (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-green-900">Already Initialized</h2>
                    <p className="text-green-700 mt-1">{initStatus.message}</p>
                    <div className="mt-4 space-y-2 text-sm text-green-700">
                      <p>
                        <span className="font-semibold">{initStatus.permissionCount}</span> permissions
                      </p>
                      <p>
                        <span className="font-semibold">{initStatus.rolePermissionCount}</span> role-permission links
                      </p>
                    </div>
                  </div>
                </>
              )}

              {initStatus.status === 'error' && (
                <>
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-red-900">Error</h2>
                    <p className="text-red-700 mt-1">{initStatus.message}</p>
                    {initStatus.error && (
                      <p className="text-red-600 text-sm mt-2 font-mono">{initStatus.error}</p>
                    )}
                  </div>
                </>
              )}

              {initStatus.status === 'idle' && (
                <>
                  <div className="w-8 h-8 bg-blue-100 rounded flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ready to Initialize</h2>
                    <p className="text-gray-600 mt-1">{initStatus.message}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">What This Does</h3>
            <ul className="space-y-2 text-blue-900 text-sm">
              <li>✓ Creates 25 permissions across 7 modules (users, documents, roles, approvals, reports, categories, audit)</li>
              <li>✓ Creates 6 system roles with predefined permissions</li>
              <li>✓ Links each role to its permissions</li>
              <li>✓ Enables role-based access control for the entire platform</li>
            </ul>
          </div>

          {/* System Roles Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Roles Created</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="font-semibold text-gray-900">Super Admin</div>
                <p className="text-sm text-gray-600 mt-1">All permissions, full system access</p>
              </div>
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="font-semibold text-gray-900">System Admin</div>
                <p className="text-sm text-gray-600 mt-1">Manage users, roles, and audit logs</p>
              </div>
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="font-semibold text-gray-900">Document Officer</div>
                <p className="text-sm text-gray-600 mt-1">Create and manage documents</p>
              </div>
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="font-semibold text-gray-900">Approver</div>
                <p className="text-sm text-gray-600 mt-1">Review and approve documents</p>
              </div>
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="font-semibold text-gray-900">Viewer</div>
                <p className="text-sm text-gray-600 mt-1">View and download documents</p>
              </div>
              <div className="border border-gray-200 rounded p-4 bg-white">
                <div className="font-semibold text-gray-900">Auditor</div>
                <p className="text-sm text-gray-600 mt-1">View reports and audit logs (read-only)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleInitialize}
              disabled={isInitializing || initStatus.status === 'initialized' || initStatus.status === 'already_initialized'}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isInitializing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Initializing...
                </>
              ) : initStatus.status === 'initialized' || initStatus.status === 'already_initialized' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Done
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Initialize RBAC
                </>
              )}
            </button>
            <button
              onClick={checkStatus}
              disabled={isInitializing}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Check Status
            </button>
            {(initStatus.status === 'initialized' || initStatus.status === 'already_initialized') && (
              <button
                onClick={async () => {
                  try {
                    setIsInitializing(true)
                    setInitStatus({ status: 'checking', message: 'Updating RBAC system...' })
                    
                    const response = await fetch('/api/admin/update-rbac', {
                      method: 'POST',
                      credentials: 'include'
                    })
                    
                    const data = await response.json()
                    
                    if (response.ok) {
                      setInitStatus({
                        status: 'initialized',
                        message: data.message + ' - All roles updated with new permissions',
                        permissionCount: data.stats?.rolePermissionLinks,
                        rolePermissionCount: data.stats?.systemRoles
                      })
                    } else {
                      setInitStatus({
                        status: 'error',
                        message: data.message || 'Failed to update',
                        error: data.error
                      })
                    }
                  } catch (err) {
                    setInitStatus({
                      status: 'error',
                      message: 'Error updating RBAC',
                      error: err instanceof Error ? err.message : 'Unknown error'
                    })
                  } finally {
                    setIsInitializing(false)
                  }
                }}
                disabled={isInitializing}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Update RBAC
              </button>
            )}
          </div>

          {/* Next Steps */}
          {(initStatus.status === 'initialized' || initStatus.status === 'already_initialized') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3">Next Steps</h3>
              <ol className="space-y-2 text-green-900 text-sm list-decimal list-inside">
                <li>Go to <span className="font-mono bg-white px-2 py-1 rounded">/admin/users</span> to manage users</li>
                <li>Create a new user or edit an existing one</li>
                <li>Select a role from the dropdown (Super Admin, Document Officer, Viewer, etc.)</li>
                <li>Save changes - the user will immediately get that role's permissions</li>
                <li>Go to <span className="font-mono bg-white px-2 py-1 rounded">/admin/roles</span> to view/edit role permissions</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </BankingLayout>
  )
}
