'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  File,
  FileSpreadsheet,
  FileCode,
  Eye,
  Download,
  Share2,
  MoreVertical,
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useDocumentRefresh } from '@/lib/contexts/document-refresh'
import { fetchDocuments } from '@/app/actions/documents'

interface FileRecord {
  id: string
  title: string
  name?: string
  type?: 'pdf' | 'excel' | 'doc' | 'image' | 'other'
  category?: string
  ownerName?: string
  uploadedBy?: string
  createdAt: string
  version?: number
  status: string
  accessLevel?: string
  visibility?: 'public' | 'internal' | 'department' | 'confidential'
  permission?: 'view' | 'download' | 'edit' | 'admin'
  size?: string
  departmentId?: string
  divisionId?: string
  divisionName?: string
  description?: string
  currentVersion?: number
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



export function FileManagementTable() {
  const { refreshKey } = useDocumentRefresh()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [divisionsCache, setDivisionsCache] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchFiles()
  }, [page, filterStatus, searchTerm, refreshKey])

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

  const fetchFiles = async () => {
    try {
      setLoading(true)
      
      console.log('[FileManagementTable] Calling server action to fetch documents')
      const result = await fetchDocuments({
        page,
        limit: 20,
        status: filterStatus || undefined,
        search: searchTerm || undefined,
      })
      
      if (!result.success) {
        console.error('[FileManagementTable] Server action error:', result.error)
        setError(result.error || 'Failed to load files')
        setFiles([])
        setLoading(false)
        return
      }
      
      const filesList = result.data || []
      console.log('[FileManagementTable] Files from server action:', filesList)
      
      // Fetch division names for files that have divisionId
      const filesWithDivisions = await Promise.all(
        filesList.map(async (file: FileRecord) => {
          if (file.divisionId && !file.divisionName) {
            const divisionName = await fetchDivisionName(file.divisionId)
            return { ...file, divisionName }
          }
          return file
        })
      )
      
      setFiles(Array.isArray(filesWithDivisions) ? filesWithDivisions : [])
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load files'
      console.error('[FileManagementTable] Error:', errorMsg)
      setError(errorMsg)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = Array.isArray(files) ? files
    .filter(file => {
      if (filterStatus && file.status !== filterStatus) return false
      if (searchTerm && !(file.title || file.name || '').toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let aVal = a[sortBy as keyof FileRecord]
      let bVal = b[sortBy as keyof FileRecord]
      
      // Handle undefined/null values
      if (aVal == null) aVal = ''
      if (bVal == null) bVal = ''
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    }) : []

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleViewFile = async (fileId: string, file: FileRecord) => {
    try {
      const fileName = file.title || ''
      
      // Always try to open the preview endpoint
      // It will show either the file or metadata text depending on availability
      const previewUrl = `/api/documents/${fileId}/preview`
      
      try {
        // Try to fetch first to check response
        const response = await fetch(previewUrl, {
          credentials: 'include',
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          alert(errorData.error || 'Failed to preview: File not found')
          return
        }
        
        // Get the content type to determine how to display
        const contentType = response.headers.get('content-type') || ''
        
        // For PDFs and images, open in a new tab with proper viewing
        // For other files, force download behavior
        if (contentType.includes('application/pdf') || contentType.includes('image/')) {
          // Open PDF/images in new tab - browser will display inline
          window.open(previewUrl, '_blank', 'noopener,noreferrer')
        } else if (contentType.includes('text/plain')) {
          // Open text files in new tab
          window.open(previewUrl, '_blank', 'noopener,noreferrer')
        } else {
          // For Office formats that couldn't be converted, trigger download
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
        console.error('Preview check error:', err)
        alert('Failed to preview file')
      }
    } catch (err) {
      console.error('Preview error:', err)
      alert('Failed to preview file')
    }
  }

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${fileId}/download`, {
        credentials: 'include',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to download file' }))
        const errorMessage = errorData.error || `Failed to download file (${response.status})`
        
        // Check if it's a metadata-only document message
        if (errorMessage.includes('before file storage was enabled')) {
          alert(`⚠️ This document needs to be re-uploaded.\n\n${errorMessage}\n\nGo to /upload to add the file.`)
        } else {
          alert(errorMessage)
        }
        return
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download file')
    }
  }

  const handleShareFile = (fileId: string) => {
    // TODO: Implement share functionality
    alert(`Share file: ${fileId}`)
  }

  const handleMoreOptions = (fileId: string) => {
    // TODO: Implement more options menu
    alert(`More options for file: ${fileId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all your documents with role-based access control.</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-600">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all your documents with role-based access control.</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-8 text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
        <p className="text-gray-600 mt-2">Manage and track all your documents with role-based access control.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4423]"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['draft', 'pending_approval', 'approved', 'archived'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-[#6B4423] text-white'
                  : 'bg-[#F5F5F5] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5F5F5] border-b border-[#E6E6E6]">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-2 font-bold text-gray-900">
                    File Name
                    {sortBy === 'title' && (sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Department</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Division</th>
                <th className="px-6 py-4 text-left">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-2 font-bold text-gray-900">
                    Date Uploaded
                    {sortBy === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Uploaded By</th>
                <th className="px-6 py-4 text-center font-bold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, index) => (
                <tr key={file.id} className={`border-b border-[#E6E6E6] hover:bg-[#F5F5F5] transition-colors ${index === filteredFiles.length - 1 ? 'border-b-0' : ''}`}>
                  {/* File Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type || 'other')}
                      <div>
                        <p className="font-semibold text-gray-900">{file.title || file.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-600">v{file.currentVersion || file.version || 1} • {file.size || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Department */}
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{file.category || 'General'}</span>
                  </td>
                  
                  {/* Division */}
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{file.divisionName || 'N/A'}</span>
                  </td>
                  
                  {/* Date Uploaded */}
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{new Date(file.createdAt).toLocaleDateString()}</span>
                  </td>
                  
                  {/* Uploaded By */}
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{file.uploadedBy || file.ownerName || 'Unknown'}</span>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleViewFile(file.id, file)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Preview"
                      >
                        <Eye size={18} className="text-red-700" />
                      </button>
                      <button 
                        onClick={() => handleDownloadFile(file.id, file.title)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Download"
                      >
                        <Download size={18} className="text-red-700" />
                      </button>
                      <button 
                        onClick={() => handleShareFile(file.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Share"
                      >
                        <Share2 size={18} className="text-red-700" />
                      </button>
                      <button 
                        onClick={() => handleMoreOptions(file.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                        title="More options"
                      >
                        <MoreVertical size={18} className="text-red-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-[#F5F5F5] border-t border-[#E6E6E6] px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {filteredFiles.length} of {files.length} files</p>
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
