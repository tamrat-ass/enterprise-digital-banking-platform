/**
 * Logger utility for development vs production
 * Prevents console logging in production (prevents info disclosure)
 */

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data)
    }
  },

  /**
   * Error logging - always (for debugging production issues)
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },

  /**
   * Warning logging - only in development
   */
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, data)
    }
  },

  /**
   * Info logging - only in development
   */
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, data)
    }
  },
}
