import type { Item, Container } from "./types"

/**
 * Parse CSV data for items with the specific schema
 */
export async function parseItemsCSV(file: File): Promise<Item[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string
        const lines = csvData.split("\n")

        // Skip header row and parse data rows
        const items: Item[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue // Skip empty lines

          const values = parseCSVLine(line)

          // Map CSV fields to our Item model
          // Schema: item_id, name, width_cm, depth_cm, height_cm, mass_kg, priority, expiry_date, usage_limit, preferred_zone
          const item: Item = {
            itemId: values[0] || `ITEM-${Math.floor(Math.random() * 10000)}`, // item_id
            name: values[1] || "Unknown Item", // name
            width: Number.parseFloat(values[2]) || 0, // width_cm
            depth: Number.parseFloat(values[3]) || 0, // depth_cm
            height: Number.parseFloat(values[4]) || 0, // height_cm
            mass: Number.parseFloat(values[5]) || 0, // mass_kg
            priority: Number.parseInt(values[6]) || 50, // priority
            expiryDate: values[7] === "N/A" ? "2099-12-31" : values[7], // expiry_date
            usageLimit: Number.parseInt(values[8]) || 0, // usage_limit
            preferredZone: mapZone(values[9]), // preferred_zone
          }

          items.push(item)
        }

        resolve(items)
      } catch (error) {
        console.error("Error parsing CSV:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsText(file)
  })
}

/**
 * Parse CSV data for containers with the specific schema
 */
export async function parseContainersCSV(file: File): Promise<Container[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string
        const lines = csvData.split("\n")

        // Skip header row and parse data rows
        const containers: Container[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue // Skip empty lines

          const values = parseCSVLine(line)

          // Map CSV fields to our Container model
          // Schema: zone, container_id, width_cm, depth_cm, height_cm
          const container: Container = {
            zone: mapZone(values[0]), // zone
            containerId: values[1] || `CONT-${Math.floor(Math.random() * 1000)}`, // container_id
            width: Number.parseFloat(values[2]) || 0, // width_cm
            depth: Number.parseFloat(values[3]) || 0, // depth_cm
            height: Number.parseFloat(values[4]) || 0, // height_cm
          }

          containers.push(container)
        }

        resolve(containers)
      } catch (error) {
        console.error("Error parsing CSV:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsText(file)
  })
}

/**
 * Parse a CSV line, handling quoted values correctly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current.trim())

  return result
}

/**
 * Map zone names from CSV to our application's zone names
 */
function mapZone(zone: string): string {
  const zoneMap: Record<string, string> = {
    Lab: "Laboratory",
    Greenhouse: "Greenhouse",
    Crew: "Crew Quarters",
    Storage: "Storage Bay",
    Airlock: "Airlock",
    Medical: "Medical Bay",
  }

  return zoneMap[zone] || zone
}

