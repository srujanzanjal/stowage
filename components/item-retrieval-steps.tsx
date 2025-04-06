import { Card, CardContent } from "@/components/ui/card"
import type { RetrievalStep } from "@/lib/types"
import { ArrowRight, Package, Trash, Box, Undo } from "lucide-react"

interface ItemRetrievalStepsProps {
  steps: RetrievalStep[]
}

export default function ItemRetrievalSteps({ steps }: ItemRetrievalStepsProps) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">No retrieval steps needed. Item is directly accessible.</p>
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "remove":
        return <Package className="h-4 w-4 mr-2 text-blue-500" />
      case "setaside":
        return <ArrowRight className="h-4 w-4 mr-2 text-amber-500" />
      case "retrieve":
        return <Box className="h-4 w-4 mr-2 text-green-500" />
      case "placeback":
        return <Undo className="h-4 w-4 mr-2 text-purple-500" />
      case "dispose":
        return <Trash className="h-4 w-4 mr-2 text-red-500" />
      default:
        return <Package className="h-4 w-4 mr-2" />
    }
  }

  const getActionDescription = (action: string) => {
    switch (action.toLowerCase()) {
      case "remove":
        return "Remove blocking item"
      case "setaside":
        return "Set aside temporarily"
      case "retrieve":
        return "Retrieve target item"
      case "placeback":
        return "Return item to original position"
      case "dispose":
        return "Dispose of waste item"
      default:
        return action
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start border-b pb-2 last:border-0">
              <span className="font-medium mr-2 text-muted-foreground">{step.step}.</span>
              <div className="flex flex-col">
                <div className="flex items-center">
                  {getActionIcon(step.action)}
                  <span className="font-medium">{getActionDescription(step.action)}: </span>
                </div>
                <div className="ml-6 mt-1">
                  <span className="text-sm">
                    {step.itemName} ({step.itemId})
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.action.toLowerCase() === "retrieve"
                      ? "This is your target item. Carefully extract it from its current position."
                      : step.action.toLowerCase() === "remove"
                        ? "This item is blocking access to your target. Carefully remove it first."
                        : step.action.toLowerCase() === "setaside"
                          ? "Place this item in a temporary location to clear access path."
                          : step.action.toLowerCase() === "placeback"
                            ? "Return this item to its original position to maintain organization."
                            : "Process this item according to protocol."}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

