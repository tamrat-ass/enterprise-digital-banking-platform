'use client'

import React, { useState, useEffect } from 'react'
import { Building2, MoreVertical, Edit2, Trash2 } from 'lucide-react'

interface Vendor {
  id: string
  name: string
  category: string
  status: string
  risk_rating: string
  contact_email: string
  contract_value: number | null
}

const getRiskColor = (rating: string) => {
  switch (rating.toLowerCase()) {
    case 'low':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-50 border-l-4 border-green-600'
    case 'inactive':
      return 'bg-gray-50 border-l-4 border-gray-400'
    case 'pending_review':
      return 'bg-yellow-50 border-l-4 border-yellow-600'
    default:
      return 'bg-white border-l-4 border-gray-200'
  }
}

export function VendorsList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/vendors')
        if (!response.ok) throw new Error('Failed to fetch vendors')
        const data = await response.json()
        setVendors(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading vendors')
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading vendors...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      {vendors.map((vendor) => (
        <div
          key={vendor.id}
          className={`p-4 rounded-lg ${getStatusColor(vendor.status)} transition-shadow hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Building2 size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{vendor.category}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRiskColor(vendor.risk_rating)}`}>
                    Risk: {vendor.risk_rating}
                  </span>
                  <span className="text-xs text-gray-500">{vendor.contact_email}</span>
                  {vendor.contract_value && (
                    <span className="text-xs font-semibold text-gray-900">
                      ${vendor.contract_value.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <Edit2 size={16} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <MoreVertical size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
