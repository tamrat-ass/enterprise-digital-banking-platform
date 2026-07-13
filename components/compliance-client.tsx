"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Plus, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface ComplianceItem {
  id: string
  title: string
  framework: string
  controlRef: string
  status: string
  ownerName?: string
}

export function ComplianceClient() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const response = await axios.get("/api/compliance")
      setItems(response.data.data?.data || [])
    } catch (error) {
      toast.error("Failed to fetch compliance items")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-green-600 bg-green-50"
      case "non_compliant":
        return "text-red-600 bg-red-50"
      case "partial":
        return "text-yellow-600 bg-yellow-50"
      case "remediation":
        return "text-orange-600 bg-orange-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Compliance & Controls</h1>
          <p className="text-muted-foreground mt-1">Track regulatory and internal control compliance</p>
        </div>
        <Button onClick={() => router.push("/compliance/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Control
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No compliance items tracked</p>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.status === "compliant" && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.framework} • {item.controlRef}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Owner: {item.ownerName || "Unassigned"}
                  </p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${getStatusColor(
                      item.status,
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/compliance/${item.id}`)}
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
