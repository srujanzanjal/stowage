"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
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
import { fetchItems, importItems, getPlacementRecommendations } from "@/lib/api"
import type { Item, Container, PlacementRecommendation } from "@/lib/types"
import { fetchContainers } from "@/lib/api"
import { Upload, Plus, RefreshCw, Search } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Pagination } from "@/components/ui/pagination"

export default function ItemManagement() {
  const [items, setItems] = useState<Item[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlacing, setIsPlacing] = useState(false)
  const [placementResults, setPlacementResults] = useState<PlacementRecommendation | null>(null)
  const [newItem, setNewItem] = useState<Partial<Item>>({
    itemId: "",
    name: "",
    width: 0,
    depth: 0,
    height: 0,
    mass: 0,
    priority: 50,
    expiryDate: "",
    usageLimit: 0,
    preferredZone: "",
  })
  const [showNewItemDialog, setShowNewItemDialog] = useState(false)

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterZone, setFilterZone] = useState<string>("all")

  // Get unique zones for filtering
  const uniqueZones = useMemo(() => {
    const zones = new Set<string>()
    items.forEach((item) => {
      if (item.preferredZone) {
        zones.add(item.preferredZone)
      }
    })
    return Array.from(zones)
  }, [items])

  // Filter and paginate items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesZone = filterZone === "all" || filterZone === "" || item.preferredZone === filterZone

      return matchesSearch && matchesZone
    })
  }, [items, searchTerm, filterZone])

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredItems.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredItems, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const itemsData = await fetchItems()
      const containersData = await fetchContainers()
      setItems(itemsData)
      setContainers(containersData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file first",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const result = await importItems(csvFile)

      if (result.success) {
        toast({
          title: "Success",
          description: `Imported ${result.itemsImported} items successfully`,
        })

        // Clear the file input
        setCsvFile(null)
        const fileInput = document.getElementById("csv-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        // Reload data to show the imported items
        await loadData()
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading items:", error)
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handlePlacement = async () => {
    setIsPlacing(true)
    try {
      const recommendations = await getPlacementRecommendations(items, containers)
      setPlacementResults(recommendations)

      if (recommendations.success) {
        toast({
          title: "Placement Calculated",
          description: `${recommendations.placements.length} items placed successfully`,
        })
      } else {
        toast({
          title: "Placement Issues",
          description: "Some items could not be placed optimally",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error getting placement recommendations:", error)
      toast({
        title: "Error",
        description: "Failed to calculate placements",
        variant: "destructive",
      })
    } finally {
      setIsPlacing(false)
    }
  }

  const handleNewItemChange = (field: string, value: any) => {
    setNewItem((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddNewItem = async () => {
    // Validate the new item
    if (!newItem.name || !newItem.width || !newItem.height || !newItem.depth) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would call an API to add the item
    const newItemWithId: Item = {
      ...(newItem as Item),
      itemId: newItem.itemId || `ITEM-${Math.floor(Math.random() * 1000)}`,
    }

    setItems((prev) => [...prev, newItemWithId])
    setShowNewItemDialog(false)

    toast({
      title: "Item Added",
      description: `${newItemWithId.name} has been added to inventory`,
    })

    setNewItem({
      itemId: "",
      name: "",
      width: 0,
      depth: 0,
      height: 0,
      mass: 0,
      priority: 50,
      expiryDate: "",
      usageLimit: 0,
      preferredZone: "",
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Items</CardTitle>
            <CardDescription>Upload a CSV file with item data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-upload">CSV File</Label>
                <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} />
              </div>
              <Button onClick={handleUpload} disabled={!csvFile || isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placement Recommendations</CardTitle>
            <CardDescription>Get optimal placement for items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={handlePlacement} disabled={isPlacing || items.length === 0 || containers.length === 0}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isPlacing ? "Calculating..." : "Calculate Placement"}
              </Button>

              {placementResults && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Placement Results:</h3>
                  <p>{placementResults.placements.length} items placed successfully</p>
                  {placementResults.rearrangements.length > 0 && (
                    <p>{placementResults.rearrangements.length} rearrangements needed</p>
                  )}
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would apply the placements
                      toast({
                        title: "Placements Applied",
                        description: "Item placements have been applied",
                      })
                    }}
                  >
                    Apply Placements
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Item Inventory</CardTitle>
            <CardDescription>Manage your cargo items ({filteredItems.length} items)</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
            <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                  <DialogDescription>Enter the details for the new cargo item.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemId">Item ID</Label>
                      <Input
                        id="itemId"
                        value={newItem.itemId}
                        onChange={(e) => handleNewItemChange("itemId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={(e) => handleNewItemChange("name", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={newItem.width || ""}
                        onChange={(e) => handleNewItemChange("width", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depth">Depth (cm)</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={newItem.depth || ""}
                        onChange={(e) => handleNewItemChange("depth", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={newItem.height || ""}
                        onChange={(e) => handleNewItemChange("height", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mass">Mass (kg)</Label>
                      <Input
                        id="mass"
                        type="number"
                        value={newItem.mass || ""}
                        onChange={(e) => handleNewItemChange("mass", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority (1-100)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="100"
                        value={newItem.priority || ""}
                        onChange={(e) => handleNewItemChange("priority", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={newItem.expiryDate}
                        onChange={(e) => handleNewItemChange("expiryDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usageLimit">Usage Limit</Label>
                      <Input
                        id="usageLimit"
                        type="number"
                        value={newItem.usageLimit || ""}
                        onChange={(e) => handleNewItemChange("usageLimit", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredZone">Preferred Zone</Label>
                    <Select
                      value={newItem.preferredZone}
                      onValueChange={(value) => handleNewItemChange("preferredZone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={newItem.preferredZone || "Select zone"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Crew Quarters">Crew Quarters</SelectItem>
                        <SelectItem value="Airlock">Airlock</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Medical Bay">Medical Bay</SelectItem>
                        <SelectItem value="Greenhouse">Greenhouse</SelectItem>
                        <SelectItem value="Storage Bay">Storage Bay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleAddNewItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filter controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID or name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                />
              </div>
              <div className="w-full md:w-[200px]">
                <Select
                  value={filterZone}
                  onValueChange={(value) => {
                    setFilterZone(value)
                    setCurrentPage(1) // Reset to first page on filter change
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {uniqueZones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[150px]">
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number.parseInt(value))
                    setCurrentPage(1) // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dimensions (cm)</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Uses Left</TableHead>
                  <TableHead>Preferred Zone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {isLoading ? "Loading items..." : "No items found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell>{item.itemId}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {item.width.toFixed(1)} × {item.depth.toFixed(1)} × {item.height.toFixed(1)}
                      </TableCell>
                      <TableCell>{item.priority}</TableCell>
                      <TableCell>
                        {item.expiryDate === "2099-12-31" || item.expiryDate === "N/A"
                          ? "N/A"
                          : new Date(item.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{item.usageLimit}</TableCell>
                      <TableCell>{item.preferredZone}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

