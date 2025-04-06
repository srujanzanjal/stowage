"use client"

import { useEffect, useRef, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Container, Item } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ContainerVisualizationProps {
  containers: Container[]
  items: Item[]
}

export default function ContainerVisualization({ containers, items }: ContainerVisualizationProps) {
  const [selectedContainer, setSelectedContainer] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      setSelectedContainer(containers[0].containerId)
    }
  }, [containers, selectedContainer])

  useEffect(() => {
    if (!canvasRef.current || !selectedContainer) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Find selected container
    const container = containers.find((c) => c.containerId === selectedContainer)
    if (!container) return

    // Find items in this container
    const containerItems = items.filter((item) => {
      // In a real application, we would check if the item is in this container
      // For now, we'll just randomly assign some items to this container
      return Math.random() > 0.5
    })

    // Draw container
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(zoom, zoom)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    const padding = 20
    const containerWidth = canvas.width - padding * 2
    const containerHeight = canvas.height - padding * 2
    const containerDepth = 200 // For 3D effect

    // Draw container box
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.rect(padding, padding, containerWidth, containerHeight)
    ctx.stroke()

    // Draw some perspective lines for depth
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding + 30, padding - 30)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(padding + containerWidth, padding)
    ctx.lineTo(padding + containerWidth + 30, padding - 30)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(padding + 30, padding - 30)
    ctx.lineTo(padding + containerWidth + 30, padding - 30)
    ctx.stroke()

    // Draw items
    containerItems.forEach((item, index) => {
      // Calculate a position for the item (this would be based on actual coordinates in a real app)
      const itemX = padding + 20 + (index % 3) * 100
      const itemY = padding + 20 + Math.floor(index / 3) * 80
      const itemWidth = 80
      const itemHeight = 60

      // Draw item
      ctx.fillStyle = getPriorityColor(item.priority)
      ctx.fillRect(itemX, itemY, itemWidth, itemHeight)

      // Draw item label
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.fillText(item.name, itemX + 5, itemY + 20)
      ctx.fillText(`ID: ${item.itemId}`, itemX + 5, itemY + 40)
    })

    ctx.restore()
  }, [selectedContainer, containers, items, zoom, rotation])

  const getPriorityColor = (priority: number): string => {
    if (priority > 80) return "#ef4444" // High priority - red
    if (priority > 50) return "#f97316" // Medium priority - orange
    return "#22c55e" // Low priority - green
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Select value={selectedContainer} onValueChange={setSelectedContainer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select container" />
          </SelectTrigger>
          <SelectContent>
            {containers.map((container) => (
              <SelectItem key={container.containerId} value={container.containerId}>
                {container.containerId} ({container.zone})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2">
          <canvas ref={canvasRef} width={800} height={500} className="w-full border rounded-md" />
        </CardContent>
      </Card>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          Container dimensions: {containers.find((c) => c.containerId === selectedContainer)?.width || 0} ×{" "}
          {containers.find((c) => c.containerId === selectedContainer)?.depth || 0} ×{" "}
          {containers.find((c) => c.containerId === selectedContainer)?.height || 0} cm
        </p>
      </div>
    </div>
  )
}

