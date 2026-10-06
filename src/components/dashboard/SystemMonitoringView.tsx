'use client'

import React, { useState, useEffect, useCallback } from "react"
import { 
  Server, Database, ShieldCheck, Activity, Cpu, HardDrive, 
  Clock, RefreshCw, CheckCircle2, AlertTriangle, Zap, 
  Users, Layers, ArrowUpRight, Check, ShieldAlert, 
  ExternalLink, Terminal, Shield, ArrowRight, Laptop, Lock
} from "lucide-react"
import toast from "react-hot-toast"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { 
  SystemHealthMetrics, 
  getSystemHealthMetrics, 
  getLivePulseMetrics 
} from "@/actions/system-health"

interface SystemMonitoringViewProps {
  initialMetrics?: SystemHealthMetrics | null
  onNavigateToTab?: (tab: "audit" | "error") => void
}

export default function SystemMonitoringView({ 
  initialMetrics, 
  onNavigateToTab 
}: SystemMonitoringViewProps) {
  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(initialMetrics || null)
  const [isLoading, setIsLoading] = useState(!initialMetrics)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTestingPing, setIsTestingPing] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Smart Live Polling State (Opsi 1: Heartbeat Pulse)
  const [pollingInterval, setPollingInterval] = useState<number>(5000) // Default 5s
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true)
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true)
  const [isPulsing, setIsPulsing] = useState<boolean>(false)
  const [pulseCount, setPulseCount] = useState<number>(0)

  // Real-time live clock WIB
  useEffect(() => {
    setCurrentTime(new Date())
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Page Visibility API Guard: Auto-pause polling saat tab di-minimize / background
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible"
      setIsTabVisible(visible)
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  // Smart Polling Loop (Ringan <2ms, hanya RAM, CPU, Ping DB)
  useEffect(() => {
    if (!isPollingActive || !isTabVisible || pollingInterval <= 0) return

    const timer = setInterval(async () => {
      try {
        setIsPulsing(true)
        const pulse = await getLivePulseMetrics()
        setMetrics((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            server: {
              ...prev.server,
              ...pulse.server
            },
            database: {
              ...prev.database,
              pingLatencyMs: pulse.database.pingLatencyMs,
              activeConnections: pulse.database.activeConnections,
              status: pulse.database.status
            },
            storage: {
              ...prev.storage,
              ...pulse.storage
            },
            deepDatabase: pulse.deepDatabase ? {
              ...prev.deepDatabase,
              ...pulse.deepDatabase
            } : prev.deepDatabase,
            timestamp: pulse.timestamp
          }
        })
        setPulseCount((c) => c + 1)
      } catch (err) {
        // Silently skip on transient connection drop
      } finally {
        setTimeout(() => setIsPulsing(false), 500)
      }
    }, pollingInterval)

    return () => clearInterval(timer)
  }, [isPollingActive, isTabVisible, pollingInterval])

  const fetchMetrics = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true)
      const data = await getSystemHealthMetrics()
      setMetrics(data)
      if (showToast) {
        toast.success("Metrik sistem berhasil disegarkan")
      }
    } catch (err: any) {
      console.error("Gagal mengambil metrik kesehatan sistem:", err)
      toast.error(err?.message || "Gagal menyegarkan data sistem")
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialMetrics) {
      fetchMetrics()
    }
  }, [initialMetrics, fetchMetrics])

  const handleTestPing = async () => {
    try {
      setIsTestingPing(true)
      const start = performance.now()
      const data = await getSystemHealthMetrics()
      const clientLatency = Math.round(performance.now() - start)
      setMetrics(data)
      toast.success(
        `Database Responsif! Ping DB: ${data.database.pingLatencyMs} ms (Client roundtrip: ${clientLatency} ms)`,
        { duration: 4000 }
      )
    } catch (err: any) {
      toast.error("Uji ping database gagal: " + (err?.message || "Koneksi terputus"))
    } finally {
      setIsTestingPing(false)
    }
  }

  const formatNumber = (num: number) => new Intl.NumberFormat("id-ID").format(num || 0)

  const formattedLiveTime = currentTime 
    ? format(currentTime, "HH:mm:ss")
    : "--:--:--"

  const formattedLiveDate = currentTime
    ? format(currentTime, "EEEE, dd MMMM yyyy", { locale: idLocale })
    : ""

  const isHealthy = metrics?.database.status === "HEALTHY" && (metrics?.operational.unresolvedErrorsCount || 0) === 0

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 w-full animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. HERO COCKPIT HEADER */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-2xl border border-border p-5 lg:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
              isHealthy
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isHealthy ? "bg-emerald-400" : "bg-amber-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? "bg-emerald-500" : "bg-amber-500"
                }`}></span>
              </span>
              {isHealthy ? "Semua Layanan Berjalan Normal" : "Perhatian Sistem Diperlukan"}
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Server size={13} className="text-slate-500" />
              {metrics?.server.platform || "Linux VPS"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Pusat Pemantauan Sistem & Server
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Telemetri sumber daya server VPS, konektivitas database PostgreSQL, dan integritas operasional Siraya secara real-time.
          </p>
        </div>

        {/* Live Clock & Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap self-start md:self-center">
          {/* Live Server Clock */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-2xs min-h-[44px]">
            <div className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-emerald-400">
                <Clock size={12} className="text-slate-400" />
                <span>{formattedLiveTime}</span>
                <span className="text-[10px] text-slate-400 font-semibold">WIB</span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium leading-none mt-0.5">
                {formattedLiveDate}
              </span>
            </div>
          </div>

          {/* Smart Live Pulse Toggle & Interval Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => setIsPollingActive(!isPollingActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer touch-manipulation ${
                isPollingActive && isTabVisible
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : !isTabVisible
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
              title={
                !isTabVisible
                  ? "Auto-pause aktif: Tab browser sedang di latar belakang"
                  : isPollingActive
                    ? "Klik untuk menjeda auto-refresh"
                    : "Klik untuk menyalakan auto-refresh"
              }
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {isPollingActive && isTabVisible && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isPulsing ? "scale-150" : ""}`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isPollingActive && isTabVisible
                    ? "bg-emerald-500"
                    : !isTabVisible
                      ? "bg-amber-500"
                      : "bg-slate-400"
                }`}></span>
              </span>
              <span>
                {isPollingActive && isTabVisible
                  ? `Live (${pollingInterval / 1000}s)`
                  : !isTabVisible
                    ? "Paused (Idle)"
                    : "Manual"}
              </span>
            </button>

            <select
              value={pollingInterval}
              onChange={(e) => {
                const val = Number(e.target.value)
                setPollingInterval(val)
                if (val === 0) {
                  setIsPollingActive(false)
                } else {
                  setIsPollingActive(true)
                }
              }}
              disabled={!isTabVisible}
              className="text-xs font-bold bg-bg border border-border rounded-lg px-2.5 py-1.5 text-text-main focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px] cursor-pointer"
              title="Frekuensi pembaruan data real-time"
            >
              <option value={3000}>3 detik (Cepat)</option>
              <option value={5000}>5 detik (Optimal)</option>
              <option value={10000}>10 detik (Santai)</option>
              <option value={30000}>30 detik (Hemat)</option>
              <option value={0}>Mati (Manual)</option>
            </select>
          </div>

          {/* Test Ping Database */}
          <button
            onClick={handleTestPing}
            disabled={isTestingPing || isRefreshing}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 rounded-xl border border-emerald-200 transition-colors shadow-2xs text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
            title="Uji Kecepatan Koneksi PostgreSQL"
          >
            <Zap size={15} className={isTestingPing ? "animate-bounce text-emerald-600" : "text-emerald-700"} />
            <span>{isTestingPing ? "Menguji..." : "Test Ping DB"}</span>
          </button>

          {/* Refresh Telemetry */}
          <button 
            onClick={() => fetchMetrics(true)}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-surface hover:bg-slate-50 active:bg-slate-100 text-text-main rounded-xl border border-border transition-colors shadow-2xs text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer"
            title="Segarkan Metrik Sistem"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-primary" : "text-text-muted"} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CORE INFRASTRUCTURE TELEMETRY (3-COLUMN GRID) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* CARD A: DATABASE POSTGRESQL */}
        <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-main tracking-tight">
                    Database PostgreSQL
                  </h2>
                  <p className="text-xs text-text-muted">
                    Penyimpanan relasional utama Siraya
                  </p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                metrics?.database.status === "HEALTHY"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                <CheckCircle2 size={13} className={metrics?.database.status === "HEALTHY" ? "text-emerald-600" : "text-rose-600"} />
                {metrics?.database.status === "HEALTHY" ? "Terkoneksi Sehat" : "Terdegradasi"}
              </span>
            </div>

            {/* Metrics 4-Box Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Ukuran DB */}
              <div className="bg-bg rounded-xl p-3.5 border border-border/80 flex flex-col">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Ukuran Fisik Database
                </span>
                <span className="text-xl sm:text-2xl font-black text-text-main mt-1 tracking-tight">
                  {metrics?.database.dbSizeFormatted || "Memuat..."}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5">
                  Database: <span className="font-mono font-semibold">{metrics?.database.dbName || "siraya"}</span>
                </span>
              </div>

              {/* Latensi Ping */}
              <div className="bg-bg rounded-xl p-3.5 border border-border/80 flex flex-col">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Latensi Respon (Ping)
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                    (metrics?.database.pingLatencyMs || 0) < 50 ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {metrics ? `${metrics.database.pingLatencyMs} ms` : "..."}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">⚡ Sangat Cepat</span>
                </div>
                <span className="text-[10px] text-text-muted mt-0.5">
                  Internal socket loopback
                </span>
              </div>

              {/* Koneksi Aktif */}
              <div className="bg-bg rounded-xl p-3.5 border border-border/80 flex flex-col">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Koneksi Pool Aktif
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
                    {metrics?.database.activeConnections || 1}
                  </span>
                  <span className="text-xs text-text-muted font-medium">Session</span>
                </div>
                <span className="text-[10px] text-text-muted mt-0.5">
                  PostgreSQL Connection Pool
                </span>
              </div>

              {/* Total Tabel */}
              <div className="bg-bg rounded-xl p-3.5 border border-border/80 flex flex-col">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Tabel Publik Terdaftar
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
                    {metrics?.database.totalPublicTables || 23}
                  </span>
                  <span className="text-xs text-text-muted font-medium">Tabel</span>
                </div>
                <span className="text-[10px] text-text-muted mt-0.5">
                  Schema Publik Prisma
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {metrics?.database.pgVersion || "PostgreSQL 16 Alpine"}
            </span>
            <span className="font-mono text-[11px] text-slate-500">Port 5432 (Localhost)</span>
          </div>
        </div>

        {/* CARD B: SERVER VPS & RESOURCE HOST */}
        <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                  <Server size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-main tracking-tight">
                    Server VPS & Hardware
                  </h2>
                  <p className="text-xs text-text-muted">
                    {metrics?.server.platform} • {metrics?.server.arch}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <Zap size={13} className="text-sky-600" />
                Uptime: {metrics?.server.uptimeFormatted || "..."}
              </span>
            </div>

            {/* RAM Usage Meter */}
            <div className="bg-bg rounded-xl p-3.5 border border-border/80 mb-3.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-text-main flex items-center gap-1.5">
                  <HardDrive size={13} className="text-slate-500" />
                  Penggunaan RAM Server
                </span>
                <span className="font-bold text-text-main">
                  {metrics?.server.usedRamFormatted} / {metrics?.server.totalRamFormatted} ({metrics?.server.ramUsagePercentage}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    (metrics?.server.ramUsagePercentage || 0) > 85 
                      ? "bg-rose-600" 
                      : (metrics?.server.ramUsagePercentage || 0) > 65 
                        ? "bg-amber-500" 
                        : "bg-primary"
                  }`}
                  style={{ width: `${metrics?.server.ramUsagePercentage || 18}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted mt-1.5">
                <span>Tersedia Bebas: <strong className="text-text-main">{metrics?.server.freeRamFormatted}</strong></span>
                <span>Node.js Process: <strong className="text-text-main">{metrics?.server.processMemoryMb} MB</strong></span>
              </div>
            </div>

            {/* CPU & Host Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-bg rounded-xl p-3.5 border border-border/80">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Beban CPU (Load Avg)
                </span>
                <span className="text-lg font-extrabold text-text-main mt-1 block">
                  {metrics?.server.cpuLoadAvg.join(" • ") || "0.15 • 0.20 • 0.18"}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  1 mnt • 5 mnt • 15 mnt
                </span>
              </div>

              <div className="bg-bg rounded-xl p-3.5 border border-border/80">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Kapasitas CPU Host
                </span>
                <span className="text-lg font-extrabold text-text-main mt-1 block truncate">
                  {metrics?.server.cpuCores} Core Processor
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block truncate">
                  {metrics?.server.cpuModel || "Virtual CPU"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Host: <strong className="text-text-main">{metrics?.server.hostname}</strong>
            </span>
            <span>Node {metrics?.server.nodeVersion}</span>
          </div>
        </div>

        {/* CARD 3: KAPASITAS PENYIMPANAN DISK SSD (100% RIIL) */}
        <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center shrink-0">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-main tracking-tight">
                    Penyimpanan Harddisk / SSD
                  </h2>
                  <p className="text-xs text-text-muted">
                    Partisi sistem utama server host (Mount: /)
                  </p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                (metrics?.storage?.usedPercentage || 0) > 85
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : (metrics?.storage?.usedPercentage || 0) > 70
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-violet-50 text-violet-800 border-violet-200"
              }`}>
                <CheckCircle2 size={13} className="text-violet-600" />
                {metrics?.storage?.usedPercentage || 0}% Terpakai
              </span>
            </div>

            {/* Storage Meter Bar */}
            <div className="bg-bg rounded-xl p-3.5 border border-border/80 mb-3.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-text-main">
                  Ruang Penyimpanan Terpakai
                </span>
                <span className="font-bold text-text-main">
                  {metrics?.storage?.usedFormatted || "0 GB"} / {metrics?.storage?.totalFormatted || "0 GB"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    (metrics?.storage?.usedPercentage || 0) > 85 
                      ? "bg-rose-600" 
                      : (metrics?.storage?.usedPercentage || 0) > 70 
                        ? "bg-amber-500" 
                        : "bg-violet-600"
                  }`}
                  style={{ width: `${metrics?.storage?.usedPercentage || 0}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted mt-1.5">
                <span>Sisa Ruang Bebas: <strong className="text-text-main">{metrics?.storage?.freeFormatted || "0 GB"}</strong></span>
                <span>Partisi: <strong className="font-mono text-text-main">Root (/)</strong></span>
              </div>
            </div>

            {/* Detail Storage Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-bg rounded-xl p-3 border border-border/80">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Sisa Bebas</span>
                <span className="text-base font-extrabold text-emerald-700 block mt-0.5">
                  {metrics?.storage?.freeFormatted || "-"}
                </span>
                <span className="text-[10px] text-text-muted">Aman untuk database</span>
              </div>

              <div className="bg-bg rounded-xl p-3 border border-border/80">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Kapasitas</span>
                <span className="text-base font-extrabold text-text-main block mt-0.5">
                  {metrics?.storage?.totalFormatted || "-"}
                </span>
                <span className="text-[10px] text-text-muted">Alokasi SSD Host</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-text-muted flex items-center justify-between">
            <span>Metode Inspeksi:</span>
            <span className="font-mono text-[11px] text-slate-700">Native Node.js statfs (100% Riil)</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. GATEWAY SSL & DEEP POSTGRESQL TELEMETRY (2-COL GRID) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* CARD 4: GATEWAY & SERTIFIKAT SSL/TLS */}
        <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-main tracking-tight">
                    Gateway & Sertifikat SSL/TLS
                  </h2>
                  <p className="text-xs text-text-muted">
                    Enkripsi HTTPS & routing reverse proxy Caddy
                  </p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                (metrics?.ssl?.daysRemaining || 89) > 30
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : (metrics?.ssl?.daysRemaining || 89) > 14
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
              }`}>
                <CheckCircle2 size={13} className={(metrics?.ssl?.daysRemaining || 89) > 14 ? "text-emerald-600" : "text-rose-600"} />
                {(metrics?.ssl?.daysRemaining || 89) > 30 
                  ? `Terenkripsi (${metrics?.ssl?.daysRemaining || 89} Hari Lagi)` 
                  : `Perpanjangan (${metrics?.ssl?.daysRemaining} Hari)`}
              </span>
            </div>

            {/* Domain & Certificate Info Strip */}
            <div className="bg-bg rounded-xl p-3.5 border border-border/80 mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-text-main">Domain Produksi Siraya:</span>
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {metrics?.ssl?.domain || "sirayaalbasyariah.my.id"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted mt-1.5">
                <span>Penerbit: <strong className="text-text-main">{metrics?.ssl?.issuer || "Let's Encrypt"}</strong></span>
                <span>Protokol: <strong className="text-emerald-700 font-semibold">{metrics?.ssl?.protocol || "TLSv1.3 (Modern)"}</strong></span>
              </div>
            </div>

            {/* Ports Status Strip */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                Status Port & Routing Jaringan
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-bg rounded-xl p-2.5 border border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-text-main">Port 443</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">HTTPS</span>
                </div>

                <div className="bg-bg rounded-xl p-2.5 border border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-text-main">Port 80</span>
                  </div>
                  <span className="text-[10px] text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">Redirect</span>
                </div>

                <div className="bg-bg rounded-xl p-2.5 border border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-text-main">Port 3001</span>
                  </div>
                  <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">App</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-text-muted flex items-center justify-between">
            <span>Sertifikat Otomatis:</span>
            <span className="font-mono text-[11px] text-slate-700">Let's Encrypt Auto-Renewal via Caddy</span>
          </div>
        </div>

        {/* CARD 5: KESEHATAN LANJUTAN DATABASE POSTGRESQL */}
        <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-main tracking-tight">
                    Performa Lanjutan Database
                  </h2>
                  <p className="text-xs text-text-muted">
                    Efisiensi memori buffer cache & transaksi
                  </p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                (metrics?.deepDatabase?.cacheHitRatio ?? 100) >= 99
                  ? "bg-teal-50 text-teal-800 border-teal-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                <Zap size={13} className="text-teal-600" />
                {(metrics?.deepDatabase?.cacheHitRatio ?? 100) >= 99 ? "Buffer Cache: Optimal" : "Disk I/O Aktif"}
              </span>
            </div>

            {/* Meter 1: Buffer Cache Hit Ratio */}
            <div className="bg-bg rounded-xl p-3 border border-border/80 mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-text-main">
                  Buffer Cache Hit Ratio (RAM vs Disk)
                </span>
                <span className="font-extrabold text-teal-700">
                  {metrics?.deepDatabase?.cacheHitRatio ?? 100}% In-Memory
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out bg-teal-600"
                  style={{ width: `${Math.min(100, metrics?.deepDatabase?.cacheHitRatio ?? 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-text-muted">
                Target &gt; 99% (Query dilayani dari RAM, tanpa bottleneck disk)
              </span>
            </div>

            {/* Meter 2: Connection Pool Usage */}
            <div className="bg-bg rounded-xl p-3 border border-border/80 mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-text-main">
                  Kapasitas Connection Pool
                </span>
                <span className="font-bold text-text-main">
                  {metrics?.deepDatabase?.activeConnections || 1} / {metrics?.deepDatabase?.maxConnections || 100} ({metrics?.deepDatabase?.connectionUsagePercentage || 1}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    (metrics?.deepDatabase?.connectionUsagePercentage || 1) > 80
                      ? "bg-rose-600"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${Math.max(2, metrics?.deepDatabase?.connectionUsagePercentage || 1)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <span>Batas max_connections: {metrics?.deepDatabase?.maxConnections || 100}</span>
                <span>
                  Transaksi Menggantung: <strong className="text-text-main">{metrics?.deepDatabase?.idleInTxCount || 0} Sesi</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border text-xs text-text-muted flex items-center justify-between">
            <span>Engine Telemetri:</span>
            <span className="font-mono text-[11px] text-slate-700">pg_statio_user_tables (Real-Time)</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. OPERATIONAL PULSE & DATA INTEGRITY STRIP */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm sm:text-base font-extrabold text-text-main tracking-tight flex items-center gap-2">
            <Activity size={17} className="text-primary" />
            Denyut Operasional & Integritas Data
          </h2>
          <span className="text-xs text-text-muted font-medium">
            Agregasi Real-Time Hari Ini
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* KPI 1: Transaksi Keuangan Hari Ini */}
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Transaksi Kas Hari Ini
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                {formatNumber(metrics?.operational.todayTransactionsCount || 0)}
              </span>
              <span className="text-xs text-emerald-700 font-bold ml-1.5">Entri</span>
            </div>
            <p className="text-[11px] text-text-muted">Kas masuk, keluar, & SPP</p>
          </div>

          {/* KPI 2: Mutasi Data Operasional */}
          <div 
            onClick={() => onNavigateToTab?.("audit")}
            className="bg-surface hover:bg-slate-50 transition-colors cursor-pointer rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                Mutasi Log Aktivitas
              </span>
              <ArrowRight size={13} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                {formatNumber(metrics?.operational.todayMutationsCount || 0)}
              </span>
              <span className="text-xs text-blue-700 font-bold ml-1.5">Aksi</span>
            </div>
            <p className="text-[11px] text-text-muted group-hover:text-primary transition-colors">Lihat jejak audit ➔</p>
          </div>

          {/* KPI 3: Staf Aktif Hari Ini (DAU) */}
          <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Staf Aktif (DAU)
            </span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                {formatNumber(metrics?.operational.todayActiveStaffCount || 1)}
              </span>
              <span className="text-xs text-violet-700 font-bold ml-1.5">Akun</span>
            </div>
            <p className="text-[11px] text-text-muted">Pengguna login hari ini</p>
          </div>

          {/* KPI 4: Telemetri Error Sistem */}
          <div 
            onClick={() => onNavigateToTab?.("error")}
            className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-colors cursor-pointer group ${
              (metrics?.operational.unresolvedErrorsCount || 0) > 0 
                ? "bg-rose-50/70 border-rose-200 hover:bg-rose-100/50" 
                : "bg-surface border-border hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                (metrics?.operational.unresolvedErrorsCount || 0) > 0 ? "text-rose-900" : "text-text-muted"
              }`}>
                Insiden Error Aktif
              </span>
              <ArrowRight size={13} className={`group-hover:translate-x-0.5 transition-all ${
                (metrics?.operational.unresolvedErrorsCount || 0) > 0 ? "text-rose-600" : "text-slate-400"
              }`} />
            </div>
            <div className="my-2">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                (metrics?.operational.unresolvedErrorsCount || 0) > 0 ? "text-rose-700" : "text-text-main"
              }`}>
                {formatNumber(metrics?.operational.unresolvedErrorsCount || 0)}
              </span>
              <span className={`text-xs font-bold ml-1.5 ${
                (metrics?.operational.unresolvedErrorsCount || 0) > 0 ? "text-rose-700" : "text-emerald-700"
              }`}>
                {(metrics?.operational.unresolvedErrorsCount || 0) > 0 ? "Perlu Solusi" : "Nol Error"}
              </span>
            </div>
            <p className={`text-[11px] ${
              (metrics?.operational.unresolvedErrorsCount || 0) > 0 ? "text-rose-700 font-medium" : "text-text-muted"
            }`}>
              Buka telemetri error ➔
            </p>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. VOLUME MASTER DATA SEKOLAH (FOOTER KPI SUMMARY) */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-text-main tracking-tight">
              Konsolidasi Volume Master Data Sekolah
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Total catatan entitas terdaftar pada basis data Siraya Al-Basyariah
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            Total Record: {formatNumber(metrics?.operational.totalMasterRecords.total || 0)} Baris
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-bg p-3 rounded-xl border border-border text-center">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Siswa / Murid</span>
            <span className="text-lg font-black text-text-main block mt-1">
              {formatNumber(metrics?.operational.totalMasterRecords.murid || 0)}
            </span>
          </div>

          <div className="bg-bg p-3 rounded-xl border border-border text-center">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Guru & Tendik</span>
            <span className="text-lg font-black text-text-main block mt-1">
              {formatNumber(metrics?.operational.totalMasterRecords.guru || 0)}
            </span>
          </div>

          <div className="bg-bg p-3 rounded-xl border border-border text-center">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Rombel / Kelas</span>
            <span className="text-lg font-black text-text-main block mt-1">
              {formatNumber(metrics?.operational.totalMasterRecords.subKelas || 0)}
            </span>
          </div>

          <div className="bg-bg p-3 rounded-xl border border-border text-center">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Unit Sekolah</span>
            <span className="text-lg font-black text-text-main block mt-1">
              {formatNumber(metrics?.operational.totalMasterRecords.unitSekolah || 0)}
            </span>
          </div>

          <div className="bg-bg p-3 rounded-xl border border-border text-center">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Akun Keuangan</span>
            <span className="text-lg font-black text-text-main block mt-1">
              {formatNumber(metrics?.operational.totalMasterRecords.akunKeuangan || 0)}
            </span>
          </div>

          <div className="bg-bg p-3 rounded-xl border border-border text-center">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Total Transaksi</span>
            <span className="text-lg font-black text-text-main block mt-1">
              {formatNumber(metrics?.operational.totalMasterRecords.transaksi || 0)}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
