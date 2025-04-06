"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLogs } from "@/lib/api"
import type { Log } from "@/lib/types"
import { Search, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface LogViewerProps {
  currentDate?: string
}

export default function LogViewer({ currentDate }: LogViewerProps) {
  const [logs, setLogs] = useState<Log[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    itemId: "",
    userId: "",
    actionType: "all",
  })

  useEffect(() => {
    fetchLogs()
  }, [currentDate])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const logsData = await getLogs(
        filters.startDate,
        filters.endDate,
        filters.itemId,
        filters.userId,
        filters.actionType === "all" ? undefined : filters.actionType,
      )
      setLogs(logsData.logs)

      if (logsData.logs.length === 0) {
        toast({
          title: "No Logs Found",
          description: "No logs match your search criteria",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch logs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const exportLogs = () => {
    // In a real app, this would generate a CSV file
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,User ID,Action Type,Item ID,From Container,To Container,Reason\n" +
      logs
        .map((log) => {
          return `${log.timestamp},${log.userId},${log.actionType},${log.itemId},${log.details.fromContainer || ""},${log.details.toContainer || ""},${log.details.reason || ""}`
        })
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `cargo_logs_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Logs Exported",
      description: `${logs.length} log entries exported to CSV`,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>View and filter system activity logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionType">Action Type</Label>
                <Select value={filters.actionType} onValueChange={(value) => handleFilterChange("actionType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={filters.actionType || "All actions"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="placement">Placement</SelectItem>
                    <SelectItem value="retrieval">Retrieval</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                    <SelectItem value="simulation">Simulation</SelectItem>
                    <SelectItem value="disposal">Disposal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemId">Item ID</Label>
                <Input
                  id="itemId"
                  placeholder="Filter by item ID"
                  value={filters.itemId}
                  onChange={(e) => handleFilterChange("itemId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Filter by user ID"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button onClick={fetchLogs} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Loading..." : "Search Logs"}
              </Button>

              <Button variant="outline" onClick={exportLogs} disabled={logs.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {isLoading ? "Loading logs..." : "No logs found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>
                        <span className={`capitalize ${getActionTypeColor(log.actionType)}`}>{log.actionType}</span>
                      </TableCell>
                      <TableCell>{log.itemId || "—"}</TableCell>
                      <TableCell>
                        {log.details.fromContainer && log.details.toContainer && (
                          <span>
                            {log.details.fromContainer} <span className="text-muted-foreground">→</span>{" "}
                            {log.details.toContainer}
                          </span>
                        )}
                        {log.details.reason && <span>{log.details.reason}</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getActionTypeColor(actionType: string): string {
  switch (actionType.toLowerCase()) {
    case "placement":
      return "text-green-600"
    case "retrieval":
      return "text-blue-600"
    case "import":
      return "text-purple-600"
    case "usage":
      return "text-amber-600"
    case "simulation":
      return "text-cyan-600"
    case "disposal":
      return "text-red-600"
    default:
      return ""
  }
}

