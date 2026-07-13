'use client'

import React, { useState } from 'react'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  MoreVertical,
  AlertTriangle,
  Paperclip,
  User
} from 'lucide-react'

interface ApprovalCard {
  id: string
  title: string
  file: string
  department: string
  uploadedBy: string
  uploadDate: string
  priority: 'high' | 'medium' | 'low'
  reviewer: string
  submittedDate: string
}

const pendingFiles: ApprovalCard[] = [
  {
    id: '1',
    title: 'Q2_Financial_Report_2024',
    file: 'Q2_Financial_Report_2024.pdf',
    department: 'Finance',
    uploadedBy: 'Sarah Johnson',
    uploadDate: '2024-05-28',
    priority: 'high',
    reviewer: 'Michael Chen',
    submittedDate: '2024-05-28'
  },
  {
    id: '2',
    title: 'Branch_Performance_May',
    file: 'Branch_Performance_May.xlsx',
    department: 'Operations',
    uploadedBy: 'John Martinez',
    uploadDate: '2024-05-27',
    priority: 'medium',
    reviewer: 'Emma Thompson',
    submittedDate: '2024-05-27'
  },
  {
    id: '3',
    title: 'HR_Policies_Update',
    file: 'HR_Policies_Update.docx',
    department: 'HR',
    uploadedBy: 'Lisa Anderson',
    uploadDate: '2024-05-24',
    priority: 'low',
    reviewer: 'David Kumar',
    submittedDate: '2024-05-24'
  },
]

const underReviewFiles: ApprovalCard[] = [
  {
    id: '4',
    title: 'Legal_Contract_Draft',
    file: 'Legal_Contract_Draft.docx',
    department: 'Legal',
    uploadedBy: 'Emma Thompson',
    uploadDate: '2024-05-26',
    priority: 'high',
    reviewer: 'Sarah Johnson',
    submittedDate: '2024-05-26'
  },
]

const approvedFiles: ApprovalCard[] = [
  {
    id: '5',
    title: 'Budget_2024',
    file: 'Budget_2024.pdf',
    department: 'Finance',
    uploadedBy: 'Michael Chen',
    uploadDate: '2024-05-25',
    priority: 'high',
    reviewer: 'Sarah Johnson',
    submittedDate: '2024-05-25'
  },
  {
    id: '6',
    title: 'Compliance_Audit',
    file: 'Compliance_Audit.docx',
    department: 'Operations',
    uploadedBy: 'Lisa Anderson',
    uploadDate: '2024-05-20',
    priority: 'medium',
    reviewer: 'Michael Chen',
    submittedDate: '2024-05-20'
  },
]

