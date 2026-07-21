'use client'

import React from 'react'
import { COLORS } from '@/lib/colors'
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  HardDrive,
  Users,
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendColor?: 'green' | 'red' | 'neutral'
  bgColor: string
}

function StatCard({ icon, label, value, trend, trendColor = 'neutral', bgColor }: StatCardProps) {
  return (
    <div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`${COLORS.text.secondary} text-sm font-medium`}>{label}</p>
          <p className={`text-3xl font-bold ${COLORS.text.primary} mt-2`}>{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${
              trendColor === 'green' ? COLORS.status.success.text : 
              trendColor === 'red' ? COLORS.status.error.text : 
              COLORS.text.secondary
            }`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`${bgColor} p-4 rounded-xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Sample data for charts
const uploadTrendData = [
  { month: 'Jan', uploads: 45 },
  { month: 'Feb', uploads: 52 },
  { month: 'Mar', uploads: 48 },
  { month: 'Apr', uploads: 61 },
  { month: 'May', uploads: 55 },
  { month: 'Jun', uploads: 67 },
]

const departmentData = [
  { name: 'Finance', value: 240, fill: '#6B4423' },
  { name: 'HR', value: 160, fill: '#8B6F47' },
  { name: 'Legal', value: 120, fill: '#A0826D' },
  { name: 'Operations', value: 200, fill: '#4A2E19' },
]

const approvalTrendData = [
  { week: 'W1', approved: 85, pending: 15, rejected: 5 },
  { week: 'W2', approved: 90, pending: 8, rejected: 4 },
  { week: 'W3', approved: 82, pending: 12, rejected: 6 },
  { week: 'W4', approved: 88, pending: 10, rejected: 5 },
]

const storageData = [
  { month: 'Week 1', used: 45 },
  { month: 'Week 2', used: 52 },
  { month: 'Week 3', used: 48 },
  { month: 'Week 4', used: 61 },
]

export function BankingDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>Dashboard</h1>
        <p className={`${COLORS.text.secondary} mt-2`}>Welcome back! Here's your file management overview.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<FileText className="text-white" size={28} />}
          label="Total Files"
          value="2,451"
          trend="↑ 12% this month"
          trendColor="green"
          bgColor="bg-[#A71D4A]"
        />
        <StatCard
          icon={<AlertCircle className="text-white" size={28} />}
          label="Pending Approval"
          value="47"
          trend="3 urgent items"
          trendColor="red"
          bgColor="bg-[#B8274F]"
        />
        <StatCard
          icon={<CheckCircle className="text-white" size={28} />}
          label="Approved Files"
          value="2,156"
          trend="↑ 8% this week"
          trendColor="green"
          bgColor="bg-[#8B1E3D]"
        />
        <StatCard
          icon={<HardDrive className="text-white" size={28} />}
          label="Storage Used"
          value="245.6 GB"
          trend="of 1 TB • 24% used"
          trendColor="neutral"
          bgColor="bg-[#9D2854]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<XCircle className="text-white" size={24} />}
            label="Rejected Files"
            value="28"
            trend="Requires action"
            trendColor="neutral"
            bgColor="bg-[#C11F54]"
          />
          <StatCard
            icon={<Users className="text-white" size={24} />}
            label="Active Users"
            value="156"
            trend="↑ 5% this month"
            trendColor="green"
            bgColor="bg-[#7D1B35]"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Trend */}
        <div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-lg font-bold ${COLORS.text.primary} mb-6`}>Monthly Upload Statistics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={uploadTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="uploads" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Files by Department */}
        <div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-2xl p-6 shadow-sm`}>
          <h2 className={`text-lg font-bold ${COLORS.text.primary} mb-6`}>Files by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Trend */}
        <div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-2xl p-6 shadow-sm lg:col-span-1`}>
          <h2 className={`text-lg font-bold ${COLORS.text.primary} mb-6`}>Approval Trend (Weekly)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={approvalTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="approved" fill="#059669" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rejected" fill="#dc2626" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Storage Usage */}
        <div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-2xl p-6 shadow-sm lg:col-span-1`}>
          <h2 className={`text-lg font-bold ${COLORS.text.primary} mb-6`}>Storage Usage (Weekly)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="used" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.1} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-2xl p-6 shadow-sm`}>
        <h2 className={`text-lg font-bold ${COLORS.text.primary} mb-6`}>Recent Activities</h2>
        <div className="space-y-4">
          {[
            { action: 'File Approved', file: 'Q2_Financial_Report_2024.pdf', user: 'Sarah Johnson', time: '2 hours ago', type: 'success' },
            { action: 'File Uploaded', file: 'Branch_Performance_May.xlsx', user: 'John Martinez', time: '4 hours ago', type: 'info' },
            { action: 'Approval Rejected', file: 'Legal_Contract_Draft.docx', user: 'Emma Thompson', time: '6 hours ago', type: 'danger' },
            { action: 'File Shared', file: 'Budget_2024.pdf', user: 'Michael Chen', time: '8 hours ago', type: 'info' },
            { action: 'Permission Changed', file: 'Compliance_Audit.docx', user: 'Lisa Anderson', time: '1 day ago', type: 'warning' },
          ].map((activity, index) => (
            <div key={index} className={`flex items-start gap-4 pb-4 border-b ${COLORS.border.light} last:border-b-0`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                activity.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                activity.type === 'danger' ? 'bg-red-100 text-red-700' :
                activity.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                <BarChart3 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${COLORS.text.primary}`}>{activity.action}</p>
                <p className={`text-sm ${COLORS.text.secondary}`}>{activity.file}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`text-xs ${COLORS.text.tertiary}`}>By {activity.user}</span>
                  <span className={`text-xs ${COLORS.text.tertiary}`}>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
