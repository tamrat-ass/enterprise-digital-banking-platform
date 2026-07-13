'use client'

import React, { useState } from 'react'
import { 
  Menu, 
  X, 
  Bell, 
  MessageCircle, 
  Search, 
  ChevronDown,
  Upload,
  Settings,
  LogOut,
  FileText,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Lock,
  Users,
  BarChart3,
  History
} from 'lucide-react'

interface BankingLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    role: string
    department: string
    avatar?: string
  }
}

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
  { icon: FolderOpen, label: 'File Management', href: '/file-management' },
  { icon: Upload, label: 'Upload Files', href: '/upload' },
  { icon: FileText, label: 'My Files', href: '/my-files' },
  { icon: AlertCircle, label: 'Pending Approval', href: '/pending' },
  { icon: CheckCircle, label: 'Approved Files', href: '/approved' },
  { icon: Lock, label: 'Rejected Files', href: '/rejected' },
  { icon: Users, label: 'Shared Files', href: '/shared' },
]

const managementItems = [
  { icon: FolderOpen, label: 'Departments', href: '/departments' },
  { icon: FileText, label: 'Categories', href: '/categories' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: Lock, label: 'Roles & Permissions', href: '/roles' },
  { icon: History, label: 'Audit Logs', href: '/audit' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
]

export function BankingLayout({ children, user }: BankingLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileDropdown, setProfileDropdown] = useState(false)

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT SIDEBAR */}
      <aside className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-[#A71D4A] to-[#7D1B35] text-white transition-all duration-300 shadow-lg flex flex-col overflow-hidden`}>
        
        {/* Logo */}
        <div className="p-6 border-b border-white border-opacity-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Lock className="text-[#A71D4A]" size={24} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold">AHADU BANK</h1>
                <p className="text-xs text-gray-300">File Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 px-4 py-2">MAIN MENU</p>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-white bg-opacity-20 text-white border-l-4 border-white'
                    : 'text-gray-300 hover:bg-white hover:bg-opacity-10'
                }`}
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </a>
            )
          })}

          {/* Management Section */}
          <p className="text-xs font-semibold text-gray-400 px-4 py-2 mt-6">MANAGEMENT</p>
          {managementItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-white hover:bg-opacity-10"
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
            className="w-full flex items-center justify-center py-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors mb-2"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-600 hover:bg-opacity-10 rounded-lg transition-colors">
            <LogOut size={20} className="flex-shrink-0" />
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
                  className="w-full pl-10 pr-4 py-2 border border-[#E6E6E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A71D4A] focus:border-transparent"
                />
              </div>
            </div>

            {/* Right - Actions & Profile */}
            <div className="flex items-center gap-6 ml-8">
              
              {/* Current Date */}
              <span className="text-sm text-gray-600 hidden md:block">{currentDate}</span>

              {/* Quick Upload Button */}
              <button className="flex items-center gap-2 bg-[#A71D4A] text-white px-4 py-2 rounded-lg hover:bg-[#7D1B35] transition-colors">
                <Upload size={18} />
                <span className="text-sm font-medium">Upload</span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#D32F2F] rounded-full"></span>
              </button>

              {/* Messages */}
              <button className="relative p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
                <MessageCircle size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF9800] rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="flex items-center gap-2 p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-[#A71D4A] rounded-full flex items-center justify-center text-white text-sm font-bold">
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
                      <p className="text-xs text-[#A71D4A] font-medium mt-1">{user?.role || 'Administrator'}</p>
                    </div>
                    <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5]">
                      My Profile
                    </a>
                    <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5F5F5]">
                      Settings
                    </a>
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#F5F5F5]">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-[#F5E6E9] to-[#E8D5DD]">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
