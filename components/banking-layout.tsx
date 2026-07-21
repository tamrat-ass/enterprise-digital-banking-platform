'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { 
  Menu, 
  X, 
  Bell, 
  MessageCircle, 
  Search, 
  ChevronDown,
  Upload,
  LogOut,
  FileText,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Lock,
  Users,
  BarChart3,
  History,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { theme } from '@/lib/theme'
import type { Permission } from '@/lib/rbac'

interface BankingLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    role: string
    department: string
    avatar?: string
    permissions: Permission[]
  }
}

// Map permissions to menu items (permission required to show)
const menuItemsConfig = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard', permission: 'dashboard.view', active: true },
  { icon: FolderOpen, label: 'File Management', href: '/file-management', permission: 'documents.view' },
  { icon: Upload, label: 'Upload Files', href: '/upload', permission: 'documents.upload' },
  { icon: FileText, label: 'My Files', href: '/my-files', permission: 'documents.view' },
  { icon: Trash2, label: 'Recycle Bin', href: '/recycle-bin', permission: 'documents.view' }, // Changed to documents.view so it shows with file management
]

const managementItemsConfig = [
  { icon: FolderOpen, label: 'Departments', href: '/departments', permission: 'documents.view' },
  { icon: FileText, label: 'Categories', href: '/categories', permission: 'categories.view' },
  { icon: Users, label: 'Users', href: '/users', permission: 'users.view' },
  { icon: Lock, label: 'Roles & Permissions', href: '/manage-roles', permission: 'roles.view' },
  { icon: History, label: 'Audit Logs', href: '/audit', permission: 'audit.view' },
  { icon: BarChart3, label: 'Reports', href: '/reports', permission: 'reports.view' },
]

export function BankingLayout({ children, user }: BankingLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileDropdown, setProfileDropdown] = useState(false)
  const router = useRouter()

  // Filter menu items based on user permissions
  const userPermissions = user?.permissions || []
  const hasAnyPermission = userPermissions.length > 0

  const menuItems = menuItemsConfig.filter(item => {
    // Check for exact match or partial match
    return userPermissions.some(p => 
      p === item.permission || // Exact match
      p.startsWith(item.permission.split('.')[0]) || // Module prefix match
      item.permission.startsWith(p.split('.')[0]) // Allow if user has broader permission
    )
  })

  const managementItems = managementItemsConfig.filter(item => {
    // Check for exact match or partial match
    return userPermissions.some(p => 
      p === item.permission || // Exact match
      p.startsWith(item.permission.split('.')[0]) || // Module prefix match
      item.permission.startsWith(p.split('.')[0]) // Allow if user has broader permission
    )
  })

  // If user has no permissions, show no-access message
  if (!hasAnyPermission) {
    return (
      <div className="flex h-screen items-center justify-center" style={{
        backgroundImage: `linear-gradient(to bottom right, ${theme.colors.primaryLight}, #E8D5DD)`
      }}>
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Your account has not been assigned any permissions yet. Please contact your system administrator.
          </p>
          <button
            onClick={async () => {
              await authClient.signOut()
              router.push('/sign-in')
            }}
            className="w-full px-4 py-2 text-white rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT SIDEBAR */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } text-white transition-all duration-300 shadow-lg flex flex-col overflow-hidden`}
        style={{
          backgroundImage: `linear-gradient(to bottom, ${theme.colors.primary}, ${theme.colors.primaryDark})`
        }}
      >
        
        {/* Logo */}
        <div className="p-6 border-b border-white border-opacity-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Lock className="text-[color:var(--primary)]" size={24} style={{ color: theme.colors.primary }} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold">AHADU BANK</h1>
                <p className="text-xs text-white">File Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-white px-4 py-2">MAIN MENU</p>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-white bg-opacity-20 text-white border-l-4 border-white'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </a>
            )
          })}

          {/* Management Section */}
          <p className="text-xs font-semibold text-white px-4 py-2 mt-6">MANAGEMENT</p>
          {managementItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white hover:bg-white hover:bg-opacity-10"
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white border-opacity-20 bg-gradient-to-b from-transparent to-black to-opacity-20 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="w-full flex items-center justify-center py-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors mb-2"
          >
            {sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
          <button 
            onClick={handleLogout}
            aria-label="Logout from application"
            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-600 hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" aria-hidden="true" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVIGATION */}
        <header className="bg-white border-b border-[#E6E6E6] shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            
            {/* Left - Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full pl-10 pr-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    '--tw-ring-color': theme.colors.primary 
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Right - Actions & Profile */}
            <div className="flex items-center gap-6 ml-8">
              
              {/* Current Date */}
              <span className="text-sm text-gray-600 hidden md:block">{currentDate}</span>

              {/* Quick Upload Button */}
              <button 
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: theme.colors.primary
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
              >
                <Upload size={18} />
                <span className="text-sm font-medium">Upload</span>
              </button>

            {/* Notifications */}
            <button 
              aria-label="View notifications" 
              className="relative p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell size={20} className="text-gray-600" aria-hidden="true" />
              <span 
                className="absolute top-1 right-1 w-2 h-2 bg-[#D32F2F] rounded-full" 
                aria-label="Unread notifications"
              ></span>
            </button>

            {/* Messages */}
            <button 
              aria-label="View messages" 
              className="relative p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
              title="Messages"
            >
              <MessageCircle size={20} className="text-gray-600" aria-hidden="true" />
              <span 
                className="absolute top-1 right-1 w-2 h-2 bg-[#FF9800] rounded-full"
                aria-label="Unread messages"
              ></span>
            </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="flex items-center gap-2 p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: theme.colors.primary }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="hidden md:block text-sm">
                    <p className="font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-gray-600">{user?.role || 'Administrator'}</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E6E6E6] rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-[#E6E6E6]">
                      <p className="font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                      <p className="text-xs text-gray-600">{user?.department || 'Administration'}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: theme.colors.primary }}>{user?.role || 'Administrator'}</p>
                    </div>
                    <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5]">
                      My Profile
                    </a>
                    <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5]">
                      Settings
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#F5F5F5]">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main 
          className="flex-1 overflow-auto"
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${theme.colors.primaryLight}, #E8D5DD)`
          }}
        >
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
