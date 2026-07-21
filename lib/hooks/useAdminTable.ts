import { useState, useCallback } from 'react'

export function useAdminTable<T extends { id: string }>(initialData: T[]) {
  const [data, setData] = useState(initialData)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [pageSize] = useState(20)

  const filteredData = useCallback(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  )

  return { data, setData, page, setPage, search, setSearch, filteredData }
}
