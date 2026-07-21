/**
 * Client-side session refresh utility
 * Call this after admin changes have been made to your permissions
 */

export async function refreshSessionInBrowser() {
  try {
    console.log('[refreshSessionInBrowser] Calling refresh-session endpoint...')
    
    const response = await fetch('/api/auth/refresh-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Session refresh failed: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('[refreshSessionInBrowser] Session refreshed successfully:', {
      name: data.data?.user?.name,
      permissions: data.data?.user?.permissions?.length,
    })

    return {
      success: true,
      user: data.data?.user,
      message: 'Session refreshed - please reload the page for changes to take effect',
    }
  } catch (err) {
    console.error('[refreshSessionInBrowser] Error refreshing session:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to refresh session',
      message: 'Please refresh your browser or log out and log back in to see permission changes',
    }
  }
}

/**
 * Checks if the current user session has a specific permission
 */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh-session', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) return false

    const data = await response.json()
    const permissions = data.data?.user?.permissions || []
    
    return permissions.includes(permissionKey)
  } catch (err) {
    console.error('[hasPermission] Error checking permission:', err)
    return false
  }
}

/**
 * Gets the current user's permissions from the session
 */
export async function getCurrentPermissions(): Promise<string[]> {
  try {
    const response = await fetch('/api/auth/refresh-session', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.data?.user?.permissions || []
  } catch (err) {
    console.error('[getCurrentPermissions] Error fetching permissions:', err)
    return []
  }
}
