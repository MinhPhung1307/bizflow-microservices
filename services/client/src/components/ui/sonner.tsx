"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          top: "72px",
          "--normal-bg": "var(--background)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--normal-text": "var(--foreground)",

          // ĐỊNH NGHĨA BIẾN MÀU CHO TỪNG LOẠI
          "--success-bg": "rgb(236 253 245)", // emerald-50
          "--success-text": "rgb(6 78 59)",    // emerald-900
          "--success-border": "rgb(167 243 208)", // emerald-200

          "--error-bg": "rgb(254 242 242)",   // red-50
          "--error-text": "rgb(127 29 29)",    // red-900
          "--error-border": "rgb(254 202 202)", // red-200

          "--warning-bg": "rgb(255 251 235)", // amber-50
          "--warning-text": "rgb(120 53 15)",  // amber-900
          "--warning-border": "rgb(253 230 138)", // amber-200

          "--info-bg": "rgb(239 246 255)",    // blue-50
          "--info-text": "rgb(30 58 138)",     // blue-900
          "--info-border": "rgb(191 219 254)", // blue-200
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg group-[.toaster]:border",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
