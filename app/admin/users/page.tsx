'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect from /admin/users to /users
 * We consolidated both user management screens into a single unified page at /users
 * This page now includes all functionality from both screens:
 * - Edit modal for quick user edits
 * - Expandable rows for role management
 * - Status toggling
 * - Password reset
 * - User creation and deletion
 */
export default function AdminUsersRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the main users page
    router.replace('/users')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 text-lg font-semibold">Redirecting to User Management...</p>
      </div>
    </div>
  )
}
