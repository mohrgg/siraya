"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Database, Server, HardDrive, Zap, Activity, RefreshCw, 
  Clock, ShieldCheck, CheckCircle2, Layers, Search, X, 
  Check, FileText, Cpu, ArrowUpRight
} from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast from "react-hot-toast"
import { 
  getDatabaseMetricsSummary, 
  DatabaseMetricsSummary, 
  DatabaseTableMetric 
} from "@/actions/database-monitor"

export default function DatabaseMonitoringView() {
  const [data, setData] = useState<DatabaseMetricsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Live Real-Time Clock (Ticks every 1 second, matching Audit and Error tabs)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedLiveTime = currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"
  const formattedLiveDate = currentTime
    ? format(currentTime, "EEEE, dd MMM yyyy", { locale: idLocale })
    : ""

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const result = await getDatabaseMetricsSummary()
      setData(result)
      setLastRefreshedAt(new Date())
      if (isManualRefresh) {
        toast.success("Metrik database berhasil diperbarui")
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat status database")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatNumber = (num: number) => new Intl.NumberFormat("id-ID").format(num || 0)

  // Filter tabel berdasarkan search term
  const filteredTables = useMemo(() => {
    if (!data?.topTables) return []
    if (!searchTerm.trim()) return data.topTables
    const q = searchTerm.toLowerCase()
    return data.topTables.filter(t => t.tableName.toLowerCase().includes(q))
  }, [data?.topTables, searchTerm])

  // Kapasitas terbesar untuk visual bar
  const maxTableBytes = data?.topTables?.[0]?.totalBytes || 1

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full min-w-0 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. HEADER COCKPIT & SYSTEM STATUS BANNER                 */}
      {/* ======================================================== */}
      {/* 1A. DESKTOP HEADER (>=md) */}
      <div className="hidden md:flex bg-surface rounded-2xl border border-border p-5 lg:p-6 shadow-xs flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Database size={14} className="text-emerald-700" />
              Live Database Telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Host: {data?.host || "Supabase Pooler"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Pemantauan & Kesehatan Database
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Telemetri performa engine PostgreSQL Supabase, kapasitas penyimpanan tabel, efisiensi buffer cache, dan status koneksi pool aktif.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center flex-wrap">
          {/* Live Clock Widget */}
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
              {formattedLiveDate ? (
                <span className="text-[10px] text-slate-300 font-medium leading-none mt-0.5">
                  {formattedLiveDate}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  Zona: UTC+7
                </span>
              )}
            </div>
          </div>

          {/* Tombol Segarkan */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-surface hover:bg-slate-50 active:bg-slate-100 text-text-main rounded-xl border border-border transition-colors shadow-2xs text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer"
            title="Segarkan Metrik Database"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-primary" : "text-text-muted"} />
            <span>{isRefreshing ? "Menyegarkan..." : "Segarkan"}</span>
          </button>
        </div>
      </div>

      {/* 1B. MOBILE HEADER (<md) */}
      <div className="flex md:hidden bg-surface rounded-2xl border border-border p-4 shadow-xs flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Database size={12} className="text-emerald-700" />
            Live Database
          </span>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{formattedLiveTime} WIB</span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-text-main tracking-tight leading-tight">
            Pemantauan Database
          </h1>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Status PostgreSQL Supabase dan kapasitas penyimpanan tabel.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
            <Server size={12} className="text-slate-400" />
            {data?.provider || "Supabase"}
          </span>

          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg hover:bg-slate-100 text-text-main border border-border text-xs font-bold transition-all min-h-[38px] cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-primary" : "text-text-muted"} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP DATABASE METRIC KPI STRIP                         */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm sm:text-base font-extrabold text-text-main tracking-tight flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            Ringkasan Performa & Kapasitas Database
          </h2>
          {lastRefreshedAt && (
            <span className="text-xs text-text-muted font-medium">
              Update: {lastRefreshedAt.toLocaleTimeString("id-ID")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* KPI 1: Ukuran Total DB (Dark Theme Slate Card - Standard Hero KPI) */}
          <div className="col-span-2 sm:col-span-1 bg-[#0f172a] text-white rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Ukuran Total DB
              </span>
              <div className="w-7 h-7 bg-slate-800 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <HardDrive size={15} />
              </div>
            </div>
            <div>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-800 rounded animate-pulse mb-1" />
              ) : (
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {data?.totalDatabaseSize || "0 MB"}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">Kapasitas PostgreSQL disk</p>
            </div>
          </div>

          {/* KPI 2: Cache Hit Ratio */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Cache Hit Ratio
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Zap size={15} />
              </div>
            </div>
            <div>
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                    {data?.cacheHitRatio ?? 100}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">%</span>
                </div>
              )}
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Efisiensi buffer memori</p>
            </div>
          </div>

          {/* KPI 3: Koneksi Pool Terbuka */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Koneksi Pool
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Server size={15} />
              </div>
            </div>
            <div>
              {isLoading ? (
                <div className="h-8 w-20 bg-slate-100 rounded animate-pulse mb-1" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                    {data?.connections.total ?? 0}
                  </span>
                  <span className="text-xs text-text-muted">Pool</span>
                </div>
              )}
              <p className="text-[11px] text-text-muted mt-0.5">
                <span className="font-semibold text-emerald-600">{data?.connections.active ?? 0} aktif</span> · {data?.connections.idle ?? 0} idle
              </p>
            </div>
          </div>

          {/* KPI 4: Query Latency Ping */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Query Latency
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Activity size={15} />
              </div>
            </div>
            <div>
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                    {data?.latencyMs ?? 0}
                  </span>
                  <span className="text-xs font-bold text-amber-600">ms</span>
                </div>
              )}
              <p className="text-[11px] text-text-muted mt-0.5">Round-trip database ping</p>
            </div>
          </div>

          {/* KPI 5: Provider & Status */}
          <div className="col-span-2 sm:col-span-1 bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Infrastruktur
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <Cpu size={15} />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-extrabold text-text-main tracking-tight truncate">
                {data?.provider || "Supabase"}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Engine Siap</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MAIN CARD: TOOLBAR + TABEL 10 TABEL TERBESAR         */}
      {/* ======================================================== */}
      <section className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 flex flex-col gap-5">
        {/* Fake Tab Header Wajib (Aturan UI/UX Siraya Unified Layout) */}
        <div className="flex items-center justify-between border-b border-border pb-0">
          <div className="flex gap-2">
            <button className="px-5 py-3 font-bold text-xs sm:text-sm transition-colors border-b-2 border-primary text-primary flex items-center gap-2 cursor-default">
              <Layers size={16} />
              <span>10 Tabel Terbesar Database</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                {filteredTables.length} Tabel
              </span>
            </button>
          </div>
          <span className="text-xs text-text-muted hidden sm:inline">
            Diurutkan berdasarkan disk storage fisik
          </span>
        </div>

        {/* Toolbar Pencarian */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/60" size={16} />
            <input
              type="text"
              placeholder="Cari nama tabel (misal: LogAktivitas, Tagihan)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="text-xs text-text-muted font-medium self-end sm:self-center">
            Total Database: <span className="font-bold text-text-main">{data?.totalDatabaseSize || "11 MB"}</span>
          </div>
        </div>

        {/* Tabel Data (Aturan UI/UX Siraya 5: Pembungkus tabel hanya overflow-x-auto) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                <th className="py-3 px-4 font-semibold">Nama Tabel</th>
                <th className="py-3 px-4 font-semibold text-right">Estimasi Baris</th>
                <th className="py-3 px-4 font-semibold text-right">Penggunaan Disk</th>
                <th className="py-3 px-6 font-semibold w-64">Distribusi Kapasitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4 text-center"><div className="h-4 w-4 bg-slate-100 mx-auto rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 w-16 bg-slate-100 ml-auto rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 w-16 bg-slate-100 ml-auto rounded" /></td>
                    <td className="py-3.5 px-6"><div className="h-2 w-full bg-slate-100 rounded-full" /></td>
                  </tr>
                ))
              ) : filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Database size={40} className="text-gray-300 mb-3" />
                      <p className="text-text-muted font-medium text-sm">Belum ada data...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTables.map((t, idx) => {
                  const percent = Math.max(3, Math.round((t.totalBytes / maxTableBytes) * 100))
                  return (
                    <tr key={t.tableName} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <FileText size={13} />
                          </div>
                          <span className="font-mono text-xs font-bold text-text-main group-hover:text-primary transition-colors">
                            {t.tableName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-text-muted">
                        {formatNumber(t.estimatedRows)} <span className="text-[11px] opacity-70">baris</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-text-main">
                        {t.totalSize}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono font-medium text-text-muted w-9 text-right">
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. SECURITY & USAGE NOTE BOX (Matching Audit Tab Note)   */}
      {/* ======================================================== */}
      <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5 shadow-2xs">
        <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px] sm:text-xs">
          <strong className="text-slate-900 block mb-0.5">Arsitektur Zero-Waste & Anti-Usage Vercel</strong>
          Metrik database ini menggunakan pola <em>On-Demand Lazy Loading</em> dan <em>Manual Refresh</em>. Data diambil langsung dari katalog internal PostgreSQL Supabase dengan payload mikro (&plusmn;1,5 KB) dan waktu eksekusi secepat kilat (&lt;30 ms), sehingga 100% aman dan tidak menambah kuota Vercel Function ataupun Fast Origin Transfer.
        </div>
      </div>
    </div>
  )
}
