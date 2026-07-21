'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SecurePasswordDisplayProps {
  email: string
  password: string
  tempPassword?: boolean
}

/**
 * Secure Password Display Component
 * Displays user credentials securely with:
 * - Password masking by default
 * - Download option (not copy-paste)
 * - Expiration warning for temporary passwords
 * - Accessible UI with proper labels
 */
export function SecurePasswordDisplay({
  email,
  password,
  tempPassword = true,
}: SecurePasswordDisplayProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  const handleCopy = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const content = `User Credentials
=====================================

Email: ${email}
${tempPassword ? 'Temporary Password' : 'Password'}: ${password}

IMPORTANT SECURITY NOTES:
${tempPassword ? '• This password will expire after first login\n• User must change password on first login\n' : ''}• Store this file securely
• Do not share via email or messaging
• Delete this file after sharing credentials securely
• Never commit credentials to version control

Generated: ${new Date().toISOString()}
=====================================
    `
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${email}-credentials-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-6">
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email-field" className="block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <div className="flex gap-2">
          <input
            id="email-field"
            type="text"
            value={email}
            readOnly
            className="flex-1 px-3 py-2 border border-slate-200 rounded bg-white text-slate-900"
            aria-label="User email address"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(email, 'email')}
            aria-label={copied === 'email' ? 'Email copied' : 'Copy email'}
            className="min-w-[80px]"
          >
            {copied === 'email' ? (
              <>
                <span>✓ Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password-field" className="block text-sm font-medium text-slate-700">
          {tempPassword ? 'Temporary Password' : 'Password'}
        </label>
        <div className="flex gap-2">
          <input
            id="password-field"
            type={showPassword ? 'text' : 'password'}
            value={password}
            readOnly
            className="flex-1 px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 font-mono text-sm"
            aria-label={tempPassword ? 'Temporary password' : 'User password'}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(password, 'password')}
            aria-label={copied === 'password' ? 'Password copied' : 'Copy password'}
            className="min-w-[80px]"
          >
            {copied === 'password' ? (
              <>
                <span>✓ Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {tempPassword && (
        <div className="bg-yellow-100 border border-yellow-300 rounded p-3 flex gap-3">
          <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <p className="font-semibold">⚠️ Temporary Password Notice</p>
            <p className="mt-1">
              This password is temporary and will expire after the user's first login. 
              The user must set a new password during their first authentication.
            </p>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs text-blue-900">
          <strong>🔒 Security:</strong> Download credentials to a secure location. 
          Do not share this password via email or unsecured channels. 
          Delete downloaded files after sharing credentials securely.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="flex-1"
        >
          <Download size={16} className="mr-2" />
          Download Credentials
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowPassword(false)
            navigator.clipboard.writeText('')
          }}
          className="flex-1 text-red-600 hover:text-red-700"
          aria-label="Clear clipboard"
        >
          Clear Clipboard
        </Button>
      </div>

      {/* Expiration Info */}
      {tempPassword && (
        <div className="bg-orange-50 border border-orange-200 rounded p-3">
          <p className="text-xs text-orange-900">
            <strong>⏱️ Expiration:</strong> This temporary password is valid for 24 hours. 
            After first login, the user must create their own password.
          </p>
        </div>
      )}
    </div>
  )
}
