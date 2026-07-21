'use client'

import { useState } from 'react'
import { BankingLayout } from "@/components/banking-layout"
import { RefreshCw, CheckCircle, AlertCircle, Loader, Copy } from 'lucide-react'

interface SetupStatus {
  status: 'idle' | 'checking' | 'setting_up' | 'success' | 'error'
  message: string
  added?: {
    permissions: number
    rolesWithView: number
    adminRoles: number
  }
  permissions?: string[]
  error?: string
}

export default function SetupDashboardPage() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    status: 'idle',
    message: 'Click buttons below to setup dashboard permissions',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const checkStatus = async () => {
    try {
      setIsProcessing(true)
      setSetupStatus({
        status: 'checking',
        message: 'Checking dashboard permissions...',
      })

      const response = await fetch('/api/admin/setup-dashboard', {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (data.dashboard_permissions_count > 0) {
          setSetupStatus({
            status: 'success',
            message: `✅ Dashboard permissions already exist!`,
            permissions: data.dashboard_permissions.map((p: any) => `${p.module}.${p.permissionKey}`),
          })
        } else {
          setSetupStatus({
            status: 'idle',
            message: '⚠️ Dashboard permissions not found in database',
            permissions: [],
          })
        }
      } else {
        setSetupStatus({
          status: 'error',
          message: 'Failed to check permissions',
          error: data.message || 'Unknown error',
        })
      }
    } catch (err) {
      setSetupStatus({
        status: 'error',
        message: 'Error checking permissions',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSetupDashboard = async () => {
    try {
      setIsProcessing(true)
      setSetupStatus({
        status: 'setting_up',
        message: 'Setting up dashboard permissions...',
      })

      const response = await fetch('/api/admin/setup-dashboard', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSetupStatus({
          status: 'success',
          message: data.message,
          added: data.added,
          permissions: data.dashboard_permissions,
        })
      } else {
        setSetupStatus({
          status: 'error',
          message: '❌ Failed to setup dashboard permissions',
          error: data.message || 'Unknown error',
        })
      }
    } catch (err) {
      setSetupStatus({
        status: 'error',
        message: '❌ Error setting up permissions',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copyPermissions = () => {
    if (setupStatus.permissions) {
      navigator.clipboard.writeText(setupStatus.permissions.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <BankingLayout user={{ name: 'Admin', role: 'Administrator', department: 'System', permissions: ['admin.view'] as any }}>
      <div className="max-w-2xl mx-auto py-12">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard Permissions Setup</h1>
            <p className="text-gray-600 mt-2">
              Add dashboard permissions to your database in one click
            </p>
          </div>

          {/* Status Messages */}
          {setupStatus.status === 'checking' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-blue-900 font-medium">{setupStatus.message}</span>
            </div>
          )}

          {setupStatus.status === 'setting_up' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center gap-3">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-blue-900 font-medium">{setupStatus.message}</span>
            </div>
          )}

          {setupStatus.status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-green-900 font-medium">{setupStatus.message}</span>
              </div>
              {setupStatus.added && (
                <div className="text-green-800 space-y-2 ml-9 mb-4">
                  <p>✓ Added {setupStatus.added.permissions} dashboard permissions</p>
                  <p>✓ Updated {setupStatus.added.rolesWithView} roles with dashboard.view</p>
                  <p>✓ Updated {setupStatus.added.adminRoles} admin roles with dashboard.admin</p>
                </div>
              )}
              {setupStatus.permissions && setupStatus.permissions.length > 0 && (
                <div className="ml-9 p-4 bg-white rounded border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-900">Dashboard Permissions Added:</p>
                    <button
                      onClick={copyPermissions}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <ul className="text-sm text-green-800 space-y-1 font-mono">
                    {setupStatus.permissions.map((perm) => (
                      <li key={perm}>• {perm}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 p-4 bg-blue-100 rounded text-sm text-blue-900">
                ℹ️ <strong>Next Step:</strong> Go to <a href="/admin/dashboard" className="font-semibold underline hover:text-blue-700">/admin/dashboard</a> to edit roles and assign these permissions!
              </div>
            </div>
          )}

          {setupStatus.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <span className="text-red-900 font-medium">{setupStatus.message}</span>
              </div>
              {setupStatus.error && (
                <p className="text-red-800 ml-9 text-sm">{setupStatus.error}</p>
              )}
            </div>
          )}

          {setupStatus.status === 'idle' && setupStatus.permissions && setupStatus.permissions.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <span className="text-amber-900">Dashboard permissions not yet in database - click button below to add them</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={checkStatus}
              disabled={isProcessing}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              <Loader className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
              Check Status
            </button>

            <button
              onClick={handleSetupDashboard}
              disabled={isProcessing}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isProcessing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Setting Up...' : 'Setup Dashboard Permissions'}
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">What This Does:</h3>
            <ul className="text-gray-700 text-sm space-y-2">
              <li>✓ Inserts 5 dashboard permissions into database</li>
              <li>✓ Adds dashboard.view to all existing roles</li>
              <li>✓ Adds dashboard.admin to Super Admin and System Admin</li>
              <li>✓ Preserves all existing data (safe to run multiple times)</li>
            </ul>

            <h3 className="font-semibold text-gray-900 pt-4">Dashboard Permissions:</h3>
            <ul className="text-gray-700 text-sm space-y-1 font-mono bg-white p-3 rounded border border-gray-200">
              <li>• dashboard.view - View Dashboard</li>
              <li>• dashboard.create - Create Dashboard Items</li>
              <li>• dashboard.edit - Edit Dashboard</li>
              <li>• dashboard.delete - Delete Dashboard Items</li>
              <li>• dashboard.admin - Administer Dashboard</li>
            </ul>

            <h3 className="font-semibold text-gray-900 pt-4">Why This Matters:</h3>
            <p className="text-gray-700 text-sm">
              Even though dashboard permissions were added to the code, they weren't added to your existing database.
              This tool adds them immediately so you can assign them to roles.
            </p>
          </div>
        </div>
      </div>
    </BankingLayout>
  )
}
