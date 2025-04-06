"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { simulateDay } from "@/lib/api"
import type { SimulationResult, Item } from "@/lib/types"
import { fetchItems } from "@/lib/api"
import { CalendarDays, FastForward, Plus, Trash, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface SimulationControlProps {
  currentDate: string
  setCurrentDate: (date: string) => void
}

export default function SimulationControl({ currentDate, setCurrentDate }: SimulationControlProps) {
  const [numDays, setNumDays] = useState(1)
  const [itemsToUse, setItemsToUse] = useState<{ itemId: string; name: string }[]>([])
  const [newItemId, setNewItemId] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [invalidItems, setInvalidItems] = useState<string[]>([])

  useEffect(() => {
    // Clear any items that no longer exist in the simulation
    if (availableItems.length > 0) {
      const validItemIds = new Set(availableItems.map((item) => item.itemId))

      // Check if any items in itemsToUse no longer exist
      const newInvalidItems: string[] = []

      setItemsToUse((prev) => {
        return prev.filter((item) => {
          if (item.itemId && !validItemIds.has(item.itemId)) {
            newInvalidItems.push(item.itemId)
            return false
          }
          return true
        })
      })

      if (newInvalidItems.length > 0) {
        setInvalidItems(newInvalidItems)
        toast({
          title: "Items Removed",
          description: `${newInvalidItems.length} items were removed from simulation as they no longer exist in inventory`,
          variant: "warning",
        })
      }
    }
  }, [availableItems])

  const loadAvailableItems = async () => {
    setIsLoadingItems(true)
    try {
      const items = await fetchItems()
      setAvailableItems(items)

      if (items.length === 0) {
        toast({
          title: "No Items Available",
          description: "Please import items first to use in simulation",
          variant: "warning",
        })
      }
    } catch (error) {
      console.error("Error loading items:", error)
      toast({
        title: "Error",
        description: "Failed to load available items",
        variant: "destructive",
      })
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleAddItem = () => {
    if (!newItemId && !newItemName) {
      toast({
        title: "Validation Error",
        description: "Please enter an item ID or name",
        variant: "destructive",
      })
      return
    }

    // Check if the item exists in available items if an ID is provided
    if (newItemId && availableItems.length > 0) {
      const itemExists = availableItems.some((item) => item.itemId === newItemId)
      if (!itemExists) {
        toast({
          title: "Item Not Found",
          description: "The specified item ID does not exist in inventory",
          variant: "warning",
        })
        return
      }
    }

    setItemsToUse([
      ...itemsToUse,
      {
        itemId: newItemId,
        name: newItemName || availableItems.find((item) => item.itemId === newItemId)?.name || "",
      },
    ])

    setNewItemId("")
    setNewItemName("")

    toast({
      title: "Item Added",
      description: "Item added to simulation list",
    })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...itemsToUse]
    newItems.splice(index, 1)
    setItemsToUse(newItems)

    toast({
      title: "Item Removed",
      description: "Item removed from simulation list",
    })
  }

  const handleSimulateDay = async () => {
    if (numDays <= 0) {
      toast({
        title: "Invalid Input",
        description: "Number of days must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsSimulating(true)
    try {
      const result = await simulateDay(numDays, itemsToUse)
      setSimulationResult(result)
      setCurrentDate(result.newDate)

      // Refresh available items after simulation
      await loadAvailableItems()

      toast({
        title: "Simulation Complete",
        description: `Advanced ${numDays} day${numDays > 1 ? "s" : ""}`,
      })
    } catch (error) {
      console.error("Error simulating days:", error)
      toast({
        title: "Simulation Error",
        description: "An error occurred during simulation",
        variant: "destructive",
      })
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Simulation</CardTitle>
          <CardDescription>Simulate the passage of time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numDays">Number of Days</Label>
              <div className="flex space-x-2">
                <Input
                  id="numDays"
                  type="number"
                  min="1"
                  value={numDays}
                  onChange={(e) => setNumDays(Number(e.target.value))}
                />
                <Button onClick={handleSimulateDay} disabled={isSimulating}>
                  {numDays === 1 ? (
                    <>
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Next Day
                    </>
                  ) : (
                    <>
                      <FastForward className="h-4 w-4 mr-2" />
                      Fast Forward
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items to Use Each Day</Label>
              <div className="flex space-x-2">
                <Input placeholder="Item ID" value={newItemId} onChange={(e) => setNewItemId(e.target.value)} />
                <Input
                  placeholder="Item Name (optional)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <Button variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" className="w-full mt-2" onClick={loadAvailableItems} disabled={isLoadingItems}>
                {isLoadingItems ? "Loading..." : "Load Available Items"}
              </Button>

              {availableItems.length > 0 && (
                <div className="mt-2 border rounded-md p-2 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Available Items:</p>
                  <div className="space-y-1">
                    {availableItems.map((item) => (
                      <div
                        key={item.itemId}
                        className="text-sm p-1 hover:bg-muted rounded cursor-pointer"
                        onClick={() => {
                          setNewItemId(item.itemId)
                          setNewItemName(item.name)
                        }}
                      >
                        {item.name} ({item.itemId})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invalidItems.length > 0 && (
                <div className="mt-2 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md p-2">
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Items Removed</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        The following items were removed from simulation as they no longer exist in inventory:
                      </p>
                      <ul className="text-xs text-amber-600 dark:text-amber-500 mt-1 list-disc list-inside">
                        {invalidItems.map((id) => (
                          <li key={id}>{id}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {itemsToUse.length > 0 && (
                <div className="border rounded-md p-2">
                  <p className="text-sm font-medium mb-2">Items to use each day:</p>
                  <ul className="space-y-1">
                    {itemsToUse.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-sm">
                        <span>{item.name || item.itemId}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(index)}>
                          <Trash className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Results</CardTitle>
          <CardDescription>Changes after time simulation</CardDescription>
        </CardHeader>
        <CardContent>
          {simulationResult ? (
            <div className="space-y-4">
              <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">New Date</p>
                <p className="text-2xl font-bold">{new Date(simulationResult.newDate).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Items Used:</h3>
                {simulationResult.changes.itemsUsed.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Remaining Uses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulationResult.changes.itemsUsed.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.name} ({item.itemId})
                          </TableCell>
                          <TableCell>{item.remainingUses}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No items used</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Items Expired:</h3>
                {simulationResult.changes.itemsExpired.length > 0 ? (
                  <ul className="space-y-1">
                    {simulationResult.changes.itemsExpired.map((item, index) => (
                      <li key={index} className="text-sm">
                        {item.name} ({item.itemId})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No items expired</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Items Depleted:</h3>
                {simulationResult.changes.itemsDepletedToday.length > 0 ? (
                  <ul className="space-y-1">
                    {simulationResult.changes.itemsDepletedToday.map((item, index) => (
                      <li key={index} className="text-sm">
                        {item.name} ({item.itemId})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No items depleted</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-muted-foreground">Run a simulation to see results</p>
              <p className="text-sm text-muted-foreground mt-2">
                Use the controls on the left to simulate the passage of time
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

