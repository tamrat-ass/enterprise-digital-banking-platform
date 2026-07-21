import { useState, useCallback } from 'react'

/**
 * Hook for managing CRUD operations on table data
 * Combines loading, error, and success states with callbacks
 */
export function useTableOperations<T extends { id: string }>(onRefresh?: () => Promise<void>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = useCallback(
    async (id: string, deleteCallback: (id: string) => Promise<void>) => {
      if (!confirm('Are you sure?')) return

      try {
        setDeleting(id)
        setError(null)
        await deleteCallback(id)
        setSuccess('Item deleted successfully')
        setTimeout(() => setSuccess(null), 3000)
        await onRefresh?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete')
      } finally {
        setDeleting(null)
      }
    },
    [onRefresh]
  )

  const handleEdit = useCallback(
    async (item: T, editCallback: (item: T) => Promise<void>) => {
      try {
        setLoading(true)
        setError(null)
        await editCallback(item)
        setSuccess('Item updated successfully')
        setTimeout(() => setSuccess(null), 3000)
        await onRefresh?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update')
      } finally {
        setLoading(false)
      }
    },
    [onRefresh]
  )

  const clearError = useCallback(() => setError(null), [])
  const clearSuccess = useCallback(() => setSuccess(null), [])

  return {
    loading,
    error,
    success,
    deleting,
    handleDelete,
    handleEdit,
    clearError,
    clearSuccess,
  }
}
