"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface Vendor {
  id: string
  name: string
  category: string
  status: string
  riskRating: string
  dueDiligenceStatus: string
  contactEmail?: string
}

export function VendorsClient() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    try {
      setLoading(true)
      const response = await axios.get("/api/vendors")
      setVendors(response.data.data?.data || [])
    } catch (error) {
      toast.error("Failed to fetch vendors")
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Vendors & Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage vendor relationships and compliance</p>
        </div>
        <Button onClick={() => router.push("/vendors/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
        ) : vendors.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No vendors registered</p>
          </Card>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{vendor.name}</h3>
                    {vendor.riskRating === "high" || vendor.riskRating === "critical" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vendor.category} • {vendor.status}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getRiskColor(
                        vendor.riskRating,
                      )}`}
                    >
                      {vendor.riskRating} risk
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      {vendor.dueDiligenceStatus}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/vendors/${vendor.id}`)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
