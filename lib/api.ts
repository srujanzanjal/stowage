import type {
  Item,
  Container,
  PlacementRecommendation,
  SearchResult,
  WasteItem,
  ReturnPlan,
  SimulationResult,
  Log,
} from "./types"
import { parseItemsCSV, parseContainersCSV } from "./csv-parser"

// Mock data storage - in a real app, this would be a database
let mockItems: Item[] = []
let mockContainers: Container[] = []

// Global log storage
const actionLogs: Log[] = []

// Helper function to add a log entry
function addLogEntry(log: Log) {
  actionLogs.push(log)
}

// API Functions

// Items API
export async function fetchItems(): Promise<Item[]> {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockItems)
    }, 500)
  })
}

// Update the importItems function to log the action
export async function importItems(file: File): Promise<{ success: boolean; itemsImported: number; error?: string }> {
  try {
    // Parse the CSV file
    const parsedItems = await parseItemsCSV(file)

    if (parsedItems.length === 0) {
      return { success: false, itemsImported: 0, error: "No valid items found in the CSV file" }
    }

    // In a real app, this would send the parsed items to the server
    // For now, we'll just add them to our mock data
    mockItems = [...mockItems, ...parsedItems]

    // Log the import
    addLogEntry({
      timestamp: new Date().toISOString(),
      userId: "system",
      actionType: "import",
      itemId: "",
      details: {
        fromContainer: "",
        toContainer: "",
        reason: `Imported ${parsedItems.length} items`,
      },
    })

    return { success: true, itemsImported: parsedItems.length }
  } catch (error) {
    console.error("Error importing items:", error)
    return { success: false, itemsImported: 0, error: "Failed to parse CSV file" }
  }
}

// Containers API
export async function fetchContainers(): Promise<Container[]> {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockContainers)
    }, 500)
  })
}

// Update the importContainers function to log the action
export async function importContainers(
  file: File,
): Promise<{ success: boolean; containersImported: number; error?: string }> {
  try {
    // Parse the CSV file
    const parsedContainers = await parseContainersCSV(file)

    if (parsedContainers.length === 0) {
      return { success: false, containersImported: 0, error: "No valid containers found in the CSV file" }
    }

    // In a real app, this would send the parsed containers to the server
    // For now, we'll just add them to our mock data
    mockContainers = [...mockContainers, ...parsedContainers]

    // Log the import
    addLogEntry({
      timestamp: new Date().toISOString(),
      userId: "system",
      actionType: "import",
      itemId: "",
      details: {
        fromContainer: "",
        toContainer: "",
        reason: `Imported ${parsedContainers.length} containers`,
      },
    })

    return { success: true, containersImported: parsedContainers.length }
  } catch (error) {
    console.error("Error importing containers:", error)
    return { success: false, containersImported: 0, error: "Failed to parse CSV file" }
  }
}

