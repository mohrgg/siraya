import prisma from "@/lib/prisma"

export type ErrorSeverity = "FATAL" | "ERROR" | "WARN"
export type ErrorSource = 
  | "SERVER_ACTION" 
  | "API_ROUTE" 
  | "CLIENT_COMPONENT" 
  | "MIDDLEWARE" 
  | "DATABASE" 
  | "AUTH" 
  | "SERVER"

export interface UserContext {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  unitSekolahId?: string | null
  unitSekolahName?: string | null
}

export interface RequestContext {
  url?: string | null
  path?: string | null
  method?: string | null
  statusCode?: number | null
  ipAddress?: string | null
  userAgent?: string | null
  headers?: Record<string, any> | Headers | null
}

export interface LogAppErrorOptions {
  error: Error | any
  source?: ErrorSource
  severity?: ErrorSeverity
  request?: RequestContext
  user?: UserContext
  metadata?: Record<string, any> | null
  digest?: string | null
}

// Sensitif keys yang wajib disensor untuk menjaga privasi & keamanan data
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordconfirmation",
  "pass",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "authorization",
  "cookie",
  "cookies",
  "creditcard",
  "cardnumber",
  "cvv",
  "pin",
  "apikey",
  "jwt"
])

/**
 * Sensor data sensitif pada metadata dan payload
 */
export function sanitizePayload(data: any, depth = 0): any {
  if (depth > 5 || data === null || data === undefined) return data

  if (typeof data !== "object") return data

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item, depth + 1))
  }

  const sanitized: Record<string, any> = {}
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "")
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]"
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizePayload(val, depth + 1)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

/**
 * Buat hash fingerprint untuk deduplikasi error
 */
export function generateErrorFingerprint(
  name: string,
  message: string,
  source: string,
  stack?: string | null
): string {
  // Ambil baris pertama dari stack trace yang relevan
  let stackSignature = ""
  if (stack) {
    const lines = stack.split("\n").slice(0, 3)
    stackSignature = lines
      .map((l) => l.trim().replace(/:\d+:\d+/, ""))
      .join("|")
  }

  const raw = `${source}|${name}|${message.slice(0, 200)}|${stackSignature}`
  let h1 = 0x811c9dc5
  let h2 = 0x9e3779b9
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 0x01000193)
    h2 = Math.imul(h2 ^ code, 0x85ebca6b)
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0")
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0")
  return `${part1}${part2}${part1}${part2}`.slice(0, 32)
}

/**
 * Deteksi runtime environment (Vercel vs VPS vs Local)
 */
export function detectEnvironment(): { environment: string; runtimeHost: string } {
  if (process.env.VERCEL) {
    const region = process.env.VERCEL_REGION || "vercel-edge"
    return {
      environment: "VERCEL",
      runtimeHost: `vercel-${region}`
    }
  }

  if (process.env.VPS_HOST || process.env.HOSTING_TYPE === "VPS") {
    return {
      environment: "VPS",
      runtimeHost: process.env.VPS_HOST || process.env.HOSTNAME || "vps-srv"
    }
  }

  if (process.env.NODE_ENV === "production") {
    return {
      environment: "PRODUCTION",
      runtimeHost: process.env.HOSTNAME || "production-server"
    }
  }

  return {
    environment: "LOCAL",
    runtimeHost: "localhost"
  }
}

/**
 * Core Ingestion Engine: Mencatat error ke PostgreSQL dengan deduplikasi cerdas
 */
