'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Loader,
  ChevronRight,
} from 'lucide-react'
import { DivisionsManager } from './divisions-manager'

interface Department {
  id: string
  name: string
  code: string
  description?: string
  headName?: string
  divisions?: Division[]
}

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
}

interface DivisionFormData {
  name: string
  code: string
  description: string
  headName: string
  status: string
}

type SortField = 'name' | 'code'

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    headName: '',
  })
  const [divisionsToAdd, setDivisionsToAdd] = useState<DivisionFormData[]>([])
  const [newDivision, setNewDivision] = useState<DivisionFormData>({
    name: '',
    code: '',
    description: '',
    headName: '',
    status: 'active',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      console.log('[DepartmentsManager] Fetching departments...')
      const response = await fetch('/api/departments', {
        credentials: 'include',
      })
      console.log('[DepartmentsManager] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('[DepartmentsManager] API error:', response.status, errorData)
        throw new Error(`Failed to fetch departments: ${response.status}`)
      }

      const json = await response.json()
      console.log('[DepartmentsManager] Full response:', JSON.stringify(json, null, 2))

      // Extract departments from response
      let deptList = []

      // Handle different response formats
      if (json.data) {
        // If data is an array
        if (Array.isArray(json.data)) {
          deptList = json.data
          console.log('[DepartmentsManager] Found array in json.data')
        }
        // If data is an object with a data property that's an array
        else if (json.data.data && Array.isArray(json.data.data)) {
          deptList = json.data.data
          console.log('[DepartmentsManager] Found nested array in json.data.data')
        }
      }

      console.log('[DepartmentsManager] Extracted departments:', deptList.length, deptList)

      if (!Array.isArray(deptList)) {
        console.warn('[DepartmentsManager] Departments is not an array, setting to empty')
        deptList = []
      }

      setDepartments(deptList)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load departments'
      console.error('[DepartmentsManager] Error:', errorMsg, err)
      setError(errorMsg)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Department name is required'
    }
    if (!formData.code.trim()) {
      errors.code = 'Department code is required'
    }
    if (formData.code.trim().length < 2) {
      errors.code = 'Code must be at least 2 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          headName: formData.headName.trim(),
          divisions: divisionsToAdd.length > 0 ? divisionsToAdd.map(div => ({
            name: div.name.trim(),
            code: div.code.trim().toUpperCase(),
            description: div.description.trim(),
            headName: div.headName.trim(),
            status: div.status,
          })) : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add department')
      }

      setSuccessMessage(`Department added successfully${divisionsToAdd.length > 0 ? ` with ${divisionsToAdd.length} division(s)` : ''}`)
      setFormData({ name: '', code: '', description: '', headName: '' })
      setDivisionsToAdd([])
      setNewDivision({ name: '', code: '', description: '', headName: '', status: 'active' })
      setShowAddModal(false)
      await fetchDepartments()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !editingId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/departments/${editingId}`, {
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update department')
      }

      setSuccessMessage('Department updated successfully')
      setFormData({ name: '', code: '', description: '', headName: '' })
      setEditingId(null)
      setShowEditModal(false)
      await fetchDepartments()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete department')
      }

      setSuccessMessage('Department deleted successfully')
      await fetchDepartments()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department')
      setTimeout(() => setError(null), 5000)
    }
  }

  const openEditModal = (dept: Department) => {
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      headName: dept.headName || '',
    })
    setEditingId(dept.id)
    setShowEditModal(true)
    setFormErrors({})
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingId(null)
    setFormData({ name: '', code: '', description: '', headName: '' })
    setDivisionsToAdd([])
    setNewDivision({ name: '', code: '', description: '', headName: '', status: 'active' })
    setFormErrors({})
  }

  const filteredDepartments = departments
    .filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-2">Manage organization departments</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8 text-center">
          <Loader className="animate-spin mx-auto text-[#6B4423]" size={32} />
          <p className="text-gray-600 mt-4">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-2">Manage organization departments</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', code: '', description: '', headName: '' })
            setFormErrors({})
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 bg-[#6B4423] text-white px-6 py-3 rounded-lg hover:bg-[#4A2E19] transition-colors font-semibold"
        >
          <Plus size={20} />
          Add Department
        </button>
      </div>

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

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm overflow-hidden">
        {filteredDepartments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">No departments found</p>
            <button
              onClick={() => {
                setFormData({ name: '', code: '', description: '', headName: '' })
                setFormErrors({})
                setShowAddModal(true)
              }}
              className="mt-4 text-[#6B4423] font-semibold hover:underline"
            >
              Create the first department
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredDepartments.map((dept, index) => (
              <div key={dept.id} className={`border-b border-[#E6E6E6] hover:bg-[#F5F5F5] transition-colors ${
                index === filteredDepartments.length - 1 ? 'border-b-0' : ''
              }`}>
                {/* Department Row */}
                <div className="flex items-center px-6 py-4 gap-4">
                  <button
                    onClick={() => setExpandedDeptId(expandedDeptId === dept.id ? null : dept.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <ChevronRight
                      size={20}
                      className={`transition-transform ${
                        expandedDeptId === dept.id ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    {dept.description && (
                      <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                    )}
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#6B4423] bg-opacity-10 text-[#6B4423]">
                    {dept.code}
                  </span>
                  <p className="text-gray-700 min-w-[100px] text-sm">{dept.headName || '—'}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-2 hover:bg-[#E6E6E6] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} className="text-[#6B4423]" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="p-2 hover:bg-[#E6E6E6] rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Expanded Divisions Section */}
                {expandedDeptId === dept.id && (
                  <div className="bg-[#F9F9F9] border-t border-[#E6E6E6] px-6 py-4">
                    <DivisionsManager departmentId={dept.id} departmentName={dept.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E6E6E6] bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Add Department</h2>
              <button
                onClick={closeModals}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Finance"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.name ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., FIN"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.code ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.code && <p className="text-red-600 text-sm mt-1">{formErrors.code}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department"
                  rows={3}
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              {/* Head Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Department Head
                </label>
                <input
                  type="text"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              {/* Divisions Section */}
              <div className="pt-4 border-t border-[#E6E6E6]">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Divisions (Optional)</h3>
                
                {/* Add Division Form */}
                <div className="bg-[#F9F9F9] p-3 rounded-lg mb-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Division Name
                    </label>
                    <input
                      type="text"
                      value={newDivision.name}
                      onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                      placeholder="e.g., Digital Banking"
                      className="w-full px-3 py-1.5 border border-[#E6E6E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Division Code
                    </label>
                    <input
                      type="text"
                      value={newDivision.code}
                      onChange={(e) => setNewDivision({ ...newDivision, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., DBA"
                      className="w-full px-3 py-1.5 border border-[#E6E6E6] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newDivision.name.trim() && newDivision.code.trim()) {
                        setDivisionsToAdd([...divisionsToAdd, {
                          name: newDivision.name.trim(),
                          code: newDivision.code.trim().toUpperCase(),
                          description: newDivision.description.trim(),
                          headName: newDivision.headName.trim(),
                          status: newDivision.status,
                        }])
                        setNewDivision({ name: '', code: '', description: '', headName: '', status: 'active' })
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-[#6B4423] text-white text-sm rounded hover:bg-[#4A2E19] transition-colors font-semibold"
                  >
                    + Add Division
                  </button>
                </div>

                {/* List of Divisions to Add */}
                {divisionsToAdd.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Divisions to add: ({divisionsToAdd.length})
                    </p>
                    {divisionsToAdd.map((div, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{div.name}</p>
                          <p className="text-xs text-gray-600">{div.code}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDivisionsToAdd(divisionsToAdd.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
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
                  {isSubmitting ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - Rest of edit modal form code continues... */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E6E6E6] bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Edit Department</h2>
              <button
                onClick={closeModals}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleEditDepartment} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Finance"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.name ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., FIN"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423] ${
                    formErrors.code ? 'border-red-500' : 'border-[#E6E6E6]'
                  }`}
                />
                {formErrors.code && <p className="text-red-600 text-sm mt-1">{formErrors.code}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the department"
                  rows={3}
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              {/* Head Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Department Head
                </label>
                <input
                  type="text"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
                />
              </div>

              {/* Actions */}
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
                  {isSubmitting ? 'Updating...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
