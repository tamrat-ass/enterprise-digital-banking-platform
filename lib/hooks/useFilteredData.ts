import { useMemo } from 'react'

/**
 * Hook for filtering and searching data with optional sorting
 * Helps prevent N+1 query patterns and improves performance
 */
export function useFilteredData<T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  sortField?: keyof T,
  sortOrder?: 'asc' | 'desc'
) {
  return useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = data.filter((item) =>
        searchFields.some((field) =>
          String(item[field]).toLowerCase().includes(lowerSearch)
        )
      )
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField]
        const bVal = b[sortField]

        if (typeof aVal === 'string') {
          return sortOrder === 'desc'
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal)
        }

        return sortOrder === 'desc' ? Number(bVal) - Number(aVal) : Number(aVal) - Number(bVal)
      })
    }

    return filtered
  }, [data, searchTerm, searchFields, sortField, sortOrder])
}
