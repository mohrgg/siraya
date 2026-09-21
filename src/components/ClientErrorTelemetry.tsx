"use client"

import { useEffect } from "react"
import { reportClientError } from "@/lib/client-error-reporter"

/**
 * Global Client Error Telemetry Listener
 * Menangkap unhandled promise rejections dan uncaught errors di browser
 */
export function ClientErrorTelemetry() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      reportClientError({
        error:
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason || "Unhandled Promise Rejection")),
        metadata: { type: "unhandledrejection" }
      })
    }

    const handleError = (event: ErrorEvent) => {
      // Abaikan error dari browser extensions pihak ketiga (seperti grammarly, adblock, etc.)
      if (
        event.filename &&
        (event.filename.includes("extension://") ||
          event.filename.includes("chrome-extension://") ||
          event.filename.includes("moz-extension://"))
      ) {
        return
      }

      reportClientError({
        error: event.error || new Error(event.message || "Uncaught Window Error"),
        metadata: {
          type: "window_error",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    }

    window.addEventListener("unhandledrejection", handleRejection)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return null
}
