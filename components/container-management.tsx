"use client"

import type React from "react"

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
import { fetchContainers, importContainers } from "@/lib/api"
import type { Container } from "@/lib/types"
import { Upload, Plus, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function ContainerManagement() {
  const [containers, setContainers] = useState<Container[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newContainer, setNewContainer] = useState<Partial<Container>>({
    containerId: "",
    zone: "",
    width: 0,
    depth: 0,
    height: 0,
  })
  const [showNewContainerDialog, setShowNewContainerDialog] = useState(false)

  useEffect(() => {
    loadContainers()
  }, [])

  const loadContainers = async () => {
    try {
      const data = await fetchContainers()
      setContainers(data)
    } catch (error) {
      console.error("Error loading containers:", error)
      toast({
        title: "Error",
        description: "Failed to load container data",
        variant: "destructive",
      })
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
      const result = await importContainers(csvFile)

      if (result.success) {
        toast({
          title: "Success",
          description: `Imported ${result.containersImported} containers successfully`,
        })

        // Clear the file input
        setCsvFile(null)
        const fileInput = document.getElementById("container-csv-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""

        // Reload data to show the imported containers
        await loadContainers()
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import containers",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading containers:", error)
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleNewContainerChange = (field: string, value: any) => {
    setNewContainer((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddNewContainer = () => {
    // Validate the new container
    if (!newContainer.zone || !newContainer.width || !newContainer.height || !newContainer.depth) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would call an API to add the container
    const newContainerWithId: Container = {
      ...(newContainer as Container),
      containerId: newContainer.containerId || `CONT-${Math.floor(Math.random() * 1000)}`,
    }

    setContainers((prev) => [...prev, newContainerWithId])
    setShowNewContainerDialog(false)

    toast({
      title: "Container Added",
      description: `Container ${newContainerWithId.containerId} has been added`,
    })

    setNewContainer({
      containerId: "",
      zone: "",
      width: 0,
      depth: 0,
      height: 0,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Containers</CardTitle>
            <CardDescription>Upload a CSV file with container data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="container-csv-upload">CSV File</Label>
                <Input id="container-csv-upload" type="file" accept=".csv" onChange={handleFileChange} />
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
            <CardTitle>Container Statistics</CardTitle>
            <CardDescription>Overview of storage capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Containers</p>
                  <p className="text-2xl font-bold">{containers.length}</p>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Zones</p>
                  <p className="text-2xl font-bold">{new Set(containers.map((c) => c.zone)).size}</p>
                </div>
              </div>

              <div className="border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">
                  {containers
                    .reduce((sum, container) => {
                      return sum + container.width * container.depth * container.height
                    }, 0)
                    .toLocaleString()}{" "}
                  cm³
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Container Inventory</CardTitle>
            <CardDescription>Manage your storage containers</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadContainers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showNewContainerDialog} onOpenChange={setShowNewContainerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Container
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Container</DialogTitle>
                  <DialogDescription>Enter the details for the new storage container.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="containerId">Container ID</Label>
                      <Input
                        id="containerId"
                        value={newContainer.containerId}
                        onChange={(e) => handleNewContainerChange("containerId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone">Zone</Label>
                      <Select
                        value={newContainer.zone}
                        onValueChange={(value) => handleNewContainerChange("zone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Zones</SelectItem>
                          <SelectItem value="Crew Quarters">Crew Quarters</SelectItem>
                          <SelectItem value="Airlock">Airlock</SelectItem>
                          <SelectItem value="Laboratory">Laboratory</SelectItem>
                          <SelectItem value="Medical Bay">Medical Bay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={newContainer.width || ""}
                        onChange={(e) => handleNewContainerChange("width", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depth">Depth (cm)</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={newContainer.depth || ""}
                        onChange={(e) => handleNewContainerChange("depth", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={newContainer.height || ""}
                        onChange={(e) => handleNewContainerChange("height", Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleAddNewContainer}>Add Container</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Dimensions (cm)</TableHead>
                <TableHead>Volume (cm³)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No containers found
                  </TableCell>
                </TableRow>
              ) : (
                containers.map((container) => (
                  <TableRow key={container.containerId}>
                    <TableCell>{container.containerId}</TableCell>
                    <TableCell>{container.zone}</TableCell>
                    <TableCell>
                      {container.width} × {container.depth} × {container.height}
                    </TableCell>
                    <TableCell>{(container.width * container.depth * container.height).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

