import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
}

export interface AuthSession {
  id: string
  token: string
  expiresAt: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    // This could be done via a /api/auth/session endpoint
    setIsLoading(false)
  }, [])

  const signOut = async () => {
    try {
      // Clear local state
      setUser(null)
      // Clear cookies
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      router.push('/sign-in')
      router.refresh()
    } catch (error) {
      console.error('Sign-out error:', error)
    }
  }

  return {
    user,
    isLoading,
    signOut,
    setUser,
  }
}