// Placement API with improved algorithm
export async function getPlacementRecommendations(
  items: Item[],
  containers: Container[],
): Promise<PlacementRecommendation> {
  // In a real app, this would call the placement algorithm
  return new Promise((resolve) => {
    setTimeout(() => {
      // Improved bin packing algorithm
      const placements: any[] = []
      const rearrangements: any[] = []

      // Sort items by priority (high to low) and volume (large to small)
      const sortedItems = [...items].sort((a, b) => {
        // First by priority (high to low)
        const priorityDiff = b.priority - a.priority
        if (priorityDiff !== 0) return priorityDiff

        // Then by volume (large to small)
        const volumeA = a.width * a.depth * a.height
        const volumeB = b.width * b.depth * a.height
        return volumeB - volumeA
      })

      // Sort containers by preferred zone match and available volume
      const containersByZone = new Map<string, Container[]>()

      // Group containers by zone
      containers.forEach((container) => {
        const zone = container.zone
        if (!containersByZone.has(zone)) {
          containersByZone.set(zone, [])
        }
        containersByZone.get(zone)!.push(container)
      })

      // Place items
      for (const item of sortedItems) {
        let placed = false

        // Try to place in preferred zone first
        if (containersByZone.has(item.preferredZone)) {
          const zoneContainers = containersByZone.get(item.preferredZone)!

          // Sort containers by available space (most to least)
          zoneContainers.sort((a, b) => {
            const volumeA = a.width * a.depth * a.height
            const volumeB = b.width * b.depth * b.height
            return volumeB - volumeA
          })

          // Try to place in each container
          for (const container of zoneContainers) {
            if (canFitItem(item, container)) {
              placements.push({
                itemId: item.itemId,
                containerId: container.containerId,
                position: {
                  startCoordinates: { width: 0, depth: 0, height: 0 },
                  endCoordinates: { width: item.width, depth: item.depth, height: item.height },
                },
              })
              placed = true
              break
            }
          }
        }

        // If not placed in preferred zone, try other zones
        if (!placed) {
          for (const [zone, zoneContainers] of containersByZone.entries()) {
            if (zone === item.preferredZone) continue // Already tried

            for (const container of zoneContainers) {
              if (canFitItem(item, container)) {
                placements.push({
                  itemId: item.itemId,
                  containerId: container.containerId,
                  position: {
                    startCoordinates: { width: 0, depth: 0, height: 0 },
                    endCoordinates: { width: item.width, depth: item.depth, height: item.height },
                  },
                })
                placed = true
                break
              }
            }

            if (placed) break
          }
        }

        // If still not placed, consider rearrangements
        if (!placed) {
          // In a real implementation, this would be a complex rearrangement algorithm
          // For now, we'll just add a placeholder rearrangement
          rearrangements.push({
            step: rearrangements.length + 1,
            action: "move",
            itemId: "placeholder",
            fromContainer: "containerA",
            fromPosition: {
              startCoordinates: { width: 0, depth: 0, height: 0 },
              endCoordinates: { width: 10, depth: 10, height: 10 },
            },
            toContainer: "containerB",
            toPosition: {
              startCoordinates: { width: 0, depth: 0, height: 0 },
              endCoordinates: { width: 10, depth: 10, height: 10 },
            },
          })

          // After rearrangement, place the item
          placements.push({
            itemId: item.itemId,
            containerId: containers[0].containerId, // Placeholder
            position: {
              startCoordinates: { width: 0, depth: 0, height: 0 },
              endCoordinates: { width: item.width, depth: item.depth, height: item.height },
            },
          })
        }
      }

      resolve({
        success: true,
        placements,
        rearrangements,
      })
    }, 1500)
  })
}

// Helper function to check if an item can fit in a container
function canFitItem(item: Item, container: Container): boolean {
  // Check if the item dimensions fit within the container
  return item.width <= container.width && item.depth <= container.depth && item.height <= container.height
}

// Search and Retrieval API
// Update the searchItem function to provide more detailed location information
export async function searchItem(query: string): Promise<SearchResult> {
  // In a real app, this would search the database
  return new Promise((resolve) => {
    setTimeout(() => {
      const item = mockItems.find(
        (item) =>
          item.itemId.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase()),
      )

      if (item) {
        // Find a container for this item
        const container = mockContainers.length > 0 ? mockContainers[0] : null

        // Log the search
        addLogEntry({
          timestamp: new Date().toISOString(),
          userId: "system",
          actionType: "search",
          itemId: item.itemId,
          details: {
            fromContainer: "",
            toContainer: "",
            reason: `User searched for "${query}"`,
          },
        })

        resolve({
          success: true,
          found: true,
          item: {
            itemId: item.itemId,
            name: item.name,
            containerId: container ? container.containerId : "unknown",
            zone: container ? container.zone : "unknown",
            position: {
              startCoordinates: { width: 10, depth: 10, height: 10 },
              endCoordinates: { width: 10 + item.width, depth: 10 + item.depth, height: 10 + item.height },
            },
          },
          retrievalSteps: [
            { step: 1, action: "remove", itemId: "006", itemName: "Blocking Item 1" },
            { step: 2, action: "setAside", itemId: "006", itemName: "Blocking Item 1" },
            { step: 3, action: "retrieve", itemId: item.itemId, itemName: item.name },
            { step: 4, action: "placeBack", itemId: "006", itemName: "Blocking Item 1" },
          ],
        })
      } else {
        resolve({
          success: true,
          found: false,
          item: {
            itemId: "",
            name: "",
            containerId: "",
            zone: "",
            position: {
              startCoordinates: { width: 0, depth: 0, height: 0 },
              endCoordinates: { width: 0, depth: 0, height: 0 },
            },
          },
          retrievalSteps: [],
        })
      }
    }, 800)
  })
}

