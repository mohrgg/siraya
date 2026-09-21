/**
 * Client Error Reporter Utility
 * Mengirimkan error runtime di browser ke endpoint telemetri aplikasi
 */
export function reportClientError(options: {
  error: Error | any
  digest?: string | null
  metadata?: Record<string, any>
}) {
  if (typeof window === "undefined") return

  try {
    const { error, digest, metadata } = options
    const payload = {
      name: error?.name || (error instanceof Error ? error.constructor.name : "ClientError"),
      message: error?.message || (typeof error === "string" ? error : "Uncaught Client Exception"),
      stack: error?.stack || null,
      digest: digest || (error as any)?.digest || null,
      url: window.location.href,
      path: window.location.pathname,
      metadata: {
        ...metadata,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
        referrer: document.referrer || null
      }
    }

    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
    
    // Gunakan sendBeacon jika tersedia untuk keandalan maksimal saat halaman unload / crash
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/telemetry/error", blob)
    } else {
      fetch("/api/telemetry/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {})
    }
  } catch (err) {
    // Abaikan kegagalan reporter agar tidak memicu cascade error di browser
  }
}
