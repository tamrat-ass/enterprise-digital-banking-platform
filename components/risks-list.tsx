'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, MoreVertical } from 'lucide-react'

interface Risk {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  owner_name: string
  likelihood: number
  impact: number
}

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-l-4 border-red-600'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-600'
    case 'low':
      return 'bg-green-100 text-green-800 border-l-4 border-green-600'
    default:
      return 'bg-gray-100 text-gray-800 border-l-4 border-gray-400'
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high':
      return <AlertTriangle size={20} className="text-red-600" />
    case 'medium':
      return <AlertCircle size={20} className="text-yellow-600" />
    default:
      return <AlertCircle size={20} className="text-green-600" />
  }
}

const RiskMatrix = ({ likelihood, impact }: { likelihood: number; impact: number }) => {
  const cells = Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3) + 1
    const col = (i % 3) + 1
    const isActive = row <= likelihood && col <= impact
    return (
      <div
        key={i}
        className={`w-6 h-6 rounded ${
          isActive ? 'bg-red-500' : 'bg-gray-200'
        }`}
      />
    )
  })

  return (
    <div className="grid grid-cols-3 gap-1">
      {cells}
    </div>
  )
}

export function RisksList() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/risks')
        if (!response.ok) throw new Error('Failed to fetch risks')
        const data = await response.json()
        setRisks(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading risks')
      } finally {
        setLoading(false)
      }
    }

    fetchRisks()
  }, [])

  const filteredRisks = filter === 'all' 
    ? risks 
    : risks.filter(r => r.severity.toLowerCase() === filter)

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading risks...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['all', 'high', 'medium', 'low'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredRisks.map((risk) => (
          <div
            key={risk.id}
            className={`p-4 rounded-lg ${getSeverityColor(risk.severity)} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                {getSeverityIcon(risk.severity)}
                <div>
                  <h3 className="font-semibold text-gray-900">{risk.title}</h3>
                  <p className="text-sm text-gray-700 mt-1">{risk.description}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors">
                <MoreVertical size={16} className="text-gray-700" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-current border-opacity-20">
              <div>
                <p className="text-xs text-gray-700 font-medium">Category</p>
                <p className="text-sm font-semibold text-gray-900">{risk.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700 font-medium">Owner</p>
                <p className="text-sm font-semibold text-gray-900">{risk.owner_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-700 font-medium">Risk Matrix</p>
                <RiskMatrix likelihood={risk.likelihood} impact={risk.impact} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
