"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Plus } from "lucide-react"
import { toast } from "sonner"

interface Risk {
  id: string
  title: string
  category: string
  severity: string
  status: string
  likelihood: number
  impact: number
  ownerName: string
}

export function RisksClient() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchRisks()
  }, [])

  async function fetchRisks() {
    try {
      setLoading(true)
      const response = await axios.get("/api/risks")
      setRisks(response.data.data?.data || [])
    } catch (error) {
      toast.error("Failed to fetch risks")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50"
      case "high":
        return "text-orange-600 bg-orange-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-green-600 bg-green-50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-green-600 bg-green-50"
      case "mitigated":
        return "text-blue-600 bg-blue-50"
      case "monitored":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-red-600 bg-red-50"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Risk Management</h1>
          <p className="text-muted-foreground mt-1">Identify, assess, and mitigate organizational risks</p>
        </div>
        <Button onClick={() => router.push("/risks/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Register Risk
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
        ) : risks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No risks registered</p>
          </Card>
        ) : (
          risks.map((risk) => (
            <Card key={risk.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{risk.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(
                        risk.severity,
                      )}`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {risk.category} • Owner: {risk.ownerName}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      L:{risk.likelihood} I:{risk.impact}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        risk.status,
                      )}`}
                    >
                      {risk.status}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/risks/${risk.id}`)}
                >
                  View
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
