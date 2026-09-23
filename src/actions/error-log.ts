"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { detectEnvironment } from "@/lib/error-logger"

// Client database dengan type-safety lengkap
const db = prisma as any

export interface ErrorCockpitSummary {
  totalAll: number
  totalUnresolved: number
  totalFatal: number
  totalInvestigating: number
  totalResolved: number
  affectedUsersCount: number
  last24hCount: number
  currentRuntime?: {
    environment: string
    runtimeHost: string
  }
  envBreakdown: {
    vercel: number
    vps: number
    local: number
    other: number
  }
  sourceBreakdown: {
    serverAction: number
    apiRoute: number
    client: number
    middleware: number
    database: number
    other: number
  }
}

export interface GetErrorLogsParams {
  page?: number
  pageSize?: number
  status?: string
  severity?: string
  source?: string
  environment?: string
  search?: string
  startDate?: string
  endDate?: string
}

/**
 * Mengambil ringkasan metrik KPI Error Cockpit
 */
export async function getErrorCockpitSummary(): Promise<ErrorCockpitSummary> {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Hanya Superadmin yang berwenang mengakses data telemetri error sistem.")
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    totalAll,
    totalUnresolved,
    totalFatal,
    totalInvestigating,
    totalResolved,
    last24hCount,
    distinctUsers,
    envVercel,
    envVps,
    envLocal,
    srcServerAction,
    srcApiRoute,
    srcClient,
    srcMiddleware,
    srcDatabase
  ] = await Promise.all([
    db.errorLog.count(),
    db.errorLog.count({ where: { status: "UNRESOLVED" } }),
    db.errorLog.count({
      where: {
        OR: [{ severity: "FATAL" }, { statusCode: 500 }]
      }
    }),
    db.errorLog.count({ where: { status: "INVESTIGATING" } }),
    db.errorLog.count({ where: { status: "RESOLVED" } }),
    db.errorLog.count({ where: { lastSeenAt: { gte: twentyFourHoursAgo } } }),
    db.errorLog.groupBy({
      by: ["penggunaId"],
      where: { penggunaId: { not: null } }
    }),
    db.errorLog.count({ where: { environment: "VERCEL" } }),
    db.errorLog.count({ where: { environment: "VPS" } }),
    db.errorLog.count({ where: { environment: "LOCAL" } }),
    db.errorLog.count({ where: { source: "SERVER_ACTION" } }),
    db.errorLog.count({ where: { source: "API_ROUTE" } }),
    db.errorLog.count({ where: { source: "CLIENT_COMPONENT" } }),
    db.errorLog.count({ where: { source: "MIDDLEWARE" } }),
    db.errorLog.count({ where: { source: "DATABASE" } })
  ])

  const envOther = Math.max(0, totalAll - (envVercel + envVps + envLocal))
  const srcOther = Math.max(
    0,
    totalAll - (srcServerAction + srcApiRoute + srcClient + srcMiddleware + srcDatabase)
  )

  const currentRuntime = detectEnvironment()

  return {
    totalAll,
    totalUnresolved,
    totalFatal,
    totalInvestigating,
    totalResolved,
    affectedUsersCount: distinctUsers.length,
    last24hCount,
    currentRuntime,
    envBreakdown: {
      vercel: envVercel,
      vps: envVps,
      local: envLocal,
      other: envOther
    },
    sourceBreakdown: {
      serverAction: srcServerAction,
      apiRoute: srcApiRoute,
      client: srcClient,
      middleware: srcMiddleware,
      database: srcDatabase,
      other: srcOther
    }
  }
}

/**
 * Mengambil daftar error logs terpaginasi dengan multi-filter
 */
