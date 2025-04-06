"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { identifyWaste, getReturnPlan, completeUndocking } from "@/lib/api"
import type { WasteItem, ReturnPlan, Container } from "@/lib/types"
import { fetchContainers } from "@/lib/api"
import { Trash2, RefreshCw, Check, X } from "lucide-react"
import ItemRetrievalSteps from "./item-retrieval-steps"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface WasteManagementProps {
  currentDate?: string
}

export default function WasteManagement({ currentDate }: WasteManagementProps) {
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([])
  const [selectedWasteItems, setSelectedWasteItems] = useState<string[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [returnPlan, setReturnPlan] = useState<ReturnPlan | null>(null)
  const [undockingParams, setUndockingParams] = useState({
    containerId: "",
    date: new Date().toISOString().split("T")[0],
    maxWeight: 100,
  })
  const [showUndockingDialog, setShowUndockingDialog] = useState(false)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [isUndocking, setIsUndocking] = useState(false)

  useEffect(() => {
    loadData()
  }, [currentDate])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const wasteData = await identifyWaste(currentDate)
      const containersData = await fetchContainers()
      setWasteItems(wasteData.wasteItems)
      setContainers(containersData)

      // Reset selected items when waste items change
      setSelectedWasteItems([])
    } catch (error) {
      console.error("Error loading waste data:", error)
      toast({
        title: "Error",
        description: "Failed to load waste management data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndockingParamChange = (field: string, value: any) => {
    setUndockingParams((prev) => ({ ...prev, [field]: value }))
  }

  // Update the handleCreateReturnPlan function to pass selected items
  const handleCreateReturnPlan = async () => {
    if (!undockingParams.containerId) {
      toast({
        title: "Validation Error",
        description: "Please select a container for undocking",
        variant: "destructive",
      })
      return
    }

    if (selectedWasteItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one waste item to return",
        variant: "warning",
      })
      return
    }

    setIsCreatingPlan(true)
    try {
      // Pass the selected waste items to the API
      const plan = await getReturnPlan(
        undockingParams.containerId,
        undockingParams.date,
        undockingParams.maxWeight,
        selectedWasteItems,
      )
      setReturnPlan(plan)
      setShowUndockingDialog(false)

      toast({
        title: "Return Plan Created",
        description: `Created plan for ${plan.returnManifest.returnItems.length} items`,
      })
    } catch (error) {
      console.error("Error creating return plan:", error)
      toast({
        title: "Plan Creation Error",
        description: "Failed to create return plan",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPlan(false)
    }
  }

  const handleCompleteUndocking = async () => {
    if (!returnPlan) return

    setIsUndocking(true)
    try {
      await completeUndocking(returnPlan.returnManifest.undockingContainerId, new Date().toISOString())
      await loadData() // Reload data after undocking
      setReturnPlan(null)

      toast({
        title: "Undocking Complete",
        description: "Container has been successfully undocked",
      })
    } catch (error) {
      console.error("Error completing undocking:", error)
      toast({
        title: "Undocking Error",
        description: "Failed to complete undocking process",
        variant: "destructive",
      })
    } finally {
      setIsUndocking(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedWasteItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  const selectAllItems = () => {
    if (selectedWasteItems.length === wasteItems.length) {
      // If all are selected, deselect all
      setSelectedWasteItems([])
    } else {
      // Otherwise, select all
      setSelectedWasteItems(wasteItems.map((item) => item.itemId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Waste Items</CardTitle>
            <CardDescription>Items that are expired or out of uses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button onClick={loadData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Loading..." : "Refresh"}
                </Button>

                {wasteItems.length > 0 && (
                  <Button variant="outline" size="sm" onClick={selectAllItems}>
                    {selectedWasteItems.length === wasteItems.length ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                )}
              </div>

              {wasteItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Select</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wasteItems.map((item) => (
                      <TableRow key={item.itemId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedWasteItems.includes(item.itemId)}
                            onCheckedChange={() => toggleItemSelection(item.itemId)}
                          />
                        </TableCell>
                        <TableCell>{item.itemId}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <span className={item.reason === "Expired" ? "text-red-500" : "text-amber-500"}>
                            {item.reason}
                          </span>
                        </TableCell>
                        <TableCell>{item.containerId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 border rounded-md">
                  <p>No waste items found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Items will appear here when they expire or run out of uses
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return Planning</CardTitle>
            <CardDescription>Prepare waste items for undocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Dialog open={showUndockingDialog} onOpenChange={setShowUndockingDialog}>
                <DialogTrigger asChild>
                  <Button
                    disabled={wasteItems.length === 0 || containers.length === 0 || selectedWasteItems.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Create Return Plan ({selectedWasteItems.length} items)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Return Plan</DialogTitle>
                    <DialogDescription>Specify the container for undocking and maximum weight.</DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="undockingContainer">Undocking Container</Label>
                      <Select
                        value={undockingParams.containerId}
                        onValueChange={(value) => handleUndockingParamChange("containerId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select container" />
                        </SelectTrigger>
                        <SelectContent>
                          {containers.length === 0 ? (
                            <SelectItem value="no-containers">No containers available</SelectItem>
                          ) : (
                            containers.map((container) => (
                              <SelectItem key={container.containerId} value={container.containerId}>
                                {container.containerId} ({container.zone})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="undockingDate">Undocking Date</Label>
                      <Input
                        id="undockingDate"
                        type="date"
                        value={undockingParams.date}
                        onChange={(e) => handleUndockingParamChange("date", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxWeight">Maximum Weight (kg)</Label>
                      <Input
                        id="maxWeight"
                        type="number"
                        value={undockingParams.maxWeight}
                        onChange={(e) => handleUndockingParamChange("maxWeight", Number(e.target.value))}
                      />
                    </div>

                    <div className="border rounded-md p-3 mt-2">
                      <Label className="mb-2 block">Selected Items ({selectedWasteItems.length})</Label>
                      <div className="max-h-[150px] overflow-y-auto">
                        {selectedWasteItems.length > 0 ? (
                          <ul className="space-y-1">
                            {wasteItems
                              .filter((item) => selectedWasteItems.includes(item.itemId))
                              .map((item) => (
                                <li key={item.itemId} className="text-sm flex justify-between">
                                  <span>
                                    {item.name} ({item.itemId})
                                  </span>
                                  <span className={item.reason === "Expired" ? "text-red-500" : "text-amber-500"}>
                                    {item.reason}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No items selected</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={handleCreateReturnPlan}
                      disabled={isCreatingPlan || selectedWasteItems.length === 0}
                    >
                      {isCreatingPlan ? "Creating..." : "Create Plan"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {returnPlan && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Return Plan</CardTitle>
                    <CardDescription>
                      Container: {returnPlan.returnManifest.undockingContainerId} | Date:{" "}
                      {new Date(returnPlan.returnManifest.undockingDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Return Steps:</h4>
                        <ol className="space-y-2 list-decimal list-inside">
                          {returnPlan.returnPlan.map((step, index) => (
                            <li key={index} className="text-sm">
                              Move {step.itemName} ({step.itemId}) from {step.fromContainer} to {step.toContainer}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Retrieval Steps:</h4>
                        <ItemRetrievalSteps steps={returnPlan.retrievalSteps} />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Return Manifest:</h4>
                        <p>Total Items: {returnPlan.returnManifest.returnItems.length}</p>
                        <p>Total Volume: {returnPlan.returnManifest.totalVolume.toLocaleString()} cm³</p>
                        <p>Total Weight: {returnPlan.returnManifest.totalWeight.toLocaleString()} kg</p>
                      </div>

                      <Button className="w-full" onClick={handleCompleteUndocking} disabled={isUndocking}>
                        {isUndocking ? "Processing..." : "Complete Undocking"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!returnPlan && (selectedWasteItems.length === 0 || wasteItems.length === 0) && (
                <div className="text-center p-4 border rounded-md">
                  <p>No waste items selected for return</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select waste items from the table to include in the return plan
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

