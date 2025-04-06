"use client"

import { useEffect } from "react"
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      toasts.forEach((toast) => {
        if (toast.open) {
          dismiss(toast.id)
        }
      })
    }, 5000)

    return () => clearTimeout(timer)
  }, [toasts, dismiss])

  return (
    <ToastProvider>
      <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 gap-2 max-h-screen w-full sm:max-w-[420px]">
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <button
              className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2"
              onClick={() => dismiss(id)}
            >
              <X className="h-4 w-4" />
            </button>
          </Toast>
        ))}
      </div>
      <ToastViewport />
    </ToastProvider>
  )
}

