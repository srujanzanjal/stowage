// Item Types
export interface Item {
  itemId: string
  name: string
  width: number
  depth: number
  height: number
  mass: number
  priority: number
  expiryDate: string
  usageLimit: number
  preferredZone: string
}

// Container Types
export interface Container {
  containerId: string
  zone: string
  width: number
  depth: number
  height: number
}

// Position Types
export interface Coordinates {
  width: number
  depth: number
  height: number
}

export interface Position {
  startCoordinates: Coordinates
  endCoordinates: Coordinates
}

// Placement Types
export interface Placement {
  itemId: string
  containerId: string
  position: Position
}

export interface Rearrangement {
  step: number
  action: string
  itemId: string
  fromContainer: string
  fromPosition: Position
  toContainer: string
  toPosition: Position
}

export interface PlacementRecommendation {
  success: boolean
  placements: Placement[]
  rearrangements: Rearrangement[]
}

// Search and Retrieval Types
export interface RetrievalStep {
  step: number
  action: string
  itemId: string
  itemName: string
}

export interface SearchResultItem {
  itemId: string
  name: string
  containerId: string
  zone: string
  position: Position
}

export interface SearchResult {
  success: boolean
  found: boolean
  item: SearchResultItem
  retrievalSteps: RetrievalStep[]
}

// Waste Management Types
export interface WasteItem {
  itemId: string
  name: string
  reason: string
  containerId: string
  position: Position
}

export interface ReturnItem {
  itemId: string
  name: string
  reason: string
}

export interface ReturnManifest {
  undockingContainerId: string
  undockingDate: string
  returnItems: ReturnItem[]
  totalVolume: number
  totalWeight: number
}

export interface ReturnPlan {
  success: boolean
  returnPlan: {
    step: number
    itemId: string
    itemName: string
    fromContainer: string
    toContainer: string
  }[]
  retrievalSteps: RetrievalStep[]
  returnManifest: ReturnManifest
}

// Simulation Types
export interface SimulationResult {
  success: boolean
  newDate: string
  changes: {
    itemsUsed: {
      itemId: string
      name: string
      remainingUses: number
    }[]
    itemsExpired: {
      itemId: string
      name: string
    }[]
    itemsDepletedToday: {
      itemId: string
      name: string
    }[]
  }
}

// Log Types
export interface Log {
  timestamp: string
  userId: string
  actionType: string
  itemId: string
  details: {
    fromContainer: string
    toContainer: string
    reason: string
  }
}

