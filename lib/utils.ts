import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random UUID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format currency
 */
export function formatCurrency(amount: number | string | undefined): string {
  if (!amount) return "$0.00"
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

/**
 * Calculate days until date
 */
export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const time = d.getTime() - today.getTime()
  return Math.ceil(time / (1000 * 3600 * 24))
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  return daysUntil(date) < 0
}

/**
 * Check if date is soon (within 30 days)
 */
export function isSoon(date: Date | string): boolean {
  const days = daysUntil(date)
  return days >= 0 && days <= 30
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
  return text.length > length ? `${text.substring(0, length)}...` : text
}

/**
 * Calculate severity from likelihood and impact
 */
export function calculateSeverity(
  likelihood: number,
  impact: number,
): "low" | "medium" | "high" | "critical" {
  const score = likelihood * impact
  if (score >= 20) return "critical"
  if (score >= 12) return "high"
  if (score >= 6) return "medium"
  return "low"
}

/**
 * Get severity color
 */
export function getSeverityColor(
  severity: string,
): {
  text: string
  bg: string
  badge: string
} {
  switch (severity) {
    case "critical":
      return {
        text: "text-red-600",
        bg: "bg-red-50",
        badge: "bg-red-100 text-red-800",
      }
    case "high":
      return {
        text: "text-orange-600",
        bg: "bg-orange-50",
        badge: "bg-orange-100 text-orange-800",
      }
    case "medium":
      return {
        text: "text-yellow-600",
        bg: "bg-yellow-50",
        badge: "bg-yellow-100 text-yellow-800",
      }
    default:
      return {
        text: "text-green-600",
        bg: "bg-green-50",
        badge: "bg-green-100 text-green-800",
      }
  }
}

/**
 * Get status color
 */
export function getStatusColor(
  status: string,
): {
  text: string
  bg: string
} {
  const colors: Record<string, { text: string; bg: string }> = {
    active: { text: "text-green-600", bg: "bg-green-50" },
    approved: { text: "text-green-600", bg: "bg-green-50" },
    completed: { text: "text-green-600", bg: "bg-green-50" },
    compliant: { text: "text-green-600", bg: "bg-green-50" },
    draft: { text: "text-gray-600", bg: "bg-gray-50" },
    pending: { text: "text-blue-600", bg: "bg-blue-50" },
    open: { text: "text-red-600", bg: "bg-red-50" },
    rejected: { text: "text-red-600", bg: "bg-red-50" },
    expired: { text: "text-red-600", bg: "bg-red-50" },
    cancelled: { text: "text-red-600", bg: "bg-red-50" },
    on_hold: { text: "text-yellow-600", bg: "bg-yellow-50" },
    planning: { text: "text-blue-600", bg: "bg-blue-50" },
  }

  return colors[status] || { text: "text-gray-600", bg: "bg-gray-50" }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
