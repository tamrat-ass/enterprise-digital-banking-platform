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
  ChevronDown,
  Trash2,
  Printer,
} from 'lucide-react'
import { useDocumentRefresh } from '@/lib/contexts/document-refresh'
import { fetchDocuments } from '@/app/actions/documents'
import { softDeleteDocument } from '@/app/actions/recycle-bin'
import { ShareDialog } from './share-dialog'
import { logger } from '@/lib/logger'

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileRecord | null>(null)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; fileId?: string; fileName?: string }>({ isOpen: false })
  const [moreOptionsMenuOpen, setMoreOptionsMenuOpen] = useState<string | null>(null)
  const [selectedFileForPrint, setSelectedFileForPrint] = useState<FileRecord | null>(null)

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
      
      logger.debug('[FileManagementTable] Calling server action to fetch documents')
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
      logger.debug('[FileManagementTable] Files from server action:', filesList)
      
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

  const handleShareFile = (fileId: string, file: FileRecord) => {
    const foundFile = files.find(f => f.id === fileId)
    if (foundFile) {
      setSelectedFileForShare(foundFile)
      setShareDialogOpen(true)
    }
  }

  const handleShareSubmit = async (permissions: Array<{ userId: string; permission: 'view' | 'download' | 'edit' }>) => {
    if (!selectedFileForShare) return

    try {
      const response = await fetch(`/api/documents/${selectedFileForShare.id}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to share file' }))
        throw new Error(errorData.error || 'Failed to share file')
      }

      alert('File shared successfully!')
      setSelectedFileForShare(null)
      setShareDialogOpen(false)
    } catch (err) {
      console.error('Share error:', err)
      throw err
    }
  }

  const handleMoreOptions = (file: FileRecord) => {
    setSelectedFileForPrint(file)
  }

  const handlePrintFilePrivileges = async () => {
    if (!selectedFileForPrint) return
    
    try {
      // Open print window with file access information
      const printWindow = window.open('', 'printFilePrivileges', 'width=1000,height=800')
      if (printWindow) {
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>File Access Privileges - ${selectedFileForPrint.title}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
                padding: 20px;
              }
              .container {
                max-width: 900px;
                margin: 0 auto;
              }
              .header {
                border-bottom: 3px solid #6B4423;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #6B4423;
                font-size: 28px;
                margin-bottom: 10px;
              }
              .header p {
                color: #666;
                font-size: 14px;
              }
              .file-info {
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
              }
              .info-row {
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 20px;
                margin-bottom: 15px;
              }
              .info-row:last-child {
                margin-bottom: 0;
              }
              .info-label {
                font-weight: 600;
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
              }
              .info-value {
                font-size: 14px;
                color: #333;
                word-break: break-word;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #6B4423;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
                margin-bottom: 15px;
              }
              .access-item {
                background: #f9f9f9;
                border: 1px solid #e0e0e0;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .access-item::before {
                content: "✓ ";
                color: #4CAF50;
                font-weight: bold;
                margin-right: 10px;
              }
              .access-level-badge {
                display: inline-block;
                background: #6B4423;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e0e0e0;
                font-size: 12px;
                color: #999;
                display: flex;
                justify-content: space-between;
              }
              .print-date {
                text-align: right;
              }
              @media print {
                body {
                  padding: 0;
                }
                .container {
                  max-width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>File Access Privileges Report</h1>
                <p>Document Access and Permission Summary</p>
              </div>
              
              <div class="file-info">
                <div class="info-row">
                  <div class="info-label">File Name</div>
                  <div class="info-value">${selectedFileForPrint.title || 'Untitled'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Document ID</div>
                  <div class="info-value">${selectedFileForPrint.id}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Category</div>
                  <div class="info-value">${selectedFileForPrint.category || 'Not categorized'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Access Level</div>
                  <div class="info-value"><span class="access-level-badge">${selectedFileForPrint.accessLevel || 'Default'}</span></div>
                </div>
                <div class="info-row">
                  <div class="info-label">Owner</div>
                  <div class="info-value">${selectedFileForPrint.ownerName || 'Unknown'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Created Date</div>
                  <div class="info-value">${new Date(selectedFileForPrint.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Status</div>
                  <div class="info-value">${selectedFileForPrint.status || 'Active'}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Access Privileges</div>
                <div class="access-item">
                  <span>View Access</span>
                  <span>${selectedFileForPrint.permission === 'view' || selectedFileForPrint.permission === 'download' || selectedFileForPrint.permission === 'edit' ? '✓' : '✗'}</span>
                </div>
                <div class="access-item">
                  <span>Download Access</span>
                  <span>${selectedFileForPrint.permission === 'download' || selectedFileForPrint.permission === 'edit' ? '✓' : '✗'}</span>
                </div>
                <div class="access-item">
                  <span>Edit Access</span>
                  <span>${selectedFileForPrint.permission === 'edit' ? '✓' : '✗'}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Additional Information</div>
                <div class="access-item">
                  <span>Version</span>
                  <span>v${selectedFileForPrint.currentVersion || 1}</span>
                </div>
                <div class="access-item">
                  <span>Visibility</span>
                  <span>${selectedFileForPrint.visibility || 'Internal'}</span>
                </div>
              </div>
              
              <div class="footer">
                <div>Enterprise Digital Banking Platform</div>
                <div class="print-date">Generated: ${new Date().toLocaleString()}</div>
              </div>
            </div>
          </body>
          </html>
        `
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
      setSelectedFileForPrint(null)
      setMoreOptionsMenuOpen(null)
    } catch (err) {
      console.error('Print error:', err)
      alert('Failed to print file privileges')
    }
  }

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      fileId,
      fileName
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmDialog.fileId) return

    try {
      const result = await softDeleteDocument(deleteConfirmDialog.fileId)
      if (result.success) {
        alert('File moved to recycle bin')
        setDeleteConfirmDialog({ isOpen: false })
        // Refresh the files list
        const result = await fetchDocuments({
          page,
          limit: 20,
          status: filterStatus || undefined,
          search: searchTerm || undefined,
        })
        
        if (result.success) {
          setFiles(result.data || [])
        }
      } else {
        alert(`Failed to delete: ${result.error}`)
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete file')
    }
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
      {/* Delete Confirm Dialog */}
      {deleteConfirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete File?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirmDialog.fileName}"? You can restore it from the Recycle Bin.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmDialog({ isOpen: false })}
                className="px-4 py-2 border border-[#E6E6E6] rounded-lg text-gray-700 hover:bg-[#F5F5F5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
        <p className="text-gray-600 mt-2">Manage and track all your documents with role-based access control.</p>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        fileId={selectedFileForShare?.id || ''}
        fileName={selectedFileForShare?.title || ''}
        isOpen={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false)
          setSelectedFileForShare(null)
        }}
        onShare={handleShareSubmit}
      />

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
                      <div className="relative">
                        <button 
                          onClick={() => setMoreOptionsMenuOpen(moreOptionsMenuOpen === file.id ? null : file.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors" 
                          title="More options"
                        >
                          <MoreVertical size={18} className="text-red-700" />
                        </button>
                        
                        {/* More Options Dropdown */}
                        {moreOptionsMenuOpen === file.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <button
                              onClick={() => {
                                setSelectedFileForPrint(file)
                                handlePrintFilePrivileges()
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm border-b border-gray-200"
                            >
                              <Printer className="w-4 h-4" />
                              Print
                            </button>
                            <button
                              onClick={() => {
                                handleDownloadFile(file.id, file.title)
                                setMoreOptionsMenuOpen(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm border-b border-gray-200"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                            <button
                              onClick={() => {
                                handleShareFile(file.id, file)
                                setMoreOptionsMenuOpen(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm border-b border-gray-200"
                            >
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteFile(file.id, file.title)
                                setMoreOptionsMenuOpen(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
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
