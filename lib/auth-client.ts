"use client"

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
})

// Custom sign-in that bypasses Better Auth's broken emailAndPassword
export async function customSignIn(email: string, password: string) {
  try {
    console.log('[Auth-Client] Signing in:', email)
    console.log('[Auth-Client] Password:', password)
    console.log('[Auth-Client] Password length:', password.length)
    
    const response = await fetch('/api/custom-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.log('[Auth-Client] Sign-in failed:', data.error)
      return {
        error: {
          message: data.error || 'Sign-in failed',
        },
      }
    }

    // Sign-in successful - store token and redirect
    console.log('[Auth-Client] Sign-in successful!')
    return { data }
  } catch (error) {
    console.error('[Auth-Client] Error:', error)
    return {
      error: {
        message: error instanceof Error ? error.message : 'Network error',
      },
    }
  }
}

export const { signIn, signUp, signOut, useSession } = authClient

