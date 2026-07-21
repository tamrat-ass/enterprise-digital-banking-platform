'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  File,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  Eye
} from 'lucide-react'
import { useDocumentRefresh } from '@/lib/contexts/document-refresh'
import { fetchRecycleBinDocuments, restoreDocument, permanentlyDeleteDocument, bulkRestoreDocuments, bulkPermanentlyDeleteDocuments } from '@/app/actions/recycle-bin'
import { logger } from '@/lib/logger'

interface DeletedFile {
  id: string
  title: string
  category?: string
  ownerName?: string
  deletedBy?: string
  deletedAt: Date | string
  createdAt: string
  currentVersion?: number
  size?: string
  departmentId?: string
  divisionId?: string
  divisionName?: string
  accessLevel?: string
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="text-red-700" size={20} />
    case 'excel':
      return <FileSpreadsheet className="text-green-600" size={20} />
    case 'doc':
      return <File className="text-blue-600" size={20} />
    default:
      return <FileCode className="text-gray-600" size={20} />
  }
}

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#E6E6E6] rounded-lg text-gray-700 hover:bg-[#F5F5F5] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#6B4423] hover:bg-[#5a3a1e]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RecycleBinTable() {
  const { refreshKey } = useDocumentRefresh()
  const [files, setFiles] = useState<DeletedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('deletedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: 'restore' | 'permanent_delete' | null
    fileId?: string
    fileName?: string
  }>({ isOpen: false, action: null })
  const [divisionsCache, setDivisionsCache] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchDeletedFiles()
  }, [page, searchTerm, refreshKey])

  const fetchDivisionName = async (divisionId: string): Promise<string> => {
    if (divisionsCache[divisionId]) {
      return divisionsCache[divisionId]
    }
    
    try {
      const response = await fetch(`/api/divisions/${divisionId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const json = await response.json()
        const divisionData = json.data || json
        const divisionName = divisionData.name || 'Unknown'
        setDivisionsCache(prev => ({ ...prev, [divisionId]: divisionName }))
        return divisionName
      }
    } catch (err) {
      console.error('Failed to fetch division:', err)
    }
    return 'Unknown'
  }

  const fetchDeletedFiles = async () => {
    try {
      setLoading(true)
      
      logger.debug('[RecycleBinTable] Fetching deleted files')
      const result = await fetchRecycleBinDocuments({
        page,
        limit: 20,
        sortBy: sortBy as 'deletedAt' | 'title' | 'deletedBy' | 'size',
        sortOrder,
        search: searchTerm || undefined,
      })
      
      if (!result.success) {
        console.error('[RecycleBinTable] Error:', result.error)
        setError(result.error || 'Failed to load recycle bin')
        setFiles([])
        setTotalFiles(0)
        setLoading(false)
        return
      }
      
      const { documents: deletedFiles, pagination } = result.data || { documents: [], pagination: { total: 0 } }
      logger.debug('[RecycleBinTable] Deleted files:', deletedFiles)
      
      // Fetch division names for files that have divisionId
      const filesWithDivisions = await Promise.all(
        (deletedFiles || []).map(async (file: DeletedFile) => {
          if (file.divisionId && !file.divisionName) {
            const divisionName = await fetchDivisionName(file.divisionId)
            return { ...file, divisionName }
          }
          return file
        })
      )
      
      setFiles(Array.isArray(filesWithDivisions) ? filesWithDivisions : [])
      setTotalFiles(pagination?.total || 0)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load recycle bin'
      console.error('[RecycleBinTable] Error:', errorMsg)
      setError(errorMsg)
      setFiles([])
      setTotalFiles(0)
    } finally {
      setLoading(false)
    }
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)))
    }
  }

  const handleRestoreClick = (fileId?: string, fileName?: string) => {
    setConfirmDialog({
      isOpen: true,
      action: 'restore',
      fileId,
      fileName,
    })
  }

  const handlePermanentDeleteClick = (fileId?: string, fileName?: string) => {
    setConfirmDialog({
      isOpen: true,
      action: 'permanent_delete',
      fileId,
      fileName,
    })
  }

  const handlePreviewFile = async (fileId: string, fileName: string) => {
    try {
      const previewUrl = `/api/documents/${fileId}/preview?includeDeleted=true`
      
      try {
        // First, check if the file exists and get its content type
        const response = await fetch(previewUrl, {
          credentials: 'include',
        })
        
        if (!response.ok) {
          alert('Failed to preview: File not found')
          return
        }
        
        const contentType = response.headers.get('content-type') || ''
        
        // For PDFs and images, display in a modal with iframe/img
        if (contentType.includes('application/pdf') || contentType.includes('image/')) {
          // Open in a new window with the preview URL
          // The iframe will display the PDF inline
          const width = 1200
          const height = 800
          const left = (window.innerWidth - width) / 2
          const top = (window.innerHeight - height) / 2
          
          const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
          window.open(previewUrl, 'preview', features)
        } else if (contentType.includes('text/plain')) {
          // Open text files in a new window
          window.open(previewUrl, '_blank', 'noopener,noreferrer')
        } else {
          // For other formats, download
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'document'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } catch (err) {
        console.error('Preview error:', err)
        alert('Failed to preview file')
      }
    } catch (err) {
      console.error('Preview error:', err)
      alert('Failed to preview file')
    }
  }

  const handleConfirmAction = async () => {
    try {
      if (confirmDialog.action === 'restore') {
        if (confirmDialog.fileId) {
          // Single restore
          const result = await restoreDocument(confirmDialog.fileId)
          if (result.success) {
            alert('File restored successfully')
            setSelectedFiles(new Set())
            setConfirmDialog({ isOpen: false, action: null })
            fetchDeletedFiles()
          } else {
            alert(`Failed to restore: ${result.error}`)
          }
        } else if (selectedFiles.size > 0) {
          // Bulk restore
          const result = await bulkRestoreDocuments(Array.from(selectedFiles))
          if (result.success) {
            alert(`${result.data?.successCount || 0} files restored successfully`)
            setSelectedFiles(new Set())
            setConfirmDialog({ isOpen: false, action: null })
            fetchDeletedFiles()
          } else {
            alert(`Failed to restore files: ${result.error}`)
          }
        }
      } else if (confirmDialog.action === 'permanent_delete') {
        if (confirmDialog.fileId) {
          // Single permanent delete
          const result = await permanentlyDeleteDocument(confirmDialog.fileId)
          if (result.success) {
            alert('File permanently deleted')
            setSelectedFiles(new Set())
            setConfirmDialog({ isOpen: false, action: null })
            fetchDeletedFiles()
          } else {
            alert(`Failed to permanently delete: ${result.error}`)
          }
        } else if (selectedFiles.size > 0) {
          // Bulk permanent delete
          const result = await bulkPermanentlyDeleteDocuments(Array.from(selectedFiles))
          if (result.success) {
            alert(`${result.data?.successCount || 0} files permanently deleted`)
            setSelectedFiles(new Set())
            setConfirmDialog({ isOpen: false, action: null })
            fetchDeletedFiles()
          } else {
            alert(`Failed to permanently delete files: ${result.error}`)
          }
        }
      }
    } catch (err) {
      console.error('Action error:', err)
      alert('An error occurred')
    }
  }

  const filteredFiles = Array.isArray(files) ? files
    .filter(file => {
      if (searchTerm && !(file.title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let aVal = a[sortBy as keyof DeletedFile]
      let bVal = b[sortBy as keyof DeletedFile]
      
      // Handle undefined/null values
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    }) : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recycle Bin</h1>
          <p className="text-gray-600 mt-2">Manage deleted files. Files will be permanently deleted after 30 days.</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-600">Loading deleted files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recycle Bin</h1>
          <p className="text-gray-600 mt-2">Manage deleted files. Files will be permanently deleted after 30 days.</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8 text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  const hasSelected = selectedFiles.size > 0

  return (
    <div className="space-y-6">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.action === 'restore'
            ? 'Restore Files?'
            : 'Permanently Delete Files?'
        }
        message={
          confirmDialog.action === 'restore'
            ? confirmDialog.fileName
              ? `Are you sure you want to restore "${confirmDialog.fileName}"?`
              : `Are you sure you want to restore ${selectedFiles.size} file(s)?`
            : confirmDialog.fileName
              ? `This will permanently delete "${confirmDialog.fileName}". This action cannot be undone.`
              : `This will permanently delete ${selectedFiles.size} file(s). This action cannot be undone.`
        }
        confirmText={confirmDialog.action === 'restore' ? 'Restore' : 'Permanently Delete'}
        isDangerous={confirmDialog.action === 'permanent_delete'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null })}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recycle Bin</h1>
        <p className="text-gray-600 mt-2">Manage deleted files. Files will be permanently deleted after 30 days.</p>
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search deleted files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {hasSelected && (
          <div className="flex gap-2">
            <button
              onClick={() => handleRestoreClick()}
              className="flex items-center gap-2 px-4 py-2 bg-[#6B4423] text-white rounded-lg hover:bg-[#5a3a1e] transition-colors font-semibold"
            >
              <RotateCcw size={18} />
              Restore {selectedFiles.size}
            </button>
            <button
              onClick={() => handlePermanentDeleteClick()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              <Trash2 size={18} />
              Delete {selectedFiles.size}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5F5] border-b border-[#E6E6E6]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={toggleAllSelection}
                    className="w-5 h-5 border border-gray-300 rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left">
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-2 font-bold text-gray-900">
                    File Name
                    {sortBy === 'title' && (sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Deleted By</th>
                <th className="px-6 py-4 text-left">
                  <button onClick={() => toggleSort('deletedAt')} className="flex items-center gap-2 font-bold text-gray-900">
                    Deleted Date
                    {sortBy === 'deletedAt' && (sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Original Upload</th>
                <th className="px-6 py-4 text-center font-bold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-gray-600">No deleted files in recycle bin</p>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file, index) => (
                  <tr key={file.id} className={`border-b border-[#E6E6E6] hover:bg-[#F5F5F5] transition-colors ${index === filteredFiles.length - 1 ? 'border-b-0' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="w-5 h-5 border border-gray-300 rounded cursor-pointer"
                      />
                    </td>
                    
                    {/* File Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon('other')}
                        <div>
                          <p className="font-semibold text-gray-900">{file.title || 'Untitled'}</p>
                          <p className="text-xs text-gray-600">v{file.currentVersion || 1}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Deleted By */}
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{file.deletedBy || 'Unknown'}</span>
                    </td>
                    
                    {/* Deleted Date */}
                    <td className="px-6 py-4">
                      <span className="text-gray-700">
                        {file.deletedAt 
                          ? new Date(file.deletedAt).toLocaleDateString() 
                          : 'N/A'}
                      </span>
                    </td>
                    
                    {/* Original Upload */}
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{new Date(file.createdAt).toLocaleDateString()}</span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePreviewFile(file.id, file.title)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleRestoreClick(file.id, file.title)}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <RotateCcw size={18} className="text-green-600" />
                        </button>
                        <button
                          onClick={() => handlePermanentDeleteClick(file.id, file.title)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Permanently Delete"
                        >
                          <Trash2 size={18} className="text-red-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-[#F5F5F5] border-t border-[#E6E6E6] px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {filteredFiles.length} of {totalFiles} deleted files</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="px-3 py-1 border border-[#E6E6E6] rounded-lg text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button className="px-3 py-1 border border-[#E6E6E6] rounded-lg text-sm bg-[#6B4423] text-white">{page}</button>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={files.length < 20}
              className="px-3 py-1 border border-[#E6E6E6] rounded-lg text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