const rejectedFiles: ApprovalCard[] = [
  {
    id: '7',
    title: 'Draft_Contract_v1',
    file: 'Draft_Contract_v1.docx',
    department: 'Legal',
    uploadedBy: 'David Kumar',
    uploadDate: '2024-05-22',
    priority: 'medium',
    reviewer: 'Emma Thompson',
    submittedDate: '2024-05-22'
  },
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-300'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'low':
      return 'bg-green-100 text-green-700 border-green-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

const KanbanColumn = ({
  title,
  count,
  items,
  bgColor,
  borderColor,
  icon: Icon,
}: {
  title: string
  count: number
  items: ApprovalCard[]
  bgColor: string
  borderColor: string
  icon: React.ReactNode
}) => (
  <div className="flex-1 flex flex-col">
    <div className={`${bgColor} rounded-t-2xl border-b ${borderColor} p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {Icon}
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600">{count} items</p>
        </div>
      </div>
    </div>

    <div className="flex-1 bg-[#F5F5F5] rounded-b-2xl p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
      {items.map(item => (
        <div key={item.id} className="bg-white border border-[#E6E6E6] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-move">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-2 flex-1">
              <FileText size={18} className="text-blue-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-600 truncate">{item.file}</p>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
              <MoreVertical size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User size={14} />
              <span>{item.department}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Uploaded by {item.uploadedBy}</span>
            </div>

            <div className="pt-2 border-t border-[#E6E6E6] flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-[#F5F5F5] hover:bg-gray-200 rounded transition-colors text-gray-700">
                <Eye size={14} />
                Preview
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-[#F5F5F5] hover:bg-gray-200 rounded transition-colors text-gray-700">
                <MessageSquare size={14} />
                Comment
              </button>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <p className="text-sm">No items</p>
        </div>
      )}
    </div>
  </div>
)

export function ApprovalKanban() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approval Workflow</h1>
        <p className="text-gray-600 mt-2">Manage file approval requests in a structured workflow.</p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        <KanbanColumn
          title="Pending"
          count={pendingFiles.length}
          items={pendingFiles}
          bgColor="bg-blue-50"
          borderColor="border-blue-200"
          icon={<Clock size={20} className="text-blue-600" />}
        />

        <KanbanColumn
          title="Under Review"
          count={underReviewFiles.length}
          items={underReviewFiles}
          bgColor="bg-amber-50"
          borderColor="border-amber-200"
          icon={<AlertTriangle size={20} className="text-amber-600" />}
        />

        <KanbanColumn
          title="Approved"
          count={approvedFiles.length}
          items={approvedFiles}
          bgColor="bg-green-50"
          borderColor="border-green-200"
          icon={<CheckCircle size={20} className="text-green-600" />}
        />

        <KanbanColumn
          title="Rejected"
          count={rejectedFiles.length}
          items={rejectedFiles}
          bgColor="bg-red-50"
          borderColor="border-red-200"
          icon={<XCircle size={20} className="text-red-600" />}
        />
      </div>

      {/* Approval Timeline */}
      <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Approval Timeline Example</h2>
        
        <div className="relative pl-8">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B4423]"></div>
          
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 bg-[#6B4423] rounded-full border-4 border-white"></div>
              <div>
                <p className="font-semibold text-gray-900">File Uploaded</p>
                <p className="text-sm text-gray-600">Q2_Financial_Report_2024.pdf by Sarah Johnson</p>
                <p className="text-xs text-gray-500 mt-1">May 28, 2024 • 10:30 AM</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 bg-[#6B4423] rounded-full border-4 border-white"></div>
              <div>
                <p className="font-semibold text-gray-900">Pending Review</p>
                <p className="text-sm text-gray-600">Awaiting approval from Michael Chen (Finance Manager)</p>
                <p className="text-xs text-gray-500 mt-1">May 28, 2024 • 10:35 AM</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 bg-gray-300 rounded-full border-4 border-white"></div>
              <div className="opacity-60">
                <p className="font-semibold text-gray-900">Under Review</p>
                <p className="text-sm text-gray-600">Manager is reviewing the document...</p>
                <p className="text-xs text-gray-500 mt-1">In Progress</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 bg-gray-300 rounded-full border-4 border-white"></div>
              <div className="opacity-60">
                <p className="font-semibold text-gray-900">Final Decision</p>
                <p className="text-sm text-gray-600">Awaiting final approval from executive...</p>
                <p className="text-xs text-gray-500 mt-1">Pending</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 bg-gray-300 rounded-full border-4 border-white"></div>
              <div className="opacity-60">
                <p className="font-semibold text-gray-900">Published</p>
                <p className="text-sm text-gray-600">Document published and accessible to authorized users</p>
                <p className="text-xs text-gray-500 mt-1">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-[#6B4423] bg-opacity-5 border border-[#6B4423] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-600 mt-1">Review and approve pending documents</p>
        </div>
        <button className="bg-[#6B4423] text-white px-6 py-2 rounded-lg hover:bg-[#4A2E19] transition-colors font-medium">
          Review Pending Documents
        </button>
      </div>
    </div>
  )
}
