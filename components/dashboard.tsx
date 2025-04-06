"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Package, AlertTriangle, Clock, MapPin } from "lucide-react"
import ContainerVisualization from "./container-visualization"
import { fetchContainers, fetchItems, searchItem, retrieveItem } from "@/lib/api"
import type { Container, Item, SearchResult } from "@/lib/types"
import ItemRetrievalSteps from "./item-retrieval-steps"
import { toast } from "@/components/ui/use-toast"

interface DashboardProps {
  currentDate: string
}

export default function Dashboard({ currentDate }: DashboardProps) {
  const [containers, setContainers] = useState<Container[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [retrieving, setRetrieving] = useState(false)
  const [stats, setStats] = useState({
    totalItems: 0,
    highPriorityItems: 0,
    expiringItems: 0,
    wasteItems: 0,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const containersData = await fetchContainers()
        const itemsData = await fetchItems()

        setContainers(containersData)
        setItems(itemsData)

        // Calculate stats
        const highPriority = itemsData.filter((item) => item.priority > 70).length

        // Items expiring in the next 7 days
        const sevenDaysLater = new Date(currentDate)
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
        const expiring = itemsData.filter((item) => {
          if (item.expiryDate === "N/A" || item.expiryDate === "2099-12-31") return false
          const expiryDate = new Date(item.expiryDate)
          return expiryDate <= sevenDaysLater && expiryDate >= new Date(currentDate)
        }).length

        // Items that are waste (expired or out of uses)
        const waste = itemsData.filter((item) => {
          if (item.expiryDate === "N/A" || item.expiryDate === "2099-12-31") return false
          const expiryDate = new Date(item.expiryDate)
          return expiryDate < new Date(currentDate) || item.usageLimit <= 0
        }).length

        setStats({
          totalItems: itemsData.length,
          highPriorityItems: highPriority,
          expiringItems: expiring,
          wasteItems: waste,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [currentDate])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a search term",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await searchItem(searchQuery)
      setSearchResult(result)

      if (!result.found) {
        toast({
          title: "Item Not Found",
          description: "No matching item found in inventory",
          variant: "warning",
        })
      } else {
        toast({
          title: "Item Found",
          description: `Found ${result.item.name} in ${result.item.zone}`,
        })
      }
    } catch (error) {
      console.error("Error searching for item:", error)
      toast({
        title: "Search Error",
        description: "An error occurred while searching for the item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetrieveItem = async () => {
    if (!searchResult || !searchResult.found) return

    setRetrieving(true)
    try {
      const result = await retrieveItem(
        searchResult.item.itemId,
        "current-user", // In a real app, this would be the actual user ID
        new Date().toISOString(),
      )

      if (result.success) {
        toast({
          title: "Item Retrieved",
          description: `Successfully retrieved ${searchResult.item.name}`,
          variant: "success",
        })

        // Clear the search result
        setSearchResult(null)
        setSearchQuery("")

        // Refresh the data
        const itemsData = await fetchItems()
        setItems(itemsData)
      }
    } catch (error) {
      console.error("Error retrieving item:", error)
      toast({
        title: "Retrieval Error",
        description: "An error occurred while retrieving the item",
        variant: "destructive",
      })
    } finally {
      setRetrieving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Items</CardTitle>
            <CardDescription>Find items by ID or name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter item ID or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>

            {searchResult && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Search Result:</h3>
                {searchResult.found ? (
                  <div className="border rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Item Details</h4>
                        <p className="font-medium text-lg">
                          {searchResult.item.name} ({searchResult.item.itemId})
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-red-500" />
                          <p>
                            <span className="font-medium">{searchResult.item.zone}</span> - Container{" "}
                            {searchResult.item.containerId}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Position: Shelf {Math.floor(searchResult.item.position.startCoordinates.height / 30) + 1}, Row{" "}
                          {Math.floor(searchResult.item.position.startCoordinates.width / 30) + 1}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Retrieval Process</h4>
                      <p className="text-sm mb-2">
                        This item requires {searchResult.retrievalSteps.length} steps to retrieve.
                        {searchResult.retrievalSteps.length > 2
                          ? " Multiple items need to be moved to access it."
                          : " It's relatively easy to access."}
                      </p>
                      <ItemRetrievalSteps steps={searchResult.retrievalSteps} />
                    </div>

                    <Button className="w-full" onClick={handleRetrieveItem} disabled={retrieving}>
                      {retrieving ? "Retrieving..." : "Retrieve Item"}
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md p-4 text-center">
                    <p>Item not found.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try searching with a different ID or name.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Container Visualization</CardTitle>
            <CardDescription>Current storage arrangement</CardDescription>
          </CardHeader>
          <CardContent>
            <ContainerVisualization containers={containers} items={items} />
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cargo Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                </div>
              </div>

              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">High Priority Items</p>
                  <p className="text-2xl font-bold">{stats.highPriorityItems}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Expiring Soon</p>
                  <p className="text-2xl font-bold">{stats.expiringItems}</p>
                </div>
              </div>

              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Waste Items</p>
                  <p className="text-2xl font-bold">{stats.wasteItems}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => (window.location.href = "#items")}>
                Manage Items
              </Button>
              <Button className="w-full" variant="outline" onClick={() => (window.location.href = "#containers")}>
                Manage Containers
              </Button>
              <Button className="w-full" variant="outline" onClick={() => (window.location.href = "#waste")}>
                Waste Management
              </Button>
              <Button className="w-full" variant="outline" onClick={() => (window.location.href = "#simulation")}>
                Run Simulation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

