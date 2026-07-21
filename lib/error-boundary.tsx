'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary - Catches React component errors
 * Prevents entire page from crashing when a component fails
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[ErrorBoundary] Caught error:', error.message)
    } else {
      console.error('[ErrorBoundary] Full error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-slate-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-red-700">
                <strong>Error Details:</strong> {this.state.error?.name}
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={this.handleReset}
                className="flex-1"
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>

            <p className="text-xs text-slate-500 mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
