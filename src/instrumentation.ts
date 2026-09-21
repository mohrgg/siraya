export async function register() {
  // Inisialisasi bootstrap
}

/**
 * Hook Resmi Next.js 15/16 untuk menangkap semua unhandled error di server:
 * - Server Actions
 * - Route Handlers (API)
 * - Server Components Rendering
 * - Middleware
 */
export async function onRequestError(
  err: { digest?: string } & Error,
  request: {
    path: string
    method: string
    headers: { [key: string]: string }
  },
  context: {
    routerKind: "Pages Router" | "App Router"
    routePath: string
    routeType: "render" | "route" | "action" | "middleware"
    renderSource?: "react-server-components" | "react-server-components-payload" | "server-rendering"
    revalidateReason?: "on-demand" | "stale" | undefined
    renderType?: "dynamic" | "dynamic-resume"
  }
) {
  // Hanya simpan ke database di lingkungan Node.js (Edge Runtime tidak mendukung Prisma secara native)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { logAppError } = await import("@/lib/error-logger")
      let source: "SERVER_ACTION" | "API_ROUTE" | "MIDDLEWARE" | "SERVER" = "SERVER"
      if (context.routeType === "action") {
        source = "SERVER_ACTION"
      } else if (context.routeType === "route") {
        source = "API_ROUTE"
      } else if (context.routeType === "middleware") {
        source = "MIDDLEWARE"
      }

      await logAppError({
        error: err,
        source,
        severity: "ERROR",
        request: {
          path: request.path,
          method: request.method,
          headers: request.headers
        },
        digest: err.digest,
        metadata: {
          routerKind: context.routerKind,
          routePath: context.routePath,
          routeType: context.routeType,
          renderSource: context.renderSource
        }
      })
    } catch (loggingError) {
      console.error("[Instrumentation] Gagal mencatat error:", loggingError)
    }
  }
}
