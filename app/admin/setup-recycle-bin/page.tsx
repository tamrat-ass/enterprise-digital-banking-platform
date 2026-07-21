'use client'

import React, { useState } from 'react'
import { BankingLayout } from '@/components/banking-layout'
import { getCurrentUser, requireUser } from '@/lib/session'
import { redirect } from 'next/navigation'

export default function SetupRecycleBinPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch('/api/admin/setup-recycle-bin', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to setup recycle bin permissions')
        return
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Setup Recycle Bin</h1>
        <p className="text-gray-600 mt-2">Initialize recycle bin permissions in the database</p>
      </div>

      <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8">
        <div className="space-y-6">
          <p className="text-gray-700">
            Click the button below to create recycle bin permissions and set them up for existing roles.
          </p>

          <button
            onClick={handleSetup}
            disabled={loading}
            className="px-6 py-3 bg-[#6B4423] text-white rounded-lg hover:bg-[#5a3a1e] transition-colors font-semibold disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Setup Recycle Bin Permissions'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">Success</p>
              <p className="text-green-700 text-sm mt-1">{result.message}</p>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-green-700">
                  <strong>Permissions Created:</strong> {result.permissionsCreated}
                </p>
                <div className="text-sm text-green-700">
                  <strong>Permissions:</strong>
                  <ul className="mt-2 ml-4 space-y-1">
                    {Object.entries(result.permissions).map(([key, value]: [string, any]) => (
                      <li key={key}>
                        • {key}: {value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