export async function logAppError(options: LogAppErrorOptions) {
  try {
    const {
      error,
      source = "SERVER",
      severity = "ERROR",
      request,
      user,
      metadata,
      digest
    } = options

    const errorName = error?.name || (error instanceof Error ? error.constructor.name : "UnknownError")
    const errorMessage = error?.message || (typeof error === "string" ? error : JSON.stringify(error) || "Terjadi kesalahan sistem")
    const errorStack = error?.stack || null
    const errorDigest = digest || (error as any)?.digest || null

    const fingerprint = generateErrorFingerprint(errorName, errorMessage, source, errorStack)
    const { environment, runtimeHost } = detectEnvironment()

    // 1. Cek deduplikasi: Error serupa yang belum selesai dalam 24 jam terakhir
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const existingError = await prisma.errorLog.findFirst({
      where: {
        fingerprint,
        status: { in: ["UNRESOLVED", "INVESTIGATING"] },
        lastSeenAt: { gte: twentyFourHoursAgo }
      },
      orderBy: { lastSeenAt: "desc" }
    })

    if (existingError) {
      // Perbarui frekuensi dan timestamp kejadian terakhir
      const updated = await prisma.errorLog.update({
        where: { id: existingError.id },
        data: {
          occurrenceCount: { increment: 1 },
          lastSeenAt: new Date(),
          ...(user?.id && !existingError.penggunaId
            ? {
                penggunaId: user.id,
                penggunaName: user.name || undefined,
                penggunaEmail: user.email || undefined,
                penggunaRole: user.role || undefined,
                unitSekolahId: user.unitSekolahId || undefined,
                unitSekolahName: user.unitSekolahName || undefined
              }
            : {})
        }
      })
      return { id: updated.id, deduplicated: true }
    }

    // 2. Format request info jika ada
    const reqUrl = request?.url || null
    const reqPath = request?.path || null
    const reqMethod = request?.method || (source === "SERVER_ACTION" ? "POST" : "GET")
    const reqStatusCode = request?.statusCode || 500
    let ipAddress = request?.ipAddress || null
    let userAgent = request?.userAgent || null

    if (request?.headers) {
      const rawHeaders = request.headers
      if (typeof (rawHeaders as Headers).get === "function") {
        const h = rawHeaders as Headers
        if (!userAgent) userAgent = h.get("user-agent") || null
        if (!ipAddress) {
          ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
        }
      } else if (rawHeaders && typeof rawHeaders === "object") {
        const h = rawHeaders as Record<string, string>
        if (!userAgent && h["user-agent"]) {
          userAgent = h["user-agent"]
        }
        if (!ipAddress && h["x-forwarded-for"]) {
          ipAddress = String(h["x-forwarded-for"]).split(",")[0]?.trim()
        }
      }
    }

    // 3. Sanitasi metadata
    const sanitizedMeta = metadata ? JSON.stringify(sanitizePayload(metadata)) : null

    // 4. Simpan log baru ke PostgreSQL
    const created = await prisma.errorLog.create({
      data: {
        fingerprint,
        name: errorName.slice(0, 150),
        message: errorMessage,
        stack: errorStack,
        digest: errorDigest ? String(errorDigest).slice(0, 100) : null,
        severity,
        status: "UNRESOLVED",
        source,
        environment,
        runtimeHost,
        url: reqUrl,
        path: reqPath ? reqPath.slice(0, 255) : null,
        method: reqMethod ? reqMethod.slice(0, 10) : "POST",
        statusCode: reqStatusCode,
        ipAddress: ipAddress ? ipAddress.slice(0, 50) : null,
        userAgent,
        penggunaId: user?.id || null,
        penggunaName: user?.name ? user.name.slice(0, 100) : null,
        penggunaEmail: user?.email ? user.email.slice(0, 100) : null,
        penggunaRole: user?.role ? user.role.slice(0, 50) : null,
        unitSekolahId: user?.unitSekolahId || null,
        unitSekolahName: user?.unitSekolahName ? user.unitSekolahName.slice(0, 100) : null,
        metadata: sanitizedMeta,
        occurrenceCount: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date()
      }
    })

    return { id: created.id, deduplicated: false }
  } catch (ingestionError) {
    console.error("[ErrorLogger] Failed to persist system error log:", ingestionError)
    return null
  }
}
