'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader, Building2, GitBranch, FolderOpen, Tag } from 'lucide-react'
import { useDocumentRefresh } from '@/lib/contexts/document-refresh'
import { logger } from '@/lib/logger'

interface UploadFile {
  id: string
  name: string
  size: number
}

interface Department {
  id: string
  name: string
  code: string
  description?: string
}

interface Division {
  id: string
  name: string
  code: string
  departmentId: string
}

interface Category {
  id: string
  name: string
  code: string
  description?: string
  color?: string
}

export function FileUploadForm() {
  const { triggerRefresh } = useDocumentRefresh()
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [actualFiles, setActualFiles] = useState<File[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingDivs, setLoadingDivs] = useState(false)
  const [loadingCats, setLoadingCats] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    departmentId: '',
    divisionId: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Fetch departments and categories on mount (OPTIMIZED: parallel fetching)
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        // OPTIMIZATION: Fetch in parallel instead of sequential
        const [deptResponse, catResponse] = await Promise.all([
          fetch('/api/departments', { credentials: 'include' }),
          fetch('/api/categories', { credentials: 'include' }),
        ])

        if (!isMounted) return

        // Process departments
        if (deptResponse.ok) {
          const deptList = (await deptResponse.json()).data?.data || []
          if (isMounted) {
            setDepartments(Array.isArray(deptList) ? deptList : [])
            if (Array.isArray(deptList) && deptList.length > 0) {
              setFormData(prev => ({ ...prev, departmentId: deptList[0].id }))
              // Fetch divisions for selected department
              await fetchDivisionsForDepartment(deptList[0].id)
            }
          }
        }
        setLoadingDepts(false)

        // Process categories
        if (catResponse.ok) {
          const catList = (await catResponse.json()).data?.data || []
          if (isMounted) {
            setCategories(Array.isArray(catList) ? catList : [])
            if (Array.isArray(catList) && catList.length > 0) {
              setFormData(prev => ({ ...prev, categoryId: catList[0].id }))
            }
          }
        }
        setLoadingCats(false)
      } catch (err) {
        if (isMounted) {
          logger.error('Failed to fetch form data:', err)
          setLoadingDepts(false)
          setLoadingCats(false)
        }
      }
    }

    fetchData()

    // CLEANUP: Prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch divisions when department changes
  const fetchDivisionsForDepartment = async (departmentId: string) => {
    if (!departmentId) {
      setDivisions([])
      setFormData(prev => ({ ...prev, divisionId: '' }))
      return
    }

    try {
      setLoadingDivs(true)
      const response = await fetch(`/api/divisions?departmentId=${departmentId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const divList = (await response.json()).data?.data || []
        setDivisions(Array.isArray(divList) ? divList : [])
        if (Array.isArray(divList) && divList.length > 0) {
          setFormData(prev => ({ ...prev, divisionId: divList[0].id }))
        } else {
          setFormData(prev => ({ ...prev, divisionId: '' }))
        }
      } else {
        setDivisions([])
      }
    } catch (err) {
      logger.error('Failed to fetch divisions:', err)
      setDivisions([])
    } finally {
      setLoadingDivs(false)
    }
  }

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const departmentId = e.target.value
    setFormData(prev => ({ ...prev, departmentId, divisionId: '' }))
    fetchDivisionsForDepartment(departmentId)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (fileList: File[]) => {
    const newFiles = fileList.map(file => ({
      id: Math.random().toString(),
      name: file.name,
      size: file.size,
    }))
    setFiles(prev => [...prev, ...newFiles])
    setActualFiles(prev => [...prev, ...fileList])
  }

  const removeFile = (id: string) => {
    const index = files.findIndex(f => f.id === id)
    if (index >= 0) {
      setFiles(prev => prev.filter(f => f.id !== id))
      setActualFiles(prev => {
        const newList = [...prev]
        newList.splice(index, 1)
        return newList
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!formData.title || files.length === 0) {
      setUploadMessage({ type: 'error', text: 'Please enter a title and select files' })
      return
    }

    if (!formData.departmentId) {
      setUploadMessage({ type: 'error', text: 'Please select a department' })
      return
    }

    if (!formData.categoryId) {
      setUploadMessage({ type: 'error', text: 'Please select a category' })
      return
    }

    if (formData.departmentId && !formData.divisionId) {
      setUploadMessage({ type: 'error', text: 'Please select a division' })
      return
    }

    setUploading(true)
    setUploadMessage(null)

    try {
      // Upload each file
      for (let i = 0; i < actualFiles.length; i++) {
        const file = actualFiles[i]
        
        // Get the selected category name
        const selectedCategory = categories.find(c => c.id === formData.categoryId)
        const categoryName = selectedCategory?.name || 'other'

        // Create FormData with file and metadata
        const formDataToSend = new FormData()
        formDataToSend.append('file', file)
        formDataToSend.append('title', `${formData.title}${actualFiles.length > 1 ? ` - ${i + 1}` : ''}`)
        formDataToSend.append('category', categoryName)
        formDataToSend.append('accessLevel', 'internal')
        formDataToSend.append('fileName', file.name)
        formDataToSend.append('departmentId', formData.departmentId || '')
        formDataToSend.append('divisionId', formData.divisionId || '')

        logger.debug('[FileUploadForm] Form data to send:', {
          title: formData.title,
          category: categoryName,
          departmentId: formData.departmentId,
          divisionId: formData.divisionId,
          fileName: file.name,
        })

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formDataToSend,
          // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        })

        const responseText = await response.text()
        logger.debug('[FileUploadForm] Upload response status:', response.status)

        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { error: responseText }
        }

        if (!response.ok) {
          const errorMsg = responseData.message || responseData.error || responseData.errors || `Failed to upload (${response.status})`
          logger.error('Upload failed with:', errorMsg)
          throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
        }
      }

      setUploadMessage({ type: 'success', text: `Successfully uploaded ${actualFiles.length} file(s)` })
      setFiles([])
      setActualFiles([])
      const defaultDeptId = departments.length > 0 ? departments[0].id : ''
      const defaultCatId = categories.length > 0 ? categories[0].id : ''
      const defaultDivId = divisions.length > 0 ? divisions[0].id : ''
      setFormData({ title: '', categoryId: defaultCatId, departmentId: defaultDeptId, divisionId: defaultDivId })
      
      // Trigger refresh of document table
      triggerRefresh()
      
      // Auto-hide message after 5 seconds
      setTimeout(() => setUploadMessage(null), 5000)
    } catch (err) {
      logger.error('Upload error:', err)
      setUploadMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-700 to-red-800 flex items-center justify-center shadow-md">
              <Upload className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Upload Documents</h1>
              <p className="text-gray-600 mt-1">Securely upload and organize your business documents</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {uploadMessage && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 flex gap-3 text-sm ${
            uploadMessage.type === 'success'
              ? 'bg-green-50 border-l-green-500 text-green-800'
              : 'bg-red-50 border-l-red-500 text-red-800'
          }`}>
            {uploadMessage.type === 'success' ? (
              <CheckCircle2 className="flex-shrink-0 text-green-600 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="flex-shrink-0 text-red-600 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <p className="font-semibold">{uploadMessage.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadMessage(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Content Area - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Drag & Drop Area */}
            <div className="lg:col-span-1">
              <div
                ref={dragRef}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 min-h-72 flex flex-col items-center justify-center cursor-pointer ${
                  dragActive
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300 hover:border-red-500 bg-gray-50'
                }`}
              >
                <Upload className={`mb-3 transition-colors ${dragActive ? 'text-red-700' : 'text-gray-400'}`} size={48} />
                <h3 className="text-base font-bold text-gray-900 mb-1">Drag & Drop Files</h3>
                <p className="text-sm text-gray-600 mb-4">or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-medium text-sm"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* RIGHT: Form Fields */}
            <div className="lg:col-span-2 space-y-4">
              {/* Document Title */}
              <div>
                <label htmlFor="document-title" className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                  <Tag size={18} className="text-red-700" />
                  Document Title
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="document-title"
                  type="text"
                  placeholder="e.g., Q4 Financial Report"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category-select" className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                  <FolderOpen size={18} className="text-red-700" />
                  Category
                  <span className="text-red-600">*</span>
                </label>
                {loadingCats ? (
                  <div className="flex items-center justify-center h-11 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    <Loader className="animate-spin mr-2" size={16} />
                    Loading...
                  </div>
                ) : categories.length > 0 ? (
                  <select
                    id="category-select"
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-500 text-sm py-3 bg-gray-50 rounded-lg px-4">No categories available</div>
                )}
              </div>

              {/* Department & Division - 2 Columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label htmlFor="department-select" className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <Building2 size={18} className="text-red-700" />
                    Department
                    <span className="text-red-600">*</span>
                  </label>
                  {loadingDepts ? (
                    <div className="flex items-center justify-center h-11 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      <Loader className="animate-spin mr-2" size={16} />
                      Loading...
                    </div>
                  ) : departments.length > 0 ? (
                    <select
                      id="department-select"
                      required
                      value={formData.departmentId}
                      onChange={handleDepartmentChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-500 text-sm py-3 bg-gray-50 rounded-lg px-4">No departments</div>
                  )}
                </div>

                {/* Division */}
                <div>
                  <label htmlFor="division-select" className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <GitBranch size={18} className="text-red-700" />
                    Division
                    <span className="text-red-600">{formData.departmentId ? '*' : ''}</span>
                  </label>
                  {loadingDivs ? (
                    <div className="flex items-center justify-center h-11 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      <Loader className="animate-spin mr-2" size={16} />
                      Loading...
                    </div>
                  ) : divisions.length > 0 ? (
                    <select
                      id="division-select"
                      required
                      value={formData.divisionId}
                      onChange={(e) => setFormData({ ...formData, divisionId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm"
                    >
                      <option value="">Select division</option>
                      {divisions.map(div => (
                        <option key={div.id} value={div.id}>
                          {div.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-500 text-sm py-3 bg-gray-50 rounded-lg px-4">
                      {formData.departmentId ? 'No divisions' : 'Select dept first'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Files Preview */}
          {files.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-red-700" size={20} />
                <h3 className="font-semibold text-gray-900">{files.length} file(s) selected</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-28 overflow-y-auto">
                {files.map(file => (
                  <div key={file.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 group">
                    <FileText className="text-red-700 flex-shrink-0" size={16} />
                    <span className="text-sm text-gray-700 truncate flex-1 font-medium" title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X size={16} className="text-red-600 hover:text-red-700" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={files.length === 0 || !formData.title || !formData.categoryId || !formData.departmentId || !formData.divisionId || uploading}
              className="flex-1 bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload Documents
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setFiles([])
                setActualFiles([])
                setFormData({ title: '', categoryId: '', departmentId: '', divisionId: '' })
              }}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-semibold"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
