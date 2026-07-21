'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { COLORS } from '@/lib/colors'

function SetNewPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    errors: string[]
  }>({ score: 0, errors: [] })

  // Validate password strength in real-time
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, errors: [] })
      return
    }

    const errors: string[] = []
    let score = 0

    // Length check
    if (password.length < 8) {
      errors.push('At least 8 characters')
    } else {
      score++
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter')
    } else {
      score++
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter')
    } else {
      score++
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('One number')
    } else {
      score++
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('One special character (!@#$%^&*)')
    } else {
      score++
    }

    setPasswordStrength({ score, errors })
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate inputs
    if (!userId || !email) {
      setError('Invalid request. Missing user information.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length !== confirmPassword.length) {
      setError('Password lengths must be the same')
      return
    }

    if (passwordStrength.errors.length > 0) {
      setError(`Password does not meet requirements: ${passwordStrength.errors.join(', ')}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password')
      }

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!userId || !email) {
    return (
      <div className={`min-h-screen ${COLORS.background.page} flex items-center justify-center p-4`}>
        <div className={`${COLORS.background.card} rounded-lg ${COLORS.shadow.xl} max-w-md w-full p-8 text-center`}>
          <AlertCircle size={48} className={`mx-auto ${COLORS.status.error.text} mb-4`} />
          <h1 className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}>Invalid Request</h1>
          <p className={`${COLORS.text.secondary} mb-6`}>
            The password reset link is missing required information. Please try again from the user management page.
          </p>
          <button
            onClick={() => router.push('/admin/users')}
            className={`px-6 py-2 ${COLORS.button.primary} text-white rounded-lg font-medium transition-colors`}
          >
            Back to Users
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className={`min-h-screen ${COLORS.background.page} flex items-center justify-center p-4`}>
        <div className={`${COLORS.background.card} rounded-lg ${COLORS.shadow.xl} max-w-md w-full p-8 text-center`}>
          <CheckCircle size={64} className={`mx-auto ${COLORS.status.success.text} mb-4`} />
          <h1 className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}>Password Set Successfully!</h1>
          <p className={`${COLORS.text.secondary} mb-6`}>
            Your new password has been set. Redirecting to dashboard...
          </p>
          <div className="flex justify-center">
            <Loader2 className={`animate-spin ${COLORS.icons.primary}`} size={24} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${COLORS.background.page} flex items-center justify-center p-4`}>
      <div className={`${COLORS.background.card} rounded-lg ${COLORS.shadow.xl} max-w-md w-full`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 text-center rounded-t-lg">
          <Lock size={40} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Set Your Password</h1>
          <p className="text-blue-100 mt-2">Create a strong, secure password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* User Info */}
          <div className={`${COLORS.status.info.bg} border ${COLORS.status.info.border} rounded-lg p-4`}>
            <p className={`text-sm ${COLORS.text.secondary}`}>Email:</p>
            <p className={`font-semibold ${COLORS.text.primary}`}>{email}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`${COLORS.status.error.bg} border ${COLORS.status.error.border} rounded-lg p-4 flex gap-3 ${COLORS.status.error.text} text-sm`}>
              <AlertCircle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className={`block text-sm font-medium ${COLORS.text.light} mb-2`}>
              Create Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 border ${COLORS.border.light} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10`}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-3.5 ${COLORS.icons.secondary} hover:text-slate-600`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        i <= passwordStrength.score ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${COLORS.text.tertiary}`}>
                  {passwordStrength.score === 5
                    ? '✓ Strong password'
                    : `Needs: ${passwordStrength.errors.join(', ')}`}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className={`block text-sm font-medium ${COLORS.text.light} mb-2`}>
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={`w-full px-4 py-3 border ${COLORS.border.light} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={loading}
              required
            />
            {password && confirmPassword && (
              <>
                {confirmPassword.length !== password.length && (
                  <p className={`text-xs ${COLORS.status.error.text} mt-1`}>Password length must match</p>
                )}
                {confirmPassword.length === password.length && password !== confirmPassword && (
                  <p className={`text-xs ${COLORS.status.error.text} mt-1`}>Passwords do not match</p>
                )}
                {password === confirmPassword && password.length >= 8 && (
                  <p className={`text-xs ${COLORS.status.success.text} mt-1`}>✓ Passwords match</p>
                )}
              </>
            )}
          </div>

          {/* Password Requirements */}
          <div className={`${COLORS.status.info.bg} border ${COLORS.status.info.border} rounded-lg p-4`}>
            <p className={`text-sm font-medium ${COLORS.text.light} mb-2`}>Password Requirements:</p>
            <ul className={`text-xs ${COLORS.text.secondary} space-y-1`}>
              <li className={password.length < 8 ? 'text-slate-400' : COLORS.status.success.text}>
                {password.length < 8 ? '○' : '✓'} At least 8 characters
              </li>
              <li className={!/[A-Z]/.test(password) ? 'text-slate-400' : COLORS.status.success.text}>
                {!/[A-Z]/.test(password) ? '○' : '✓'} One uppercase letter (A-Z)
              </li>
              <li className={!/[a-z]/.test(password) ? 'text-slate-400' : COLORS.status.success.text}>
                {!/[a-z]/.test(password) ? '○' : '✓'} One lowercase letter (a-z)
              </li>
              <li className={!/\d/.test(password) ? 'text-slate-400' : COLORS.status.success.text}>
                {!/\d/.test(password) ? '○' : '✓'} One number (0-9)
              </li>
              <li className={!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-slate-400' : COLORS.status.success.text}>
                {!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '○' : '✓'} One special character (!@#$%^&*)
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || password !== confirmPassword || password.length !== confirmPassword.length || passwordStrength.errors.length > 0}
            className={`w-full py-3 ${COLORS.button.primary} text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Setting Password...
              </>
            ) : (
              'Set Password'
            )}
          </button>

          {/* Help Text */}
          <p className={`text-xs ${COLORS.text.tertiary} text-center`}>
           Your password is encrypted and securely stored. Never share it with anyone.
          </p>
        </form>
      </div>
    </div>
  )
}

// Wrapper with Suspense boundary
export default function SetNewPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={`min-h-screen ${COLORS.background.page} flex items-center justify-center`}>
          <div className={`${COLORS.text.primary} text-center`}>
            <Loader2 className={`animate-spin mb-4 mx-auto ${COLORS.icons.primary}`} size={40} />
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <SetNewPasswordContent />
    </Suspense>
  )
}
