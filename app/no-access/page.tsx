'use client'

import { AlertTriangle } from 'lucide-react'
import { theme } from '@/lib/theme'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function NoAccessPage() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${theme.colors.primaryLight}, #E8D5DD)`,
      }}
    >
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Your account has not been assigned any permissions yet. Please contact your system
          administrator.
        </p>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-white rounded-lg transition-colors"
          style={{
            backgroundColor: theme.colors.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primaryDark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
