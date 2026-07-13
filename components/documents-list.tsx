'use client'

import React, { useState, useEffect } from 'react'
import { FileText, FileJson, FileSpreadsheet, FilePdf, MoreVertical, Share2, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Document {
  id: string
  title: string
  category: string
  status: string
  owner_name: string
  current_version: number
  updated_at: string
  owner_id: string
}

const getFileIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'policy':
      return <FileText className="text-amber-600" size={20} />
    case 'framework':
      return <FileText className="text-blue-600" size={20} />
    case 'procedure':
      return <FileSpreadsheet className="text-green-600" size={20} />
    case 'manual':
      return <FileJson className="text-purple-600" size={20} />
    case 'guideline':
      return <FilePdf className="text-red-600" size={20} />
    default:
      return <FileText className="text-gray-600" size={20} />
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'published':
      return 'bg-green-100 text-green-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/documents')
        if (!response.ok) throw new Error('Failed to fetch documents')
        const data = await response.json()
        setDocuments(data.slice(0, 5)) // Show top 5
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading documents')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading documents...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
          <a href="/documents" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            View all
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Category</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Owner</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Modified</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Version</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.category)}
                    <span className="font-medium text-gray-900">{doc.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{doc.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{doc.owner_name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">v{doc.current_version}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Share2 size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Download size={16} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
