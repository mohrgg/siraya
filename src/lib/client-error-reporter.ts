/**
 * Client Error Reporter Utility
 * Mengirimkan error runtime di browser ke endpoint telemetri aplikasi
 */

// In-memory deduplikasi: jangan kirim error yang identik berulang kali dalam 5 menit
const reportedErrorsCache = new Map<string, number>()
const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000

export function reportClientError(options: {
  error: Error | any
  digest?: string | null
  metadata?: Record<string, any>
}) {
  if (typeof window === "undefined") return

  try {
    const { error, digest, metadata } = options
    const msg = error?.message || (typeof error === "string" ? error : "Uncaught Client Exception")
    const name = error?.name || (error instanceof Error ? error.constructor.name : "ClientError")
    const pathname = window.location?.pathname || ""

    // Fingerprint sederhana untuk mendeteksi error loop
    const fingerprint = `${name}:${msg}:${pathname}`
    const now = Date.now()
    const lastReported = reportedErrorsCache.get(fingerprint)
    if (lastReported && now - lastReported < DEDUPLICATION_WINDOW_MS) {
      return // Abaikan duplikasi error agar tidak membanjiri Vercel functions
    }
    reportedErrorsCache.set(fingerprint, now)

    // Bersihkan cache jika ukuran melebihi 50 item
    if (reportedErrorsCache.size > 50) {
      for (const [key, timestamp] of reportedErrorsCache.entries()) {
        if (now - timestamp >= DEDUPLICATION_WINDOW_MS) {
          reportedErrorsCache.delete(key)
        }
      }
    }

    const payload = {
      name,
      message: msg,
      stack: error?.stack || null,
      digest: digest || (error as any)?.digest || null,
      url: window.location.href,
      path: pathname,
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

