'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentsList } from './documents-list'
import { VendorsList } from './vendors-list'
import { ProjectsList } from './projects-list'
import { RisksList } from './risks-list'
import { Card } from '@/components/ui/card'

interface DashboardStats {
  docs?: any
  projects?: any
  vendors?: any
  approvals?: any
  risks?: any
  compliance?: any
}

const StatBox = ({ label, value, color = 'bg-amber-600' }: { label: string; value: string | number; color?: string }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
)

export function EnhancedDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Documents" value={stats.docs?.total || 0} />
        <StatBox label="Active Vendors" value={stats.vendors?.total || 0} />
        <StatBox label="Active Projects" value={stats.projects?.active || 0} />
        <StatBox label="Open Risks" value={stats.risks?.open || 0} />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Document Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-sm font-medium">{stats.docs?.approved || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Draft</span>
                  <span className="text-sm font-medium">{stats.docs?.draft || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Published</span>
                  <span className="text-sm font-medium">{stats.docs?.total || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Approval Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium">{stats.approvals?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-sm font-medium">{stats.approvals?.approved || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="text-sm font-medium">{stats.approvals?.rejected || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.risks?.critical || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">High</p>
                <p className="text-2xl font-bold text-orange-600">{stats.risks?.high || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Open</p>
                <p className="text-2xl font-bold">{stats.risks?.open || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Mitigated</p>
                <p className="text-2xl font-bold text-green-600">{stats.risks?.mitigated || 0}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentsList />
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Vendor Management</h2>
            <VendorsList />
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Active Projects</h2>
            <ProjectsList />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risks Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Risk Assessment</h2>
        <RisksList />
      </Card>
    </div>
  )
}