// Update the retrieveItem function to actually remove the item from mockItems
export async function retrieveItem(itemId: string, userId: string, timestamp: string): Promise<{ success: boolean }> {
  // In a real app, this would update the database
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find the item
      const item = mockItems.find((i) => i.itemId === itemId)

      // Add log entry
      if (item) {
        addLogEntry({
          timestamp: timestamp || new Date().toISOString(),
          userId: userId || "system",
          actionType: "retrieval",
          itemId: itemId,
          details: {
            fromContainer: "unknown", // In a real app, this would be the actual container
            toContainer: "",
            reason: "User requested retrieval",
          },
        })

        // Actually remove the item from mockItems
        mockItems = mockItems.filter((i) => i.itemId !== itemId)
      }

      resolve({ success: true })
    }, 500)
  })
}

export async function placeItem(
  itemId: string,
  userId: string,
  timestamp: string,
  containerId: string,
  position: any,
): Promise<{ success: boolean }> {
  // In a real app, this would update the database
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true })
    }, 500)
  })
}

// Waste Management API
// Update the identifyWaste function to properly identify waste items based on current date
export async function identifyWaste(currentDate?: string): Promise<{ success: boolean; wasteItems: WasteItem[] }> {
  // In a real app, this would query the database for expired or depleted items
  return new Promise((resolve) => {
    setTimeout(() => {
      // Use provided date or current date
      const checkDate = currentDate ? new Date(currentDate) : new Date()

      // Check if there are any items in the mock data
      const expiredItems = mockItems
        .filter((item) => {
          if (item.expiryDate === "N/A" || item.expiryDate === "2099-12-31") return false
          const expiryDate = new Date(item.expiryDate)
          return expiryDate < checkDate || item.usageLimit <= 0
        })
        .map((item) => {
          // Find a container for this item
          const container = mockContainers.length > 0 ? mockContainers[0].containerId : "unknown"

          return {
            itemId: item.itemId,
            name: item.name,
            reason: new Date(item.expiryDate) < checkDate ? "Expired" : "Out of Uses",
            containerId: container,
            position: {
              startCoordinates: { width: 20, depth: 20, height: 20 },
              endCoordinates: { width: 30, depth: 30, height: 40 },
            },
          }
        })

      resolve({
        success: true,
        wasteItems: expiredItems,
      })
    }, 800)
  })
}

// Update the getReturnPlan function to use the selected waste items
export async function getReturnPlan(
  undockingContainerId: string,
  undockingDate: string,
  maxWeight: number,
  selectedItemIds: string[] = [],
): Promise<ReturnPlan> {
  // In a real app, this would run the return planning algorithm
  return new Promise((resolve) => {
    setTimeout(() => {
      // Get the actual waste items based on selected IDs
      const selectedItems = mockItems
        .filter((item) => selectedItemIds.includes(item.itemId))
        .map((item) => ({
          itemId: item.itemId,
          name: item.name,
          reason: new Date(item.expiryDate) < new Date() ? "Expired" : "Out of Uses",
        }))

      // If no specific items were selected, use a default set
      const returnItems =
        selectedItems.length > 0
          ? selectedItems
          : [
              { itemId: "007", name: "Expired Food", reason: "Expired" },
              { itemId: "008", name: "Empty Water Container", reason: "Out of Uses" },
            ]

      // Calculate a realistic volume and weight based on the items
      const totalVolume = returnItems.reduce((sum, item) => {
        const foundItem = mockItems.find((i) => i.itemId === item.itemId)
        if (foundItem) {
          return sum + foundItem.width * foundItem.depth * foundItem.height
        }
        return sum + 1250 // Default volume if item not found
      }, 0)

      const totalWeight = returnItems.reduce((sum, item) => {
        const foundItem = mockItems.find((i) => i.itemId === item.itemId)
        if (foundItem) {
          return sum + foundItem.mass
        }
        return sum + 1.75 // Default weight if item not found
      }, 0)

      // Create return plan steps for each selected item
      const returnPlanSteps = returnItems.map((item, index) => ({
        step: index + 1,
        itemId: item.itemId,
        itemName: item.name,
        fromContainer: mockContainers.length > 0 ? mockContainers[0].containerId : "unknown",
        toContainer: undockingContainerId,
      }))

      resolve({
        success: true,
        returnPlan: returnPlanSteps,
        retrievalSteps: [
          { step: 1, action: "remove", itemId: "006", itemName: "Blocking Item 1" },
          { step: 2, action: "setAside", itemId: "006", itemName: "Blocking Item 1" },
          {
            step: 3,
            action: "retrieve",
            itemId: returnItems[0]?.itemId || "007",
            itemName: returnItems[0]?.name || "Expired Food",
          },
          { step: 4, action: "placeBack", itemId: "006", itemName: "Blocking Item 1" },
        ],
        returnManifest: {
          undockingContainerId,
          undockingDate,
          returnItems,
          totalVolume,
          totalWeight,
        },
      })
    }, 1200)
  })
}

