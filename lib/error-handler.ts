/**
 * Centralized error handling utility
 * Prevents duplicate error handling logic across components
 * Improves maintainability and consistency
 */

export type ErrorType = 'network' | 'validation' | 'auth' | 'notfound' | 'server' | 'unknown'

export interface AppError {
  type: ErrorType
  message: string
  statusCode?: number
  originalError?: Error
}

/**
 * Parse error to consistent format
 */
export function parseError(error: unknown): AppError {
  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
      originalError: error as Error,
    }
  }

  // Handle API errors
  if (error instanceof Response) {
    const status = error.status
    if (status === 401 || status === 403) {
      return {
        type: 'auth',
        message: 'You do not have permission to perform this action',
        statusCode: status,
      }
    }
    if (status === 404) {
      return {
        type: 'notfound',
        message: 'Resource not found',
        statusCode: status,
      }
    }
    if (status >= 500) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        statusCode: status,
      }
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
      originalError: error,
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
    }
  }

  // Fallback
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
  }
}

/**
 * User-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<ErrorType, string> = {
    network: 'Network connection error. Please check your internet connection.',
    validation: 'Please check your input and try again.',
    auth: 'You do not have permission to perform this action.',
    notfound: 'The requested resource was not found.',
    server: 'Server error. Our team has been notified. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again.',
  }

  return messages[error.type] || messages.unknown
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: AppError, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    const prefix = context ? `[${context}]` : '[Error]'
    console.error(`${prefix} ${error.type}: ${error.message}`, error.originalError)
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on auth errors
      if (error instanceof Response && (error.status === 401 || error.status === 403)) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError
}
