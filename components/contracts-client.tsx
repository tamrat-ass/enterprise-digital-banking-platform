"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { FileCheck, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface Contract {
  id: string
  title: string
  counterparty: string
  type: string
  status: string
  value?: number
  startDate?: string
  endDate?: string
  ownerName: string
}

export function ContractsClient() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContracts()
  }, [])

  async function fetchContracts() {
    try {
      setLoading(true)
      const response = await axios.get("/api/contracts")
      setContracts(response.data.data?.data || [])
    } catch (error) {
      toast.error("Failed to fetch contracts")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50"
      case "expired":
        return "text-red-600 bg-red-50"
      case "draft":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-blue-600 bg-blue-50"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contracts</h1>
        <p className="text-muted-foreground mt-1">Manage contract lifecycle and renewals</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading...</Card>
        ) : contracts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No contracts registered</p>
          </Card>
        ) : (
          contracts.map((contract) => (
            <Card key={contract.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{contract.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        contract.status,
                      )}`}
                    >
                      {contract.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {contract.counterparty} • {contract.type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Owner: {contract.ownerName}
                  </p>
                  {contract.endDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Expires: {format(new Date(contract.endDate), "MMM dd, yyyy")}
                    </div>
                  )}
                </div>
                {contract.value && (
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${contract.value.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
