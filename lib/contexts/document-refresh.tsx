'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface DocumentRefreshContextType {
  refreshKey: number
  triggerRefresh: () => void
}

const DocumentRefreshContext = createContext<DocumentRefreshContextType | undefined>(undefined)

export function DocumentRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <DocumentRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DocumentRefreshContext.Provider>
  )
}

export function useDocumentRefresh() {
  const context = useContext(DocumentRefreshContext)
  if (!context) {
    throw new Error('useDocumentRefresh must be used within DocumentRefreshProvider')
  }
  return context
}
