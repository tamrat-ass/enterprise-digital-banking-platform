'use client'

import React from 'react'
import { TrendingUp, FileText, Users, Building2, AlertCircle, CheckCircle } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  trend?: {
    percentage: number
    direction: 'up' | 'down'
  }
  icon: React.ReactNode
  color: string
}

export function StatCard({ label, value, trend, icon, color }: StatCard) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp size={16} className={trend.direction === 'down' ? 'rotate-180' : ''} />
              <span>{trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.percentage)}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardStats() {
  const stats: StatCard[] = [
    {
      label: 'Total Documents',
      value: '2,451',
      trend: { percentage: 12, direction: 'up' },
      icon: <FileText className="text-white" size={24} />,
      color: 'bg-[#A71D4A]'
    },
    {
      label: 'Active Vendors',
      value: '87',
      trend: { percentage: 8, direction: 'up' },
      icon: <Building2 className="text-white" size={24} />,
      color: 'bg-[#B8274F]'
    },
    {
      label: 'Users Online',
      value: '45',
      trend: { percentage: 3, direction: 'up' },
      icon: <Users className="text-white" size={24} />,
      color: 'bg-[#8B1E3D]'
    },
    {
      label: 'Open Risks',
      value: '23',
      trend: { percentage: 5, direction: 'down' },
      icon: <AlertCircle className="text-white" size={24} />,
      color: 'bg-[#9D2854]'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