export async function getPaginatedErrorLogs(params: GetErrorLogsParams = {}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Akses ditolak.")
  }

  const {
    page = 1,
    pageSize = 15,
    status = "ALL",
    severity = "ALL",
    source = "ALL",
    environment = "ALL",
    search = "",
    startDate,
    endDate
  } = params

  const whereClause: any = {}

  if (status && status !== "ALL") {
    whereClause.status = status
  }

  if (severity && severity !== "ALL") {
    whereClause.severity = severity
  }

  if (source && source !== "ALL") {
    whereClause.source = source
  }

  if (environment && environment !== "ALL") {
    whereClause.environment = environment
  }

  if (startDate || endDate) {
    whereClause.lastSeenAt = {}
    if (startDate) {
      whereClause.lastSeenAt.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      whereClause.lastSeenAt.lte = end
    }
  }

  if (search && search.trim() !== "") {
    const term = search.trim()
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { message: { contains: term, mode: "insensitive" } },
      { path: { contains: term, mode: "insensitive" } },
      { digest: { contains: term, mode: "insensitive" } },
      { penggunaName: { contains: term, mode: "insensitive" } },
      { penggunaEmail: { contains: term, mode: "insensitive" } }
    ]
  }

  const skip = (page - 1) * pageSize

  const [total, logs] = await Promise.all([
    db.errorLog.count({ where: whereClause }),
    db.errorLog.findMany({
      where: whereClause,
      orderBy: { lastSeenAt: "desc" },
      skip,
      take: pageSize
    })
  ])

  return {
    logs: logs.map((l: any) => ({
      ...l,
      firstSeenAt: l.firstSeenAt.toISOString(),
      lastSeenAt: l.lastSeenAt.toISOString(),
      resolvedAt: l.resolvedAt ? l.resolvedAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString()
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    currentPage: page
  }
}

/**
 * Memperbarui status error log (Unresolved -> Investigating -> Resolved -> Ignored)
 */
export async function updateErrorLogStatus(
  id: string,
  newStatus: "UNRESOLVED" | "INVESTIGATING" | "RESOLVED" | "IGNORED",
  resolutionNote?: string
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Akses ditolak.")
  }

  const updateData: any = {
    status: newStatus,
    ...(resolutionNote !== undefined ? { resolutionNote } : {})
  }

  if (newStatus === "RESOLVED") {
    updateData.resolvedAt = new Date()
  } else {
    updateData.resolvedAt = null
  }

  const updated = await db.errorLog.update({
    where: { id },
    data: updateData
  })

  revalidatePath("/?tab=operasional")
  return { success: true, log: updated }
}

/**
 * Membersihkan log error lama yang sudah berstatus RESOLVED
 */
export async function purgeResolvedErrorLogs(daysOlderThan = 30) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Akses ditolak.")
  }

  const cutoffDate = new Date(Date.now() - daysOlderThan * 24 * 60 * 60 * 1000)

  const result = await db.errorLog.deleteMany({
    where: {
      status: "RESOLVED",
      lastSeenAt: { lte: cutoffDate }
    }
  })

  revalidatePath("/?tab=operasional")
  return { success: true, count: result.count }
}

/**
 * Mengambil seluruh log error yang difilter untuk keperluan ekspor Excel / PDF
 */
export async function getAllErrorLogsForExport(params: GetErrorLogsParams = {}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Akses ditolak.")
  }

  const {
    status = "ALL",
    severity = "ALL",
    source = "ALL",
    environment = "ALL",
    search = "",
    startDate,
    endDate
  } = params

  const whereClause: any = {}

  if (status && status !== "ALL") whereClause.status = status
  if (severity && severity !== "ALL") whereClause.severity = severity
  if (source && source !== "ALL") whereClause.source = source
  if (environment && environment !== "ALL") whereClause.environment = environment

  if (startDate || endDate) {
    whereClause.lastSeenAt = {}
    if (startDate) whereClause.lastSeenAt.gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      whereClause.lastSeenAt.lte = end
    }
  }

  if (search && search.trim() !== "") {
    const term = search.trim()
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { message: { contains: term, mode: "insensitive" } },
      { path: { contains: term, mode: "insensitive" } },
      { digest: { contains: term, mode: "insensitive" } },
      { penggunaName: { contains: term, mode: "insensitive" } }
    ]
  }

  const logs = await db.errorLog.findMany({
    where: whereClause,
    orderBy: { lastSeenAt: "desc" },
    take: 1000 // Maksimal 1000 entri untuk keselamatan memori ekspor
  })

  return logs.map((l: any) => ({
    id: l.id,
    waktuTerakhir: l.lastSeenAt.toLocaleString("id-ID"),
    kejadian: l.occurrenceCount,
    status: l.status,
    tingkat: l.severity,
    sumber: l.source,
    lingkungan: l.environment,
    host: l.runtimeHost || "-",
    namaError: l.name,
    pesanError: l.message,
    pathUrl: l.path || l.url || "-",
    namaPengguna: l.penggunaName || "Anonim / Publik",
    emailPengguna: l.penggunaEmail || "-",
    rolePengguna: l.penggunaRole || "-",
    unitSekolah: l.unitSekolahName || "-",
    ipAddress: l.ipAddress || "-",
    catatanResolusi: l.resolutionNote || "-"
  }))
}

/**
 * Memicu simulasi error diagnostik untuk menguji logging dan auto-detect host runtime (Vercel/VPS)
 */
export async function simulateTestErrorAction() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Hanya Superadmin yang berwenang memicu simulasi error telemetri.")
  }

  const { logAppError } = await import("@/lib/error-logger")
  const result = await logAppError({
    error: new Error("Uji Coba Diagnostik Sistem: Auto-detect runtime host dan penyimpanan log ke database berfungsi normal."),
    source: "SERVER_ACTION",
    severity: "WARN",
    user: {
      id: session.user.id,
      name: session.user.name || "Superadmin",
      email: session.user.email || undefined,
      role: session.user.role
    },
    metadata: {
      tipe: "SIMULASI_DIAGNOSTIK",
      catatan: "Error uji coba dipicu oleh Superadmin dari Dashboard Operasional.",
      timestamp: new Date().toISOString()
    }
  })

  revalidatePath("/?tab=operasional")
  return { success: true, log: result }
}
