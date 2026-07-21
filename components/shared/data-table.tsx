'use client'

import React, { ReactNode } from 'react'
import { ChevronUp, ChevronDown, MoreVertical, Trash2, Edit } from 'lucide-react'

export interface Column<T> {
  key: keyof T | 'actions'
  label: string
  width?: string
  render?: (value: any, item: T) => ReactNode
  sortable?: boolean
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onActionClick?: (item: T) => void
  renderRow?: (item: T) => ReactNode
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  onSort,
  onEdit,
  onDelete,
  renderRow,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnKey)
      setSortDir('asc')
    }
    onSort?.(columnKey, sortDir === 'asc' ? 'desc' : 'asc')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-6 py-3 text-left text-sm font-semibold text-gray-700 ${col.width || ''}`}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(String(col.key))}
                    className="flex items-center gap-2 hover:text-gray-900"
                  >
                    {col.label}
                    {sortBy === String(col.key) ? (
                      sortDir === 'asc' ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) =>
            renderRow ? (
              <React.Fragment key={item.id}>{renderRow(item)}</React.Fragment>
            ) : (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-sm text-gray-700">
                    {col.render ? (
                      col.render((item as any)[col.key], item)
                    ) : (
                      (item as any)[col.key]
                    )}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 hover:bg-blue-50 rounded text-blue-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-2 hover:bg-red-50 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
