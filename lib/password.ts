/**
 * Password Security Utilities
 * Uses bcryptjs for secure password hashing (industry standard for enterprise)
 */

import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

/**
 * Hash a password using bcryptjs
 * Default: 12 rounds (takes ~100ms on modern hardware)
 * 
 * Security considerations:
 * - 12 rounds is the industry standard for enterprise applications
 * - Provides protection against brute force attacks
 * - Bcrypt automatically handles salt generation
 */
export async function hashPassword(password: string, rounds: number = 12): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  
  try {
    return await bcrypt.hash(password, rounds)
  } catch (err) {
    console.error('[Password] Error hashing password:', err)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against its hash
 * Returns true if password matches the hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (err) {
    console.error('[Password] Error verifying password:', err)
    return false
  }
}

/**
 * Generate a secure random token for invitations or password resets
 * Returns a 32-byte hex string (256 bits of entropy)
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Validate password strength
 * Enterprise requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)')
  }
  
  // Reject common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain 3 or more repeated characters')
  }
  
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890)/i.test(password)) {
    errors.push('Password cannot contain sequential characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate a display-friendly token (not for security, for user communication)
 * Used when showing invitation codes to administrators
 */
export function generateDisplayToken(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
