'use client'

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Calendar,
  User,
  Server,
  Terminal,
  Trash2,
  Eye,
  Activity,
  Check,
  ShieldAlert,
  ArrowRight,
  Globe,
  Monitor,
  Cpu,
  Layers,
  FileCode,
  Tag,
  Hash,
  FlaskConical,
  Table,
  Play,
  Pause,
  Radio,
  Smartphone,
  Laptop
} from "lucide-react"
import toast from "react-hot-toast"
import { format, formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  Toolbar,
  ToolbarSearch,
  ToolbarFilter,
  ToolbarActions,
  ToolbarExportExcel,
  ToolbarExportPDF
} from "@/components/ui/DataTableToolbar"
import {
  getPaginatedErrorLogs,
  getErrorCockpitSummary,
  updateErrorLogStatus,
  purgeResolvedErrorLogs,
  getAllErrorLogsForExport,
  simulateTestErrorAction,
  ErrorCockpitSummary
} from "@/actions/error-log"
import { exportToExcel } from "@/lib/excel"

interface SystemErrorTelemetriViewProps {
  initialSummary?: ErrorCockpitSummary | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  UNRESOLVED: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Belum Ditangani"
  },
  INVESTIGATING: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    label: "Investigasi"
  },
  RESOLVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Terselesaikan"
  },
  IGNORED: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "Diabaikan"
  }
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  FATAL: { bg: "bg-red-600 text-white", text: "text-white", border: "border-red-700" },
  ERROR: { bg: "bg-rose-100 text-rose-800", text: "text-rose-800", border: "border-rose-200" },
  WARN: { bg: "bg-amber-100 text-amber-800", text: "text-amber-800", border: "border-amber-200" }
}

