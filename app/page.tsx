"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Dashboard from "@/components/dashboard"
import ItemManagement from "@/components/item-management"
import ContainerManagement from "@/components/container-management"
import WasteManagement from "@/components/waste-management"
import SimulationControl from "@/components/simulation-control"
import LogViewer from "@/components/log-viewer"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0])

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold">ISS Cargo Management System</CardTitle>
            <CardDescription>Current Date: {new Date(currentDate).toLocaleDateString()}</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="waste">Waste</TabsTrigger>
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard currentDate={currentDate} />
          </TabsContent>

          <TabsContent value="items">
            <ItemManagement />
          </TabsContent>

          <TabsContent value="containers">
            <ContainerManagement />
          </TabsContent>

          <TabsContent value="waste">
            <WasteManagement currentDate={currentDate} />
          </TabsContent>

          <TabsContent value="simulation">
            <SimulationControl currentDate={currentDate} setCurrentDate={setCurrentDate} />
          </TabsContent>

          <TabsContent value="logs">
            <LogViewer currentDate={currentDate} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

