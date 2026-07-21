"use client"

import { Card } from "@/components/ui/card"
import { COLORS } from "@/lib/colors"
import { BarChart3 } from "lucide-react"

export function AnalyticsClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>Analytics & Reporting</h1>
        <p className={`${COLORS.text.secondary} mt-1`}>Executive dashboards and business intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={`p-8 text-center ${COLORS.text.tertiary}`}>
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 opacity-50 ${COLORS.icons.secondary}`} />
          <p className="font-medium">Document Analytics</p>
          <p className="text-xs mt-2">Trends and metrics coming soon</p>
        </Card>
        <Card className={`p-8 text-center ${COLORS.text.tertiary}`}>
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 opacity-50 ${COLORS.icons.secondary}`} />
          <p className="font-medium">Approval Performance</p>
          <p className="text-xs mt-2">SLA tracking and metrics</p>
        </Card>
        <Card className={`p-8 text-center ${COLORS.text.tertiary}`}>
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 opacity-50 ${COLORS.icons.secondary}`} />
          <p className="font-medium">Risk Dashboard</p>
          <p className="text-xs mt-2">Risk heatmaps and trends</p>
        </Card>
        <Card className={`p-8 text-center ${COLORS.text.tertiary}`}>
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 opacity-50 ${COLORS.icons.secondary}`} />
          <p className="font-medium">Compliance Scorecard</p>
          <p className="text-xs mt-2">Framework compliance status</p>
        </Card>
        <Card className={`p-8 text-center ${COLORS.text.tertiary}`}>
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 opacity-50 ${COLORS.icons.secondary}`} />
          <p className="font-medium">Vendor Performance</p>
          <p className="text-xs mt-2">SLA compliance and metrics</p>
        </Card>
        <Card className={`p-8 text-center ${COLORS.text.tertiary}`}>
          <BarChart3 className={`h-12 w-12 mx-auto mb-4 opacity-50 ${COLORS.icons.secondary}`} />
          <p className="font-medium">Audit Insights</p>
          <p className="text-xs mt-2">Activity and change tracking</p>
        </Card>
      </div>
    </div>
  )
}