export default function SystemErrorTelemetriView({ initialSummary }: SystemErrorTelemetriViewProps) {
  // 1. Summary & Realtime Clock
  const [summary, setSummary] = useState<ErrorCockpitSummary | null>(initialSummary || null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // 2. Filters & Search
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search 400ms untuk menekan lonjakan serverless invocation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [severityFilter, setSeverityFilter] = useState("ALL")
  const [sourceFilter, setSourceFilter] = useState("ALL")
  const [environmentFilter, setEnvironmentFilter] = useState("ALL")
  const [datePreset, setDatePreset] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // 3. Pagination & Data
  const [logs, setLogs] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalLogs, setTotalLogs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 4. Side Drawer Inspector
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [resolutionInput, setResolutionInput] = useState("")

  // 5. Maintenance / Purge Modal
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [purgeDays, setPurgeDays] = useState(30)
  const [isPurging, setIsPurging] = useState(false)

  // 6. Export states
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  // 7. Live Stream & View Mode states
  const [isLiveStreaming, setIsLiveStreaming] = useState(true)
  const [viewMode, setViewMode] = useState<"table" | "terminal">("table")
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set())

  // Live Clock Tick
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedLiveTime = currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"
  const formattedLiveDate = currentTime
    ? format(currentTime, "EEEE, dd MMM yyyy", { locale: idLocale })
    : ""

  // Fetch Cockpit Summary
  const fetchSummary = useCallback(async () => {
    try {
      const data = await getErrorCockpitSummary()
      setSummary(data)
    } catch (err) {
      console.error("Gagal memuat ringkasan error cockpit:", err)
    }
  }, [])

  // Fetch Paginated Logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPaginatedErrorLogs({
        page: currentPage,
        pageSize,
        status: statusFilter,
        severity: severityFilter,
        source: sourceFilter,
        environment: environmentFilter,
        search: debouncedSearch,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      setLogs(res.logs)
      setTotalLogs(res.total)
      setTotalPages(res.totalPages)
    } catch (err: any) {
      toast.error(err?.message || "Gagal memuat log error sistem")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [
    currentPage,
    pageSize,
    statusFilter,
    severityFilter,
    sourceFilter,
    environmentFilter,
    debouncedSearch,
    startDate,
    endDate
  ])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Polling Live Streaming setiap 3 detik (Vercel-like real-time monitor)
  useEffect(() => {
    if (!isLiveStreaming) return
    if (selectedLogIndex !== null) return // Jeda otomatis saat Side Drawer terbuka

    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return // Jeda saat tab browser tidak aktif (hemat koneksi)
      }

      try {
        const res = await getPaginatedErrorLogs({
          page: 1,
          pageSize,
          status: statusFilter,
          severity: severityFilter,
          source: sourceFilter,
          environment: environmentFilter,
          search: searchTerm,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        })

        setLogs((prevLogs) => {
          if (prevLogs.length === 0 && res.logs.length > 0) {
            return res.logs
          }
          const newItems = res.logs.filter(
            (nl: any) => !prevLogs.some((pl: any) => pl.id === nl.id)
          )

          if (newItems.length > 0) {
            const freshIds = new Set<string>(newItems.map((l: any) => String(l.id)))
            setNewLogIds(freshIds)
            setTimeout(() => {
              setNewLogIds(new Set())
            }, 4000)
          }

          return res.logs
        })

        setTotalLogs(res.total)
        setTotalPages(res.totalPages)

        const latestSummary = await getErrorCockpitSummary()
        setSummary(latestSummary)
      } catch (err) {
        // Silent catch background stream
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [
    isLiveStreaming,
    selectedLogIndex,
    pageSize,
    statusFilter,
    severityFilter,
    sourceFilter,
    environmentFilter,
    searchTerm,
    startDate,
    endDate
  ])

  useEffect(() => {
    if (!initialSummary) {
      fetchSummary()
    }
  }, [initialSummary, fetchSummary])

  // Sync resolution input when selected log changes
  useEffect(() => {
    if (selectedLogIndex !== null && logs[selectedLogIndex]) {
      setResolutionInput(logs[selectedLogIndex].resolutionNote || "")
    }
  }, [selectedLogIndex, logs])

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchLogs(), fetchSummary()])
    toast.success("Telemetri error berhasil disegarkan")
  }

  // Handle Date Presets
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    setCurrentPage(1)
    const today = new Date()
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    if (preset === "TODAY") {
      const str = formatDateStr(today)
      setStartDate(str)
      setEndDate(str)
    } else if (preset === "24H") {
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setStartDate(formatDateStr(past))
      setEndDate(formatDateStr(today))
    } else if (preset === "7D") {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      setStartDate(formatDateStr(past))
      setEndDate(formatDateStr(today))
    } else if (preset === "30D") {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      setStartDate(formatDateStr(past))
      setEndDate(formatDateStr(today))
    } else {
      setStartDate("")
      setEndDate("")
    }
  }

  // Handle Status Update from Drawer
  const handleStatusChange = async (newStatus: "UNRESOLVED" | "INVESTIGATING" | "RESOLVED" | "IGNORED") => {
    if (selectedLogIndex === null || !logs[selectedLogIndex]) return
    const activeLog = logs[selectedLogIndex]
    setIsUpdatingStatus(true)
    try {
      await updateErrorLogStatus(activeLog.id, newStatus, resolutionInput)
      toast.success(`Status berhasil diubah ke ${STATUS_COLORS[newStatus]?.label || newStatus}`)
      
      // Update local state smoothly
      const updatedLogs = [...logs]
      updatedLogs[selectedLogIndex] = {
        ...activeLog,
        status: newStatus,
        resolutionNote: resolutionInput,
        resolvedAt: newStatus === "RESOLVED" ? new Date().toISOString() : null
      }
      setLogs(updatedLogs)
      fetchSummary()
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui status error")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle Save Resolution Note Only
  const handleSaveResolutionNote = async () => {
    if (selectedLogIndex === null || !logs[selectedLogIndex]) return
    const activeLog = logs[selectedLogIndex]
    setIsUpdatingStatus(true)
    try {
      await updateErrorLogStatus(activeLog.id, activeLog.status, resolutionInput)
      toast.success("Catatan resolusi berhasil disimpan")
      const updatedLogs = [...logs]
      updatedLogs[selectedLogIndex] = {
        ...activeLog,
        resolutionNote: resolutionInput
      }
      setLogs(updatedLogs)
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan catatan")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle Purge
  const handleConfirmPurge = async () => {
    setIsPurging(true)
    try {
      const res = await purgeResolvedErrorLogs(purgeDays)
      toast.success(`${res.count} log terselesaikan berhasil dibersihkan`)
      setShowPurgeModal(false)
      fetchLogs()
      fetchSummary()
    } catch (err: any) {
      toast.error(err?.message || "Gagal membersihkan log")
    } finally {
      setIsPurging(false)
    }
  }

  // Uji Coba Simulasi Error
  const handleSimulateError = async () => {
    setIsSimulating(true)
    try {
      await simulateTestErrorAction()
      toast.success("Uji coba telemetri berhasil dikirim! Memuat data...")
      await Promise.all([fetchLogs(), fetchSummary()])
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengirim simulasi error")
    } finally {
      setIsSimulating(false)
    }
  }

  // Copy Stack Trace
  const handleCopyStackTrace = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Stack trace berhasil disalin ke clipboard")
  }

  // Export to Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const exportData = await getAllErrorLogsForExport({
        status: statusFilter,
        severity: severityFilter,
        source: sourceFilter,
        environment: environmentFilter,
        search: searchTerm,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      if (exportData.length === 0) {
        toast.error("Tidak ada data error untuk diekspor")
        return
      }
      exportToExcel(exportData, `Log_Error_Sistem_${format(new Date(), "yyyyMMdd_HHmm")}`, {
        title: "LAPORAN TELEMETRI & LOG ERROR SISTEM",
        unitInfo: { name: "SIRAYA - OPERASIONAL & INFRASTRUKTUR" },
        sheetName: "Error Logs"
      })
      toast.success("Ekspor Excel berhasil diunduh")
    } catch (err) {
      toast.error("Gagal mengekspor data Excel")
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const exportData = await getAllErrorLogsForExport({
        status: statusFilter,
        severity: severityFilter,
        source: sourceFilter,
        environment: environmentFilter,
        search: searchTerm,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })

      if (exportData.length === 0) {
        toast.error("Tidak ada data error untuk diekspor")
        return
      }

      exportTablePdf({
        institutionInfo: {
          namaYayasan: "SISTEM INFORMASI SIRAYA",
          namaUnit: "Dashboard Operasional & Pemantauan Telemetri Server",
          alamat: "VPS & Vercel Real-Time Diagnostics",
          telepon: "-"
        },
        title: "LAPORAN JEJAK ERROR SISTEM & DIAGNOSTIK",
        subtitle: `Periode: ${startDate || "Awal"} s/d ${endDate || "Sekarang"} | Total: ${exportData.length} Insiden`,
        headers: ["Waktu Terakhir", "Status", "Tingkat", "Lingkungan", "Pesan Error", "Pengguna", "Frekuensi"],
        data: exportData.map((l: any) => [
          l.waktuTerakhir,
          l.status,
          l.tingkat,
          l.lingkungan,
          l.pesanError?.slice(0, 75) || "-",
          l.namaPengguna || "Anonim",
          `${l.kejadian}x`
        ]),
        filename: `Laporan_Error_Sistem_${format(new Date(), "yyyyMMdd")}`,
        config: { orientation: "landscape" }
      })
      toast.success("Ekspor PDF berhasil disiapkan")
    } catch (err) {
      toast.error("Gagal mengekspor PDF")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const activeLog = selectedLogIndex !== null ? logs[selectedLogIndex] : null

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full min-w-0 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. HEADER TELEMETRY & SYSTEM STATUS BANNER */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <ShieldAlert size={14} className="text-rose-700" />
              Real-Time Error Telemetry
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Runtime Aktif: {summary?.currentRuntime?.environment || "Mendeteksi..."}
              {summary?.currentRuntime?.runtimeHost ? ` (${summary.currentRuntime.runtimeHost})` : ""}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
            Pemantauan & Pelacakan Error Sistem
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Inspeksi insiden runtime aplikasi pada Server Actions, Route Handlers, dan Client Browser secara komprehensif.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Live Clock Widget */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-2xs min-h-[44px]">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                <Clock size={11} className="text-slate-400" />
                <span>{formattedLiveTime}</span>
                <span className="text-[10px] text-slate-400 font-normal">WIB</span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium leading-none mt-0.5">
                {formattedLiveDate}
              </span>
            </div>
          </div>

          {/* Live Streaming Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsLiveStreaming((prev) => !prev)
              toast(isLiveStreaming ? "Live stream dijeda" : "Live stream diaktifkan", {
                icon: isLiveStreaming ? "⏸️" : "🟢"
              })
            }}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border transition-all text-xs sm:text-sm font-bold cursor-pointer ${
              isLiveStreaming
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 shadow-2xs"
                : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60 hover:bg-slate-200"
            }`}
            title={isLiveStreaming ? "Klik untuk menjeda live stream" : "Klik untuk mengaktifkan live stream"}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isLiveStreaming ? "bg-emerald-500" : "bg-slate-400"
              }`}></span>
            </span>
            <span>{isLiveStreaming ? "LIVE (3s)" : "STREAM DIJEDA"}</span>
          </button>

          {/* Tombol Uji Coba Telemetri */}
          <button
            onClick={handleSimulateError}
            disabled={isSimulating}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-400 dark:border-amber-800/60 rounded-xl border border-amber-200 transition-colors shadow-2xs text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
            title="Kirim insiden simulasi untuk menguji deteksi Vercel/VPS"
          >
            <FlaskConical size={14} className={isSimulating ? "animate-spin text-amber-700 dark:text-amber-400" : "text-amber-700 dark:text-amber-400"} />
            <span className="hidden sm:inline">{isSimulating ? "Mengirim..." : "Uji Coba Telemetri"}</span>
          </button>

          {/* Tombol Segarkan */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 bg-surface hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-surface-hover text-text-main rounded-xl border border-border transition-colors shadow-2xs text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer"
            title="Segarkan Data Error"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-primary" : "text-text-muted"} />
            <span>Segarkan</span>
          </button>

          {/* Tombol Bersihkan Log */}
          <button
            onClick={() => setShowPurgeModal(true)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 bg-surface hover:bg-rose-50 text-rose-700 hover:text-rose-800 rounded-xl border border-rose-200 transition-colors shadow-2xs text-xs sm:text-sm font-semibold cursor-pointer"
            title="Bersihkan Log Usang yang Terselesaikan"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Bersihkan Log</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP METRIC KPI STRIP */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Belum Ditangani (Critical Highlight) */}
        <div className={`col-span-2 sm:col-span-1 rounded-2xl border p-4 shadow-xs flex flex-col justify-between ${
          (summary?.totalUnresolved || 0) > 0 ? "bg-rose-50/80 border-rose-200" : "bg-surface border-border"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
              Belum Ditangani
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {summary?.totalUnresolved ?? 0}
            </div>
            <p className="text-[11px] text-rose-800 font-medium mt-0.5">Memerlukan investigasi</p>
          </div>
        </div>

        {/* KPI 2: Insiden 24 Jam Terakhir */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              24 Jam Terakhir
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
              {summary?.last24hCount ?? 0}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Insiden baru hari ini</p>
          </div>
        </div>

        {/* KPI 3: Crash Kritis (Fatal / 500) */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Crash Fatal (500)
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
              {summary?.totalFatal ?? 0}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Server crash & 500 status</p>
          </div>
        </div>

        {/* KPI 4: Pengguna Terdampak */}
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              User Terdampak
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <User size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
              {summary?.affectedUsersCount ?? 0}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Akun unik pelapor</p>
          </div>
        </div>

        {/* KPI 5: Runtime Environment Breakdown */}
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Log Error Per Host
              </span>
              <p className="text-[10px] text-slate-400">Akumulasi insiden tercatat</p>
            </div>
            <Server size={15} className="text-emerald-400" />
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 mt-1">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Vercel:
            </span>
            <span className="font-bold text-white">{summary?.envBreakdown.vercel ?? 0} log</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> VPS:
            </span>
            <span className="font-bold text-white">{summary?.envBreakdown.vps ?? 0} log</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TOOLBAR FILTERS & ACTIONS */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col gap-3">
        <Toolbar className="mb-0">
          <ToolbarSearch
            placeholder="Cari pesan, path, user, digest..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            onClear={() => {
              setSearchTerm("")
              setCurrentPage(1)
            }}
            containerClassName="w-full sm:w-60 xl:w-72"
          />

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <ToolbarFilter
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
              options={[
                { label: "Semua Status", value: "ALL" },
                { label: "Belum Ditangani", value: "UNRESOLVED" },
                { label: "Dalam Investigasi", value: "INVESTIGATING" },
                { label: "Terselesaikan", value: "RESOLVED" },
                { label: "Diabaikan", value: "IGNORED" }
              ]}
            />

            <ToolbarFilter
              value={severityFilter}
              onChange={(val) => {
                setSeverityFilter(val)
                setCurrentPage(1)
              }}
              options={[
                { label: "Semua Tingkat", value: "ALL" },
                { label: "Fatal (500)", value: "FATAL" },
                { label: "Error Standar", value: "ERROR" },
                { label: "Warning", value: "WARN" }
              ]}
            />

            <ToolbarFilter
              value={environmentFilter}
              onChange={(val) => {
                setEnvironmentFilter(val)
                setCurrentPage(1)
              }}
              options={[
                { label: "Semua Host", value: "ALL" },
                { label: "Vercel", value: "VERCEL" },
                { label: "VPS", value: "VPS" },
                { label: "Lokal / Dev", value: "LOCAL" }
              ]}
            />

            <ToolbarFilter
              value={datePreset}
              onChange={handleDatePresetChange}
              options={[
                { label: "Semua Waktu", value: "ALL" },
                { label: "Hari Ini", value: "TODAY" },
                { label: "24 Jam Terakhir", value: "24H" },
                { label: "7 Hari Terakhir", value: "7D" },
                { label: "30 Hari Terakhir", value: "30D" }
              ]}
            />
          </div>

          <ToolbarActions>
            {/* View Mode Switcher: Tabel vs Terminal Vercel Style */}
            <div className="flex items-center p-1 bg-bg border border-border rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-surface text-primary shadow-xs border border-border/80"
                    : "text-text-muted hover:text-text-main"
                }`}
                title="Tampilan Tabel Data"
              >
                <Table size={13} />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("terminal")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "terminal"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-text-muted hover:text-text-main"
                }`}
                title="Tampilan Konsol Terminal ala Vercel"
              >
                <Terminal size={13} />
                <span className="hidden sm:inline">Console</span>
              </button>
            </div>

            <ToolbarExportExcel
              onClick={handleExportExcel}
              isExporting={isExportingExcel}
              disabled={isLoading}
            />
            <ToolbarExportPDF
              onClick={handleExportPDF}
              isExporting={isExportingPDF}
              disabled={isLoading}
            />
          </ToolbarActions>
        </Toolbar>
      </div>

      {/* ======================================================== */}
      {/* 4. ERROR LOGS DISPLAY: TABLE (DESKTOP) & CARDS (MOBILE) */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-8 flex flex-col items-center justify-center text-text-muted min-h-[260px]">
            <RefreshCw size={24} className="animate-spin text-primary mb-2" />
            <span className="text-xs font-medium">Memuat log telemetri error...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && logs.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-base font-bold text-text-main">
              Tidak Ditemukan Insiden Error
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-md">
              Sistem beroperasi normal tanpa insiden runtime yang tercatat di lingkungan {summary?.currentRuntime?.environment || "server"}.
            </p>
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
              <button
                onClick={handleSimulateError}
                disabled={isSimulating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 text-xs font-semibold min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                <FlaskConical size={14} className={isSimulating ? "animate-spin text-amber-700" : "text-amber-700"} />
                <span>{isSimulating ? "Mengirim insiden..." : "Kirim Uji Coba Telemetri"}</span>
              </button>
              {(statusFilter !== "ALL" || severityFilter !== "ALL" || sourceFilter !== "ALL" || environmentFilter !== "ALL" || searchTerm !== "") && (
                <button
                  onClick={() => {
                    setStatusFilter("ALL")
                    setSeverityFilter("ALL")
                    setSourceFilter("ALL")
                    setEnvironmentFilter("ALL")
                    setDatePreset("ALL")
                    setSearchTerm("")
                  }}
                  className="px-4 py-2 bg-bg hover:bg-slate-100 rounded-xl border border-border text-xs font-semibold text-text-main min-h-[44px] cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW A: TERMINAL CONSOLE VIEW (VERCEL STYLE) */}
        {!isLoading && logs.length > 0 && viewMode === "terminal" && (
          <div className="bg-slate-950 font-mono text-xs overflow-hidden">
            {/* Terminal Header Bar */}
            <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <span className="text-slate-400 text-[11px] font-semibold ml-2">
                  siraya-runtime ~ /var/log/telemetry.stream
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isLiveStreaming ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE STREAM (3s)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold">
                    STREAM DIJEDA
                  </span>
                )}
                <span className="text-slate-500 text-[11px]">{totalLogs} log</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-3 sm:p-4 max-h-[600px] overflow-y-auto space-y-1.5 divide-y divide-slate-900/60 font-mono">
              {logs.map((log, idx) => {
                const isNew = newLogIds.has(log.id)
                const isVercel = log.environment === "VERCEL"
                const isPost = log.method === "POST"
                const is500 = (log.statusCode || 500) >= 500
                const ua = log.parsedUa

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogIndex(idx)}
                    className={`pt-2.5 pb-2 px-3 rounded-lg hover:bg-slate-900 transition-all cursor-pointer group flex flex-col gap-1.5 ${
                      isNew ? "bg-emerald-950/40 ring-1 ring-emerald-500/50 animate-pulse" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                      {/* Timestamp, Host, Method, Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500">
                          {format(new Date(log.lastSeenAt), "HH:mm:ss.SSS")}
                        </span>
                        {isVercel ? (
                          <span className="px-1.5 py-0.2 rounded bg-black border border-slate-700 text-white font-bold text-[10px]">
                            ▲ {log.runtimeHost || "vercel"}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold text-[10px]">
                            {log.runtimeHost || "vps"}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                          isPost ? "bg-blue-950 text-blue-300 border border-blue-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}>
                          {log.method || "GET"}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                          is500 ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}>
                          {log.statusCode || 500}
                        </span>
                        <span className="text-slate-200 font-semibold truncate max-w-xs sm:max-w-md">
                          {log.path || log.url || "/"}
                        </span>
                      </div>

                      {/* User & Client Device */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 ml-auto">
                        <span className="text-amber-300/90 font-medium">
                          {log.penggunaName ? `${log.penggunaName} (${log.penggunaRole || "USER"})` : "Tamu Publik"}
                        </span>
                        <span>•</span>
                        <span className="text-purple-300/90">
                          {ua?.summary || "Browser Lain"}
                        </span>
                        {log.occurrenceCount > 1 && (
                          <span className="px-1.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                            {log.occurrenceCount}x
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Error Message & Stack Preview */}
                    <div className="flex items-center gap-2 pl-2 border-l-2 border-rose-500/40 text-rose-300 text-xs">
                      <span className="font-bold text-rose-400 shrink-0">{log.name}:</span>
                      <span className="truncate">{log.message}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VIEW B: DESKTOP TABLE VIEW (>=md) */}
        {!isLoading && logs.length > 0 && viewMode === "table" && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Waktu Terakhir</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Host</th>
                  <th className="py-3 px-4 font-bold">Request Endpoint</th>
                  <th className="py-3 px-4 font-bold">Pesan Error</th>
                  <th className="py-3 px-4 font-bold">Pengguna & Perangkat</th>
                  <th className="py-3 px-4 font-bold text-center">Frekuensi</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.map((log, idx) => {
                  const statusInfo = STATUS_COLORS[log.status] || STATUS_COLORS.UNRESOLVED
                  const sevInfo = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.ERROR
                  const isVercel = log.environment === "VERCEL"
                  const isNew = newLogIds.has(log.id)
                  const ua = log.parsedUa

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLogIndex(idx)}
                      className={`hover:bg-slate-50/70 transition-all cursor-pointer group ${
                        isNew ? "bg-emerald-50/80 ring-1 ring-emerald-400" : ""
                      }`}
                    >
                      {/* Waktu */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-main">
                          {format(new Date(log.lastSeenAt), "HH:mm:ss", { locale: idLocale })} WIB
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {formatDistanceToNow(new Date(log.lastSeenAt), { addSuffix: true, locale: idLocale })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Host & Environment */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          {isVercel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold">
                              ▲ Vercel
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                              <Server size={10} /> VPS
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted truncate max-w-[90px]">
                            {log.runtimeHost || "default"}
                          </span>
                        </div>
                      </td>

                      {/* Request Endpoint & Status */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                            log.method === "POST" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {log.method || "GET"}
                          </span>
                          <span className="font-bold text-slate-800 truncate max-w-[150px]">
                            {log.path || log.url || "/"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
                          <span className={`font-bold ${
                            (log.statusCode || 500) >= 500 ? "text-rose-600" : "text-amber-600"
                          }`}>
                            Status {log.statusCode || 500}
                          </span>
                          {log.digest && (
                            <span className="text-[9px] px-1 bg-slate-100 rounded text-slate-600 font-mono">
                              #{log.digest.slice(0, 8)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pesan Error */}
                      <td className="py-3 px-4 max-w-xs xl:max-w-sm">
                        <div className="font-bold text-text-main truncate" title={log.message}>
                          {log.name ? `${log.name}: ` : ""}{log.message}
                        </div>
                      </td>

                      {/* Pengguna & Perangkat Browser */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-main truncate max-w-[160px] flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(log.penggunaName || "P")[0].toUpperCase()}
                          </span>
                          <span className="truncate">{log.penggunaName || "Publik / Tamu"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-medium text-text-muted">
                            {log.penggunaRole ? `${log.penggunaRole}` : (log.ipAddress || "Tamu")}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                            <Globe size={11} className="text-slate-400" />
                            {ua?.summary || "Browser Lain"}
                          </span>
                        </div>
                      </td>

                      {/* Frekuensi / Occurrence */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          log.occurrenceCount > 1
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {log.occurrenceCount}x
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLogIndex(idx)
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-bg hover:bg-slate-100 text-text-main border border-border min-h-[38px] min-w-[38px] cursor-pointer"
                          title="Buka Inspektur Error"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW C: MOBILE CARD STREAM (<md) (Antislop-Layoutmobile Compliant) */}
        {!isLoading && logs.length > 0 && viewMode === "table" && (
          <div className="md:hidden divide-y divide-border">
            {logs.map((log, idx) => {
              const statusInfo = STATUS_COLORS[log.status] || STATUS_COLORS.UNRESOLVED
              const sevInfo = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.ERROR
              const isVercel = log.environment === "VERCEL"
              const isNew = newLogIds.has(log.id)
              const ua = log.parsedUa

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogIndex(idx)}
                  className={`p-4 flex flex-col gap-2.5 active:bg-slate-50 transition-all cursor-pointer ${
                    isNew ? "bg-emerald-50/80 ring-1 ring-emerald-400" : ""
                  }`}
                >
                  {/* Top Bar: Status, Method, Host, Time */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        {statusInfo.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.method === "POST" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {log.method || "GET"}
                      </span>
                      {isVercel ? (
                        <span className="px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-bold">
                          ▲ Vercel
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                          VPS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">
                        {formatDistanceToNow(new Date(log.lastSeenAt), { addSuffix: true, locale: idLocale })}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        log.occurrenceCount > 1 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {log.occurrenceCount}x
                      </span>
                    </div>
                  </div>

                  {/* Error Message & Path */}
                  <div>
                    <h4 className="text-xs font-bold text-text-main line-clamp-2 break-words">
                      {log.name ? `${log.name}: ` : ""}{log.message}
                    </h4>
                    <p className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                      {log.path || log.url || "/"}
                    </p>
                  </div>

                  {/* User & Device */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-[10px] text-text-muted">
                    <span className="font-semibold text-text-main truncate max-w-[140px]">
                      {log.penggunaName || "Publik / Tamu"} ({log.penggunaRole || "PUBLIC"})
                    </span>
                    <span className="truncate text-slate-600 font-medium">
                      {ua?.summary || "Browser Lain"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalLogs > 0 && (
          <div className="p-4 bg-bg/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-text-muted">
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, totalLogs)} - {Math.min(currentPage * pageSize, totalLogs)} dari {totalLogs} insiden
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center min-h-[44px] sm:min-h-[36px] px-3 rounded-lg border border-border bg-surface hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold cursor-pointer"
              >
                <ChevronLeft size={14} className="mr-1" />
                Sebelumnya
              </button>
              <span className="px-3 py-1 font-bold text-text-main">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center min-h-[44px] sm:min-h-[36px] px-3 rounded-lg border border-border bg-surface hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold cursor-pointer"
              >
                Berikutnya
                <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. SIDE DRAWER INSPECTOR 360° (Siraya Standard) */}
      {/* ======================================================== */}
      {selectedLogIndex !== null && activeLog && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl bg-surface h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-250 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-bg/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-text-main truncate">
                    {activeLog.name || "Error Telemetri"}
                  </h3>
                  <p className="text-[10px] text-text-muted font-mono truncate">
                    ID: {activeLog.id}
                  </p>
                </div>
              </div>

              {/* Controls: Prev/Next and Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setSelectedLogIndex((idx) => (idx! > 0 ? idx! - 1 : idx))}
                  disabled={selectedLogIndex === 0}
                  className="p-2 rounded-lg border border-border bg-surface hover:bg-slate-50 disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Insiden Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setSelectedLogIndex((idx) => (idx! < logs.length - 1 ? idx! + 1 : idx))}
                  disabled={selectedLogIndex >= logs.length - 1}
                  className="p-2 rounded-lg border border-border bg-surface hover:bg-slate-50 disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  title="Insiden Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setSelectedLogIndex(null)}
                  className="p-2 rounded-lg border border-border bg-surface hover:bg-slate-50 text-text-muted hover:text-text-main min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ml-1"
                  title="Tutup Panel"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 text-xs pb-24 sm:pb-8">
              {/* Quick Status Bar */}
              <div className="bg-bg rounded-xl border border-border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-bold text-text-main text-xs flex items-center gap-1.5">
                  <Activity size={14} className="text-primary" />
                  Status Investigasi:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["UNRESOLVED", "INVESTIGATING", "RESOLVED", "IGNORED"] as const).map((st) => {
                    const info = STATUS_COLORS[st]
                    const isActive = activeLog.status === st
                    return (
                      <button
                        key={st}
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[40px] sm:min-h-[34px] cursor-pointer border ${
                          isActive
                            ? `${info.bg} ${info.text} ${info.border} ring-2 ring-primary/20 shadow-xs`
                            : "bg-surface text-text-muted hover:bg-slate-50 border-border"
                        }`}
                      >
                        {info.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Detail 1: Pesan Error Utama */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1.5">
                  Pesan Error Lengkap
                </span>
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/80 font-mono text-xs text-rose-900 break-words leading-relaxed select-all">
                  {activeLog.message}
                </div>
                {activeLog.digest && (
                  <div className="mt-2 text-[11px] text-text-muted font-mono flex items-center gap-1.5">
                    <Hash size={12} />
                    <span>Next.js Error Digest:</span>
                    <span className="font-bold text-text-main bg-slate-100 px-2 py-0.5 rounded select-all">
                      {activeLog.digest}
                    </span>
                  </div>
                )}
              </div>

              {/* Detail 2: Konteks Pengguna & Tenant */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-3">
                  Konteks Identitas Pengguna & Sesi
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">Nama & Role:</span>
                    <span className="font-bold text-text-main text-xs block truncate mt-0.5">
                      {activeLog.penggunaName || "Anonim / Tamu"} ({activeLog.penggunaRole || "PUBLIC"})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">Email:</span>
                    <span className="font-bold text-text-main text-xs block truncate mt-0.5">
                      {activeLog.penggunaEmail || "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">Unit Sekolah:</span>
                    <span className="font-bold text-text-main text-xs block truncate mt-0.5">
                      {activeLog.unitSekolahName || "Akses Global / Yayasan"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">IP Address:</span>
                    <span className="font-bold text-text-main text-xs block truncate mt-0.5">
                      {activeLog.ipAddress || "-"}
                    </span>
                  </div>
                </div>
                {/* Rincian Klien, Browser & Perangkat */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                    Browser & Sistem Operasi Pengguna:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                      <Globe size={13} className="text-primary" />
                      {activeLog.parsedUa?.browser || "Browser Lain"} {activeLog.parsedUa?.browserVersion || ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                      <Monitor size={13} className="text-slate-500" />
                      {activeLog.parsedUa?.os || "OS"} {activeLog.parsedUa?.osVersion || ""}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 shadow-2xs">
                      <Cpu size={13} />
                      {activeLog.parsedUa?.deviceType || "DESKTOP"}
                    </span>
                  </div>
                  {activeLog.userAgent && (
                    <div className="mt-1 pt-1.5 border-t border-slate-200/80 flex items-start justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-mono break-all leading-tight select-all">
                        {activeLog.userAgent}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyStackTrace(activeLog.userAgent)}
                        className="shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 cursor-pointer"
                        title="Salin User-Agent"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail 3: Konteks Permintaan / HTTP Request */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-3">
                  Konteks Permintaan & Infrastruktur
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">HTTP Method & Status:</span>
                    <span className="font-bold text-text-main text-xs block mt-0.5">
                      {activeLog.method || "POST"} (Status {activeLog.statusCode || 500})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">Lingkungan Eksekusi:</span>
                    <span className="font-bold text-text-main text-xs block mt-0.5">
                      {activeLog.environment} ({activeLog.runtimeHost || "default"})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg border border-border">
                    <span className="text-[10px] text-text-muted block">Asal Sumber:</span>
                    <span className="font-bold text-text-main text-xs block mt-0.5">
                      {activeLog.source}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-2.5 rounded-lg bg-bg border border-border">
                  <span className="text-[10px] text-text-muted block mb-0.5">URL / Route Path:</span>
                  <span className="font-mono text-xs font-semibold text-slate-800 break-all select-all">
                    {activeLog.url || activeLog.path || "-"}
                  </span>
                </div>
              </div>

              {/* Detail 4: Stack Trace Explorer */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                    <FileCode size={13} />
                    Stack Trace Lengkap
                  </span>
                  {activeLog.stack && (
                    <button
                      onClick={() => handleCopyStackTrace(activeLog.stack)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg hover:bg-slate-100 text-text-main border border-border text-[11px] font-semibold min-h-[36px] cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Salin Trace</span>
                    </button>
                  )}
                </div>
                {activeLog.stack ? (
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed select-all">
                    {activeLog.stack}
                  </pre>
                ) : (
                  <div className="p-4 text-center bg-bg rounded-xl border border-border text-text-muted">
                    Tidak ada stack trace untuk insiden ini.
                  </div>
                )}
              </div>

              {/* Detail 5: Sanitized Metadata */}
              {activeLog.metadata && (
                <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                      <Terminal size={13} />
                      Metadata & Parameter Payload (Sanitized)
                    </span>
                    <button
                      onClick={() => handleCopyStackTrace(activeLog.metadata)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg hover:bg-slate-100 text-text-main border border-border text-[11px] font-semibold min-h-[36px] cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Salin JSON</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-52 leading-relaxed select-all">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(activeLog.metadata), null, 2)
                      } catch {
                        return activeLog.metadata
                      }
                    })()}
                  </pre>
                </div>
              )}

              {/* Detail 6: Catatan Resolusi Superadmin */}
              <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-2">
                  Catatan Resolusi & Tindak Lanjut
                </span>
                <textarea
                  rows={3}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="Tuliskan catatan teknis atau solusi perbaikan..."
                  className="w-full p-3 bg-bg border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary/50 outline-none leading-relaxed"
                />
                <div className="mt-2.5 flex justify-end">
                  <button
                    disabled={isUpdatingStatus}
                    onClick={handleSaveResolutionNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold min-h-[44px] cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Simpan Catatan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* 6. MODAL KONFIRMASI BERSIHKAN LOG LAMA */}
      {/* ======================================================== */}
      {showPurgeModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-xl">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mb-3">
              <Trash2 size={20} />
            </div>
            <h3 className="text-base font-bold text-text-main">
              Bersihkan Log Error Usang
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Hanya log dengan status <strong className="text-emerald-700">RESOLVED (Terselesaikan)</strong> yang berusia lebih dari batas hari yang dipilih yang akan dihapus permanen.
            </p>

            <div className="my-4">
              <label className="text-xs font-semibold text-text-main block mb-1.5">
                Pilih Umur Log:
              </label>
              <select
                value={purgeDays}
                onChange={(e) => setPurgeDays(Number(e.target.value))}
                className="w-full p-2.5 bg-bg border border-border rounded-xl text-xs font-medium outline-none min-h-[44px]"
              >
                <option value={7}>Lebih lama dari 7 hari</option>
                <option value={14}>Lebih lama dari 14 hari</option>
                <option value={30}>Lebih lama dari 30 hari (Standar)</option>
                <option value={60}>Lebih lama dari 60 hari</option>
                <option value={90}>Lebih lama dari 90 hari</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl border border-border bg-bg hover:bg-slate-100 text-xs font-semibold text-text-main min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handleConfirmPurge}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px] cursor-pointer"
              >
                {isPurging ? "Membersihkan..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
