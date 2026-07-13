'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader,
} from 'lucide-react'

interface Division {
  id: string
  departmentId: string
  name: string
  code: string
  description?: string
  status: string
  headName?: string
}

interface FormData {
  name: string
  code: string
  description: string
  headName: string
  status: string
}

export function DivisionsManager({ departmentId, departmentName }: { departmentId: string; departmentName: string }) {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    headName: '',
    status: 'active',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDivisions()
  }, [departmentId])

  const fetchDivisions = async () => {
    try {
      setLoading(true)
      console.log('[DivisionsManager] Fetching divisions for department:', departmentId)
      const response = await fetch(`/api/divisions?departmentId=${departmentId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch divisions: ${response.status}`)
      }

      const json = await response.json()
      console.log('[DivisionsManager] API Response:', json)
      
      // Handle different response formats
      let divisionsList = []
      if (json.data) {
        if (Array.isArray(json.data)) {
          divisionsList = json.data
        } else if (json.data.data && Array.isArray(json.data.data)) {
          divisionsList = json.data.data
        }
      }
      
      console.log('[DivisionsManager] Parsed divisions:', divisionsList)
      setDivisions(divisionsList)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load divisions'
      console.error('[DivisionsManager] Error:', errorMsg)
      setError(errorMsg)
      setDivisions([])
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Division name is required'
    }
    if (!formData.code.trim()) {
      errors.code = 'Division code is required'
    }
    if (formData.code.trim().length < 2) {
      errors.code = 'Code must be at least 2 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddDivision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/divisions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          departmentId,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          headName: formData.headName.trim(),
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add division')
      }

      setSuccessMessage('Division added successfully')
      setFormData({ name: '', code: '', description: '', headName: '', status: 'active' })
      setShowAddModal(false)
      await fetchDivisions()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add division')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDivision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !editingId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/divisions/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          headName: formData.headName.trim(),
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update division')
      }

      setSuccessMessage('Division updated successfully')
      setFormData({ name: '', code: '', description: '', headName: '', status: 'active' })
      setEditingId(null)
      setShowEditModal(false)
      await fetchDivisions()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update division')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDivision = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const response = await fetch(`/api/divisions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete division')
      }

      setSuccessMessage('Division deleted successfully')
      await fetchDivisions()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete division')
      setTimeout(() => setError(null), 5000)
    }
  }

  const openEditModal = (division: Division) => {
    setFormData({
      name: division.name,
      code: division.code,
      description: division.description || '',
      headName: division.headName || '',
      status: division.status,
    })
    setEditingId(division.id)
    setShowEditModal(true)
    setFormErrors({})
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingId(null)
    setFormData({ name: '', code: '', description: '', headName: '', status: 'active' })
    setFormErrors({})
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8 text-center">
        <Loader className="animate-spin mx-auto text-[#6B4423]" size={32} />
        <p className="text-gray-600 mt-4">Loading divisions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Messages */}
      {error && (
        <div className="p-4 rounded-lg border-l-4 bg-red-50 text-red-800 border-l-red-500 flex gap-3">
          <AlertCircle className="flex-shrink-0 text-red-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg border-l-4 bg-green-50 text-green-800 border-l-green-500 flex gap-3">
          <CheckCircle className="flex-shrink-0 text-green-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Divisions</h3>
          <p className="text-sm text-gray-600">Manage divisions for {departmentName}</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', code: '', description: '', headName: '', status: 'active' })
            setFormErrors({})
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 bg-[#6B4423] text-white px-4 py-2 rounded-lg hover:bg-[#4A2E19] transition-colors font-semibold text-sm"
        >
          <Plus size={18} />
          Add Division
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-lg overflow-hidden">
        {divisions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No divisions found</p>
            <button
              onClick={() => {
                setFormData({ name: '', code: '', description: '', headName: '', status: 'active' })
                setFormErrors({})
                setShowAddModal(true)
              }}
              className="mt-4 text-[#6B4423] font-semibold hover:underline"
            >
              Add the first division
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F5F5] border-b border-[#E6E6E6]">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Code</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Head</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(divisions) && divisions.length > 0 ? (
                  divisions.map((division, index) => (
                  <tr
                    key={division.id}
                    className={`border-b border-[#E6E6E6] hover:bg-[#F5F5F5] transition-colors ${
                      index === divisions.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{division.name}</p>
                      {division.description && (
                        <p className="text-xs text-gray-600 mt-1">{division.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-[#6B4423] bg-opacity-10 text-[#6B4423]">
                        {division.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          division.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {division.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-sm">{division.headName || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(division)}
                          className="p-1.5 hover:bg-[#E6E6E6] rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} className="text-[#6B4423]" />
                        </button>
                        <button
                          onClick={() => handleDeleteDivision(division.id, division.name)}
                          className="p-1.5 hover:bg-[#E6E6E6] rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <p className="text-gray-600">No divisions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E6E6E6] bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add Division</h2>
              <button
                onClick={closeModals}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddDivision} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Division Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Digital Banking Agent"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.name ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., DBA"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.code ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.code && <p className="text-red-600 text-sm mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Division Head
                </label>
                <input
                  type="text"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  placeholder="e.g., Jane Smith"
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-[#E6E6E6] text-gray-900 rounded-lg hover:bg-[#F5F5F5] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#6B4423] text-white rounded-lg hover:bg-[#4A2E19] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Division'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E6E6E6] bg-white">
              <h2 className="text-xl font-bold text-gray-900">Edit Division</h2>
              <button
                onClick={closeModals}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditDivision} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Division Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Digital Banking Agent"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.name ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., DBA"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.code ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.code && <p className="text-red-600 text-sm mt-1">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Division Head
                </label>
                <input
                  type="text"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  placeholder="e.g., Jane Smith"
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-[#E6E6E6] text-gray-900 rounded-lg hover:bg-[#F5F5F5] transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#6B4423] text-white rounded-lg hover:bg-[#4A2E19] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Division'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
