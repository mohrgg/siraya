"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface DatabaseTableMetric {
  tableName: string
  estimatedRows: number
  totalSize: string
  totalBytes: number
}

export interface DatabaseMetricsSummary {
  status: "ONLINE" | "DEGRADED" | "OFFLINE"
  host: string
  provider: string
  latencyMs: number
  totalDatabaseSize: string
  totalDatabaseBytes: number
  cacheHitRatio: number
  connections: {
    total: number
    active: number
    idle: number
  }
  topTables: DatabaseTableMetric[]
  fetchedAt: string
}

function parseHostInfo(connectionString?: string): { host: string; provider: string } {
  if (!connectionString) {
    return { host: "unknown", provider: "PostgreSQL" }
  }
  try {
    const url = new URL(connectionString.replace("postgresql://", "http://"))
    const hostname = url.hostname
    let provider = "PostgreSQL Database"

    if (hostname.includes("supabase.co") || hostname.includes("supabase.com")) {
      const regionMatch = hostname.match(/([a-z0-9-]+)\.pooler\.supabase/)
      const region = regionMatch ? regionMatch[1] : "Cloud"
      provider = `Supabase PostgreSQL (${region})`
    } else if (hostname.includes("neon.tech")) {
      provider = "Neon Serverless Postgres"
    } else if (hostname === "localhost" || hostname === "127.0.0.1") {
      provider = "Local PostgreSQL"
    }

    return { host: hostname, provider }
  } catch {
    return { host: "remote-host", provider: "PostgreSQL" }
  }
}

/**
 * Mengambil ringkasan metrik kesehatan database PostgreSQL / Supabase
 * Dilengkapi proteksi autentikasi Superadmin (ADMIN) dan serialisasi data aman.
 */
export async function getDatabaseMetricsSummary(): Promise<DatabaseMetricsSummary> {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Hanya Superadmin yang berwenang mengakses data telemetri database.")
  }

  const startTime = Date.now()

  try {
    const [dbSizeRaw, cacheHitRaw, connRaw, topTablesRaw] = await Promise.all([
      // 1. Ukuran Total Database
      prisma.$queryRaw<Array<{ total_size: string; total_bytes: string }>>`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as total_size,
          pg_database_size(current_database())::text as total_bytes
      `,
      // 2. Buffer Cache Hit Ratio
      prisma.$queryRaw<Array<{ heap_read: string; heap_hit: string; cache_hit_ratio: number | null }>>`
        SELECT 
          COALESCE(sum(heap_blks_read), 0)::text as heap_read,
          COALESCE(sum(heap_blks_hit), 0)::text as heap_hit,
          COALESCE(round(sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2), 100)::float as cache_hit_ratio
        FROM pg_statio_user_tables
      `,
      // 3. Status Pool Koneksi
      prisma.$queryRaw<Array<{ total_connections: number; active_connections: number; idle_connections: number }>>`
        SELECT 
          count(*)::int as total_connections,
          count(*) FILTER (WHERE state = 'active')::int as active_connections,
          count(*) FILTER (WHERE state = 'idle')::int as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,
      // 4. 10 Tabel Terbesar berdasarkan penggunaan disk storage
      prisma.$queryRaw<Array<{ table_name: string; estimated_rows: string; total_size: string; total_bytes: string }>>`
        SELECT 
          relname as table_name,
          n_live_tup::text as estimated_rows,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size,
          pg_total_relation_size(relid)::text as total_bytes
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
        LIMIT 10
      `
    ])

    const latencyMs = Math.max(1, Date.now() - startTime)
    const hostInfo = parseHostInfo(process.env.DATABASE_URL)

    const dbSize = dbSizeRaw[0] || { total_size: "0 MB", total_bytes: "0" }
    const cacheHit = cacheHitRaw[0]
    const cacheHitRatio = cacheHit && cacheHit.cache_hit_ratio !== null ? Number(cacheHit.cache_hit_ratio) : 100

    const conn = connRaw[0] || { total_connections: 0, active_connections: 0, idle_connections: 0 }

    const topTables: DatabaseTableMetric[] = (topTablesRaw || []).map(r => ({
      tableName: r.table_name,
      estimatedRows: parseInt(r.estimated_rows || "0", 10),
      totalSize: r.total_size || "0 kB",
      totalBytes: parseInt(r.total_bytes || "0", 10)
    }))

    return {
      status: "ONLINE",
      host: hostInfo.host,
      provider: hostInfo.provider,
      latencyMs,
      totalDatabaseSize: dbSize.total_size,
      totalDatabaseBytes: parseInt(dbSize.total_bytes || "0", 10),
      cacheHitRatio,
      connections: {
        total: Number(conn.total_connections || 0),
        active: Number(conn.active_connections || 0),
        idle: Number(conn.idle_connections || 0)
      },
      topTables,
      fetchedAt: new Date().toISOString()
    }
  } catch (error: any) {
    console.error("[DatabaseMonitor] Gagal mengambil metrik database:", error)
    const hostInfo = parseHostInfo(process.env.DATABASE_URL)
    return {
      status: "DEGRADED",
      host: hostInfo.host,
      provider: hostInfo.provider,
      latencyMs: Date.now() - startTime,
      totalDatabaseSize: "Unknown",
      totalDatabaseBytes: 0,
      cacheHitRatio: 0,
      connections: { total: 0, active: 0, idle: 0 },
      topTables: [],
      fetchedAt: new Date().toISOString()
    }
  }
}

/**
 * Revalidasi cache metrik database
 */
export async function refreshDatabaseMetricsCache(): Promise<void> {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Hanya Superadmin yang berwenang.")
  }
  revalidatePath("/")
}
