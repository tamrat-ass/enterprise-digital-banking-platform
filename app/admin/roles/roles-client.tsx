'use client'

// The roles management has been consolidated into the Users page at /users
// This client component redirects to the unified management screen

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RolesPageClient() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified Users & Roles management page
    router.push('/users')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mb-4"></div>
        <p className="text-slate-600">Redirecting to unified management...</p>
      </div>
    </div>
  )
}