// Update the completeUndocking function to actually remove the waste items
export async function completeUndocking(
  undockingContainerId: string,
  timestamp: string,
): Promise<{ success: boolean; itemsRemoved: number }> {
  // In a real app, this would update the database
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find all expired or depleted items
      const currentDate = new Date()
      const wasteItems = mockItems.filter((item) => {
        if (item.expiryDate === "N/A" || item.expiryDate === "2099-12-31") return false
        const expiryDate = new Date(item.expiryDate)
        return expiryDate < currentDate || item.usageLimit <= 0
      })

      // Remove these items from mockItems
      const itemsToRemove = new Set(wasteItems.map((item) => item.itemId))
      const initialLength = mockItems.length
      mockItems = mockItems.filter((item) => !itemsToRemove.has(item.itemId))
      const itemsRemoved = initialLength - mockItems.length

      // Log the undocking
      addLogEntry({
        timestamp: timestamp || new Date().toISOString(),
        userId: "system",
        actionType: "disposal",
        itemId: "",
        details: {
          fromContainer: "",
          toContainer: undockingContainerId,
          reason: `Undocked container with ${itemsRemoved} waste items`,
        },
      })

      resolve({ success: true, itemsRemoved })
    }, 800)
  })
}

// Update the simulateDay function to log the action
export async function simulateDay(
  numDays: number,
  itemsToBeUsedPerDay: { itemId: string; name: string }[],
): Promise<SimulationResult> {
  // In a real app, this would run the simulation algorithm
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + numDays)

      // Log the simulation
      addLogEntry({
        timestamp: new Date().toISOString(),
        userId: "system",
        actionType: "simulation",
        itemId: "",
        details: {
          fromContainer: "",
          toContainer: "",
          reason: `Simulated ${numDays} day(s)`,
        },
      })

      // Log each item usage
      itemsToBeUsedPerDay.forEach((item) => {
        if (item.itemId) {
          addLogEntry({
            timestamp: new Date().toISOString(),
            userId: "system",
            actionType: "usage",
            itemId: item.itemId,
            details: {
              fromContainer: "",
              toContainer: "",
              reason: "Used in simulation",
            },
          })
        }
      })

      resolve({
        success: true,
        newDate: newDate.toISOString(),
        changes: {
          itemsUsed: itemsToBeUsedPerDay.map((item) => ({
            itemId: item.itemId || "unknown",
            name: item.name || "Unknown Item",
            remainingUses: Math.floor(Math.random() * 10),
          })),
          itemsExpired: numDays > 30 ? [{ itemId: "009", name: "Perishable Item" }] : [],
          itemsDepletedToday:
            itemsToBeUsedPerDay.length > 2
              ? [
                  {
                    itemId: itemsToBeUsedPerDay[0].itemId || "010",
                    name: itemsToBeUsedPerDay[0].name || "Depleted Item",
                  },
                ]
              : [],
        },
      })
    }, 1000)
  })
}

// Update the getLogs function to return the actual logs
export async function getLogs(
  startDate: string,
  endDate: string,
  itemId?: string,
  userId?: string,
  actionType?: string,
): Promise<{ logs: Log[] }> {
  // In a real app, this would query the database
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter logs based on criteria
      let filteredLogs = [...actionLogs]

      // Filter by date range
      if (startDate) {
        const start = new Date(startDate)
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) >= start)
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999) // End of the day
        filteredLogs = filteredLogs.filter((log) => new Date(log.timestamp) <= end)
      }

      // Filter by item ID
      if (itemId) {
        filteredLogs = filteredLogs.filter((log) => log.itemId.includes(itemId))
      }

      // Filter by user ID
      if (userId) {
        filteredLogs = filteredLogs.filter((log) => log.userId.includes(userId))
      }

      // Filter by action type
      if (actionType && actionType !== "all") {
        filteredLogs = filteredLogs.filter((log) => log.actionType === actionType)
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      resolve({
        logs: filteredLogs,
      })
    }, 800)
  })
}

