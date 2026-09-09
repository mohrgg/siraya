'use client'

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { 
  ShieldCheck, ShieldAlert, Server, Clock, RefreshCw, Search, Filter, 
  X, ChevronLeft, ChevronRight, Copy, Calendar, User, Tag, FileText, 
  Layers, ArrowUpRight, Activity, CheckCircle2, AlertTriangle, Trash2, 
  Edit3, PlusCircle, Database, Users, CreditCard, Receipt, GraduationCap, 
  Briefcase, KeyRound, Settings, ArrowRight, Check, Eye
} from "lucide-react"
import toast from "react-hot-toast"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ToolbarExportExcel, ToolbarExportPDF } from "@/components/ui/DataTableToolbar"
import { 
  getPaginatedAuditLogs, 
  getAllAuditLogsForExport, 
  getAuditCockpitSummary 
} from "@/actions/audit-log"
import { AUDIT_DOMAINS, AuditCockpitSummary } from "@/lib/constants/audit"

interface OperasionalDashboardProps {
  cockpitSummary?: AuditCockpitSummary
  trendData?: Array<{ date: string; total: number }>
  modulData?: Array<{ name: string; value: number }>
  roleData?: Array<{ name: string; value: number }>
  heatmapData?: Array<{ day: number; dayName: string; hour: number; value: number }>
  leaderboard?: Array<{ id: string; name: string; role: string; count: number }>
  recentLogs?: Array<{ 
    id: string; 
    aksi: string; 
    modul: string; 
    keterangan: string; 
    createdAt: string; 
    penggunaName: string;
    penggunaRole?: string;
  }>
  dauCount?: number
  monthlyLogsCount?: number
  totalMasterRecords?: number
  avgDailyLogs?: number
  pengaturan?: any
  userName?: string
}

// Map domain ID ke ikon Lucide
const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  keuangan: <CreditCard size={18} className="text-emerald-700" />,
  tagihan: <Receipt size={18} className="text-sky-700" />,
  murid: <GraduationCap size={18} className="text-indigo-700" />,
  kepegawaian: <Briefcase size={18} className="text-amber-700" />,
  user: <KeyRound size={18} className="text-rose-700" />,
  sistem: <Settings size={18} className="text-slate-700" />,
}

const DOMAIN_BG: Record<string, string> = {
  keuangan: "bg-emerald-50 border-emerald-200 text-emerald-800",
  tagihan: "bg-sky-50 border-sky-200 text-sky-800",
  murid: "bg-indigo-50 border-indigo-200 text-indigo-800",
  kepegawaian: "bg-amber-50 border-amber-200 text-amber-800",
  user: "bg-rose-50 border-rose-200 text-rose-800",
  sistem: "bg-slate-100 border-slate-200 text-slate-800",
}

export default function OperasionalDashboard(props: OperasionalDashboardProps) {
  const {
    cockpitSummary: initialCockpit,
    recentLogs = [],
    totalMasterRecords = 0,
    pengaturan,
    userName = "Superadmin"
  } = props

  // State Cockpit Data
  const [cockpit, setCockpit] = useState<AuditCockpitSummary | null>(initialCockpit || null)
  
  // Interactive Filters
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL")
  const [severity, setSeverity] = useState<string>("MUTATIONS") // Default: Hanya Mutasi Data (Exclude routine LOGIN)
  const [datePreset, setDatePreset] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  // Server-side Pagination & Stream
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [serverLogs, setServerLogs] = useState<any[]>(recentLogs)
  const [totalLogs, setTotalLogs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  
  // Side Drawer Inspector
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null)

  // Real-time Live Clock (Ticks every 1 second)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedLiveTime = currentTime 
    ? format(currentTime, "HH:mm:ss")
    : "--:--:--"

  const formattedLiveDate = currentTime
    ? format(currentTime, "EEEE, dd MMM yyyy", { locale: idLocale })
    : ""

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)

  // Fetch Cockpit Summary (jika initial kosong atau di-refresh)
  const refreshCockpitData = useCallback(async () => {
    try {
      const summary = await getAuditCockpitSummary()
      setCockpit(summary)
    } catch (err) {
      console.error("Failed to load audit cockpit summary:", err)
    }
  }, [])

  useEffect(() => {
    if (!initialCockpit) {
      refreshCockpitData()
    }
  }, [initialCockpit, refreshCockpitData])

  // Helper date preset
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset)
    setCurrentPage(1)
    const today = new Date()
    const formatDateStr = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    if (preset === "TODAY") {
      const s = formatDateStr(today)
      setStartDate(s)
      setEndDate(s)
    } else if (preset === "7DAYS") {
      const past = new Date()
      past.setDate(past.getDate() - 6)
      setStartDate(formatDateStr(past))
      setEndDate(formatDateStr(today))
    } else if (preset === "30DAYS") {
      const past = new Date()
      past.setDate(past.getDate() - 29)
      setStartDate(formatDateStr(past))
      setEndDate(formatDateStr(today))
    } else if (preset === "ALL") {
      setStartDate("")
      setEndDate("")
    }
  }

  // Fetch Paginated Logs dengan debounce
  useEffect(() => {
    let isMounted = true
    const fetchLogs = async () => {
      setIsLoadingLogs(true)
      try {
        const result = await getPaginatedAuditLogs({
          page: currentPage,
          limit: pageSize,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: searchTerm || undefined,
          severity: severity || undefined,
          domainId: selectedDomain !== "ALL" ? selectedDomain : undefined
        })
        if (isMounted) {
          setServerLogs(result.data)
          setTotalLogs(result.total)
          setTotalPages(result.totalPages)
        }
      } catch (err) {
        console.error("Failed to fetch audit logs:", err)
      } finally {
        if (isMounted) setIsLoadingLogs(false)
      }
    }

    const timer = setTimeout(() => fetchLogs(), 300)
    return () => { isMounted = false; clearTimeout(timer) }
  }, [currentPage, pageSize, startDate, endDate, searchTerm, severity, selectedDomain])

  // Handler Refresh Total
  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast.loading("Memperbarui data audit dan telemetri...", { id: "refresh-audit" })
    try {
      await refreshCockpitData()
      const result = await getPaginatedAuditLogs({
        page: 1,
        limit: pageSize,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
        severity: severity || undefined,
        domainId: selectedDomain !== "ALL" ? selectedDomain : undefined
      })
      setServerLogs(result.data)
      setTotalLogs(result.total)
      setTotalPages(result.totalPages)
      setCurrentPage(1)
      toast.success("Cockpit audit berhasil disegarkan!", { id: "refresh-audit" })
    } catch (e) {
      toast.error("Gagal menyegarkan data", { id: "refresh-audit" })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Helper Badge Aksi
  const getActionBadge = (aksi: string) => {
    const lower = aksi.toLowerCase()
    if (lower.includes('create') || lower.includes('tambah') || lower.includes('buat')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
    if (lower.includes('update') || lower.includes('ubah') || lower.includes('edit') || lower.includes('ganti')) {
      return 'bg-blue-50 text-blue-800 border-blue-200'
    }
    if (lower.includes('delete') || lower.includes('hapus') || lower.includes('nonaktif')) {
      return 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
    }
    if (lower.includes('login') || lower.includes('logout')) {
      return 'bg-slate-100 text-slate-700 border-slate-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  // Ekspor Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    toast.loading("Menyiapkan berkas Excel...", { id: "export-excel" })
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const allLogs = await getAllAuditLogsForExport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
        severity: severity || undefined,
        domainId: selectedDomain !== "ALL" ? selectedDomain : undefined
      })

      const exportData = allLogs.map((log, index) => ({
        "No": index + 1,
        "Waktu (WIB)": format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
        "Aktor / Pengguna": log.penggunaName,
        "Peran Pengguna": log.penggunaRole || "-",
        "Modul": log.modul,
        "Tindakan": log.aksi,
        "Keterangan Mutasi": log.keterangan
      }))

      exportToExcel(exportData, `AuditTrail_${format(new Date(), "yyyyMMdd_HHmm")}`, {
        title: "Laporan Jejak Audit Operasional Sistem",
        unitInfo: pengaturan || { name: "Yayasan Siraya" }
      })
      toast.success("Audit Trail berhasil diekspor ke Excel!", { id: "export-excel" })
    } catch (error) {
      console.error("Export Excel error:", error)
      toast.error("Gagal mengekspor Excel", { id: "export-excel" })
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Ekspor PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    toast.loading("Menyiapkan dokumen PDF...", { id: "export-pdf" })
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo, getSignatoryKiri } = await import("@/lib/pdf-helpers")

      const allLogs = await getAllAuditLogsForExport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
        severity: severity || undefined,
        domainId: selectedDomain !== "ALL" ? selectedDomain : undefined
      })

      const headers = ["No", "Waktu (WIB)", "Pengguna", "Modul & Aksi", "Rincian Mutasi"]
      const rows = allLogs.map((item, index) => [
        index + 1,
        format(new Date(item.createdAt), "dd/MM/yyyy HH:mm:ss"),
        `${item.penggunaName} (${item.penggunaRole || 'USER'})`,
        `${item.modul} - ${item.aksi}`,
        item.keterangan
      ])

      const subtitleInfo = [
        selectedDomain !== "ALL" ? `Domain: ${selectedDomain.toUpperCase()}` : "Semua Domain",
        severity !== "ALL" ? `Filter: ${severity}` : "Semua Aksi",
        `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`
      ].join(" • ")

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, undefined),
        title: "Laporan Jejak Audit Sistem (Audit Trail)",
        subtitle: `${subtitleInfo} • Dicetak: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        headers,
        data: rows,
        filename: `AuditTrail_${format(new Date(), "yyyyMMdd_HHmm")}`,
        config: { orientation: 'landscape' },
        penandatanganKiri: getSignatoryKiri(pengaturan, undefined),
        penandatanganKanan: { jabatan: "Administrator Sistem,", nama: userName || "Administrator" }
      })

      toast.success("Audit Trail berhasil diekspor ke PDF!", { id: "export-pdf" })
    } catch (error) {
      console.error("Export PDF error:", error)
      toast.error("Gagal mengekspor PDF", { id: "export-pdf" })
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} berhasil disalin!`)
  }

  const kpi = cockpit?.kpi || {
    totalAll: 0,
    totalMutasi: 0,
    totalDelete: 0,
    totalUpdate: 0,
    totalCreate: 0,
    totalLogin: 0,
    totalActors: 0
  }

  const domainCards = cockpit?.domainCards || []

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-20 min-w-0 w-full animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. HEADER COCKPIT & SYSTEM STATUS BANNER */}
      {/* ======================================================== */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck size={14} className="text-emerald-700" />
              Live Audit Trail Cockpit
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Server size={13} className="text-slate-500" />
              PostgreSQL Immutable Logs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Pemantauan Jejak Audit Sistem
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Cockpit pengawasan aktivitas operasional per modul, deteksi perubahan data kritis, dan verifikasi kepatuhan pengguna.
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-surface hover:bg-slate-50 active:bg-slate-100 text-text-main rounded-xl border border-border transition-colors shadow-2xs text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer"
            title="Segarkan Data Audit"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin text-primary" : "text-text-muted"} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP SECURITY & MUTATION KPI STRIP */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm sm:text-base font-extrabold text-text-main tracking-tight flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            Ringkasan Keamanan & Mutasi Data
          </h2>
          <span className="text-xs text-text-muted font-medium">
            Total Riwayat: {formatNumber(kpi.totalAll)} entri log
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* KPI 1: Mutasi Data Operasional (Non-Login) */}
          <div className="bg-[#0f172a] text-white rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Mutasi Riil Data
              </span>
              <div className="w-7 h-7 bg-slate-800 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                <Database size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {formatNumber(kpi.totalMutasi)}
                </span>
                <span className="text-xs text-slate-400">Aksi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Di luar log sesi login</p>
            </div>
          </div>

          {/* KPI 2: Aksi Kritis / Penghapusan */}
          <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between ${
            kpi.totalDelete > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-surface border-border'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                kpi.totalDelete > 0 ? 'text-rose-900' : 'text-text-muted'
              }`}>
                Aksi Kritis (Hapus)
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                kpi.totalDelete > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <Trash2 size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${
                  kpi.totalDelete > 0 ? 'text-rose-700' : 'text-text-main'
                }`}>
                  {formatNumber(kpi.totalDelete)}
                </span>
                <span className="text-xs text-rose-600 font-semibold">Tindakan</span>
              </div>
              <p className="text-[11px] text-rose-700 font-medium mt-0.5">Penghapusan / Nonaktif</p>
            </div>
          </div>

          {/* KPI 3: Perubahan / Update */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Perubahan Data
              </span>
              <div className="w-7 h-7 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center shrink-0">
                <Edit3 size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                  {formatNumber(kpi.totalUpdate)}
                </span>
                <span className="text-xs text-blue-700 font-semibold">Aksi</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Edit & pembaruan entri</p>
            </div>
          </div>

          {/* KPI 4: Penambahan / Create */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Penambahan Baru
              </span>
              <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                <PlusCircle size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                  {formatNumber(kpi.totalCreate)}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">Entri</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Pembuatan entri baru</p>
            </div>
          </div>

          {/* KPI 5: Pelaksana Unik (Aktor) */}
          <div className="col-span-2 sm:col-span-1 bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Aktor Pelaksana
              </span>
              <div className="w-7 h-7 bg-violet-50 text-violet-700 rounded-lg flex items-center justify-center shrink-0">
                <Users size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                  {formatNumber(kpi.totalActors)}
                </span>
                <span className="text-xs text-violet-700 font-semibold">Akun</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Staf yang beraktivitas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE DOMAIN MODULE AUDIT COCKPIT (CARDS) */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-text-main tracking-tight flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              Aktivitas & Beban Modul
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Pilih kartu modul untuk menyaring log audit berdasarkan domain operasional.
            </p>
          </div>

          {selectedDomain !== "ALL" && (
            <button
              onClick={() => setSelectedDomain("ALL")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all self-start sm:self-auto cursor-pointer min-h-[38px]"
            >
              <X size={13} />
              <span>Reset Saring Modul ({AUDIT_DOMAINS.find(d => d.id === selectedDomain)?.name})</span>
            </button>
          )}
        </div>

        {/* 6 Simplified Module Cards (2 rows of 3 on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {domainCards.map((dom) => {
            const isSelected = selectedDomain === dom.id
            const percent = kpi.totalAll > 0 ? Math.round((dom.total / kpi.totalAll) * 100) : 0

            return (
              <div
                key={dom.id}
                onClick={() => {
                  setSelectedDomain(isSelected ? "ALL" : dom.id)
                  setCurrentPage(1)
                }}
                className={`group rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 min-h-[44px] ${
                  isSelected
                    ? "bg-primary/[0.03] border-primary ring-2 ring-primary/40 shadow-sm"
                    : "bg-surface hover:bg-slate-50/70 border-border hover:border-slate-300 shadow-xs"
                }`}
              >
                {/* 1. Domain Modul */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      DOMAIN_BG[dom.id] || "bg-slate-100 border-slate-200 text-slate-700"
                    }`}>
                      {DOMAIN_ICONS[dom.id] || <Activity size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm sm:text-base text-text-main group-hover:text-primary transition-colors tracking-tight truncate">
                        {dom.name}
                      </h3>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-primary">
                          <Check size={11} strokeWidth={3} />
                          Filter Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="font-bold text-xs font-mono px-2.5 py-1 rounded-lg bg-bg border border-border text-text-main shrink-0">
                    {formatNumber(dom.total)} aksi
                  </span>
                </div>

                {/* 2. Volume & Proporsi */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-text-muted">Volume & Proporsi</span>
                    <span className="font-extrabold text-text-main font-mono">{percent}% beban</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percent, 2)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Komposisi Tindakan */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Komposisi Tindakan
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Tambah */}
                    <div 
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold"
                      title="Penambahan data baru"
                    >
                      <PlusCircle size={12} className="text-emerald-600 shrink-0" />
                      <span>+{dom.breakdown.creates}</span>
                      <span className="text-[10px] font-normal text-emerald-700 hidden xs:inline">Tambah</span>
                    </div>

                    {/* Ubah */}
                    <div 
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 text-xs font-bold"
                      title="Perubahan / edit data"
                    >
                      <Edit3 size={12} className="text-blue-600 shrink-0" />
                      <span>{dom.breakdown.updates}</span>
                      <span className="text-[10px] font-normal text-blue-700 hidden xs:inline">Ubah</span>
                    </div>

                    {/* Hapus */}
                    <div 
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold border ${
                        dom.breakdown.deletes > 0 
                          ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                      title="Penghapusan data"
                    >
                      <Trash2 size={12} className={dom.breakdown.deletes > 0 ? "text-rose-600 shrink-0" : "text-slate-400 shrink-0"} />
                      <span>{dom.breakdown.deletes}</span>
                      <span className={`text-[10px] font-normal ${dom.breakdown.deletes > 0 ? "text-rose-700" : "text-slate-500"} hidden xs:inline`}>Hapus</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. AUDIT STREAM TOOLBAR & SMART FILTER CONTROLS */}
      {/* ======================================================== */}
      <section className="flex flex-col gap-3">
        <div className="bg-surface rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          
          {/* Toolbar Header: Title, Count, & Export Buttons */}
          <div className="p-4 sm:p-5 border-b border-border bg-bg/40 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="text-sm sm:text-base font-extrabold text-text-main">
                  Daftar Histori Jejak Audit
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {formatNumber(totalLogs)} rekaman cocok
                </span>
                {selectedDomain !== "ALL" && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Modul: {AUDIT_DOMAINS.find(d => d.id === selectedDomain)?.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ToolbarExportExcel 
                  onClick={handleExportExcel} 
                  disabled={serverLogs.length === 0} 
                  isExporting={isExportingExcel} 
                />
                <ToolbarExportPDF 
                  onClick={handleExportPDF} 
                  disabled={serverLogs.length === 0} 
                  isExporting={isExportingPDF} 
                />
              </div>
            </div>

            {/* Smart Severity / Action Type Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => { setSeverity("MUTATIONS"); setCurrentPage(1); }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  severity === "MUTATIONS"
                    ? "bg-[#0f172a] text-white shadow-xs"
                    : "bg-surface text-text-muted hover:text-text-main border border-border"
                }`}
              >
                Hanya Mutasi Data ({formatNumber(kpi.totalMutasi)})
              </button>

              <button
                onClick={() => { setSeverity("DELETE"); setCurrentPage(1); }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  severity === "DELETE"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50/60 text-rose-800 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                <Trash2 size={13} />
                <span>Aksi Kritis / Hapus ({formatNumber(kpi.totalDelete)})</span>
              </button>

              <button
                onClick={() => { setSeverity("UPDATE"); setCurrentPage(1); }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  severity === "UPDATE"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50/60 text-blue-800 hover:bg-blue-100 border border-blue-200"
                }`}
              >
                <Edit3 size={13} />
                <span>Perubahan / Edit ({formatNumber(kpi.totalUpdate)})</span>
              </button>

              <button
                onClick={() => { setSeverity("CREATE"); setCurrentPage(1); }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  severity === "CREATE"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <PlusCircle size={13} />
                <span>Penambahan ({formatNumber(kpi.totalCreate)})</span>
              </button>

              <button
                onClick={() => { setSeverity("AUTH"); setCurrentPage(1); }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  severity === "AUTH"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <User size={13} />
                <span>Sesi & Login ({formatNumber(kpi.totalLogin)})</span>
              </button>

              <button
                onClick={() => { setSeverity("ALL"); setCurrentPage(1); }}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  severity === "ALL"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface text-text-muted hover:text-text-main border border-border"
                }`}
              >
                Semua Log ({formatNumber(kpi.totalAll)})
              </button>
            </div>

            {/* Filter Inputs Grid: Search, Presets & Custom Dates */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Search Bar */}
              <div className="md:col-span-5 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Cari nama staf, keterangan mutasi, modul, atau aksi..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-surface border border-border rounded-xl text-xs font-medium text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs"
                />
              </div>

              {/* Date Presets Pills */}
              <div className="md:col-span-3 flex items-center gap-1 bg-surface border border-border rounded-xl p-1 shadow-2xs min-h-[44px]">
                <button
                  onClick={() => applyDatePreset("ALL")}
                  className={`flex-1 min-h-[36px] py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    datePreset === "ALL" ? "bg-slate-900 text-white" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => applyDatePreset("TODAY")}
                  className={`flex-1 min-h-[36px] py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    datePreset === "TODAY" ? "bg-slate-900 text-white" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => applyDatePreset("7DAYS")}
                  className={`flex-1 min-h-[36px] py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    datePreset === "7DAYS" ? "bg-slate-900 text-white" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => applyDatePreset("30DAYS")}
                  className={`flex-1 min-h-[36px] py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    datePreset === "30DAYS" ? "bg-slate-900 text-white" : "text-text-muted hover:text-text-main"
                  }`}
                >
                  30 Hari
                </button>
              </div>

              {/* Custom Date Range Picker */}
              <div className="md:col-span-4 flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1 shadow-2xs min-h-[44px]">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => { 
                    setStartDate(e.target.value); 
                    setDatePreset("CUSTOM"); 
                    setCurrentPage(1); 
                  }}
                  className="bg-transparent text-xs text-text-main font-medium focus:outline-none w-full cursor-pointer py-1.5"
                  title="Tanggal Mulai"
                />
                <span className="text-xs text-text-muted font-bold">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => { 
                    setEndDate(e.target.value); 
                    setDatePreset("CUSTOM"); 
                    setCurrentPage(1); 
                  }}
                  className="bg-transparent text-xs text-text-main font-medium focus:outline-none w-full cursor-pointer py-1.5"
                  title="Tanggal Selesai"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { 
                      setStartDate(""); 
                      setEndDate(""); 
                      setDatePreset("ALL"); 
                      setCurrentPage(1); 
                    }}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors shrink-0 cursor-pointer"
                    title="Hapus Filter Tanggal"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW A: DESKTOP TABLE VIEW (>=md) */}
          {/* ======================================================== */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6 w-36">Waktu & Tanggal</th>
                  <th className="p-4 w-48">Pelaksana / Aktor</th>
                  <th className="p-4 w-44">Modul & Tindakan</th>
                  <th className="p-4 pr-4">Rincian Aktivitas Mutasi Data</th>
                  <th className="p-4 pr-6 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingLogs ? (
                  // Skeleton Loading Rows
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-4 pl-6"><div className="h-4 bg-slate-200 rounded w-24 mb-1"></div><div className="h-3 bg-slate-100 rounded w-16"></div></td>
                      <td className="p-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1"></div><div className="h-3 bg-slate-100 rounded w-16"></div></td>
                      <td className="p-4"><div className="h-5 bg-slate-200 rounded w-20 mb-1"></div><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                      <td className="p-4"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                      <td className="p-4 pr-6 text-center"><div className="h-8 w-8 bg-slate-200 rounded-lg mx-auto"></div></td>
                    </tr>
                  ))
                ) : serverLogs.length > 0 ? (
                  serverLogs.map((log, index) => {
                    const dateObj = new Date(log.createdAt)
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLogIndex(index)}
                        className="border-b border-border hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Waktu & Tanggal */}
                        <td className="p-4 pl-6 text-text-muted font-mono text-xs align-top">
                          <span className="font-bold text-text-main">
                            {format(dateObj, "dd/MM/yyyy")}
                          </span>
                          <br />
                          <span className="text-[11px] text-text-muted">
                            {format(dateObj, "HH:mm:ss")} WIB
                          </span>
                        </td>

                        {/* Pelaksana / Aktor */}
                        <td className="p-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                              {log.penggunaName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-text-main text-xs truncate">{log.penggunaName}</p>
                              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                {log.penggunaRole || "PENGGUNA"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Modul & Tindakan */}
                        <td className="p-4 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {log.modul}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide border uppercase ${getActionBadge(log.aksi)}`}>
                              {log.aksi}
                            </span>
                          </div>
                        </td>

                        {/* Rincian Keterangan */}
                        <td className="p-4 pr-4 align-top whitespace-normal">
                          <div className="text-text-main text-xs bg-bg p-2.5 rounded-xl border border-border group-hover:border-primary/40 transition-colors leading-relaxed line-clamp-2">
                            {log.keterangan}
                          </div>
                        </td>

                        {/* Tombol Detail */}
                        <td className="p-4 pr-6 align-top text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLogIndex(index)
                            }}
                            className="p-2 text-text-muted hover:text-primary hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Buka Detail Log"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <Search size={36} className="text-gray-300 mb-2" />
                        <p className="font-bold text-text-main text-sm">Tidak Ada Catatan Log</p>
                        <p className="text-xs mt-1">Tidak ditemukan riwayat mutasi yang sesuai dengan kriteria filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ======================================================== */}
          {/* VIEW B: MOBILE ADAPTIVE TOUCH CARDS (<md) */}
          {/* ======================================================== */}
          <div className="md:hidden divide-y divide-border">
            {isLoadingLogs ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-4 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-12 bg-slate-50 rounded"></div>
                </div>
              ))
            ) : serverLogs.length > 0 ? (
              serverLogs.map((log, index) => {
                const dateObj = new Date(log.createdAt)
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogIndex(index)}
                    className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer flex flex-col gap-2.5 min-h-[44px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-text-muted">
                        {format(dateObj, "dd/MM/yyyy • HH:mm")} WIB
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.modul}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadge(log.aksi)}`}>
                          {log.aksi}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {log.penggunaName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-text-main truncate">{log.penggunaName}</span>
                      <span className="text-[10px] text-text-muted uppercase font-semibold">({log.penggunaRole || 'USER'})</span>
                    </div>

                    <p className="text-xs text-text-main bg-bg p-2.5 rounded-xl border border-border leading-relaxed line-clamp-3">
                      {log.keterangan}
                    </p>

                    <div className="flex items-center justify-end text-xs font-bold text-primary gap-1 pt-1">
                      <span>Lihat Rincian</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-text-muted">
                <Search size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-main">Tidak Ada Catatan Log</p>
                <p className="text-xs mt-1">Ubah kata kunci pencarian atau reset filter.</p>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 5. TABLE FOOTER & PAGINATION (TOUCH-FRIENDLY) */}
          {/* ======================================================== */}
          <div className="p-4 bg-bg/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-text-muted">
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer min-h-[36px]"
              >
                {[10, 15, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size} baris</option>
                ))}
              </select>
              <span className="ml-1 text-slate-500">Total: {formatNumber(totalLogs)}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoadingLogs}
                className="min-h-[44px] px-4 py-2 border border-border bg-surface rounded-xl text-xs font-bold text-text-main disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-2 font-mono text-xs bg-surface border border-border rounded-xl text-text-main shadow-2xs font-bold">
                {currentPage} / {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoadingLogs}
                className="min-h-[44px] px-4 py-2 border border-border bg-surface rounded-xl text-xs font-bold text-text-main disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. SIDE DRAWER INSPECTOR (DETAIL JEJAK AUDIT 360°) */}
      {/* ======================================================== */}
      {selectedLogIndex !== null && serverLogs[selectedLogIndex] && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLogIndex(null)}
          />
          
          {/* Panel Lateral Slide-Over */}
          <div className="relative w-full sm:max-w-xl bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-border z-10">
            {/* Header Drawer with Linear Navigation */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/60 shrink-0">
              <div>
                <h3 className="font-extrabold text-text-main text-base sm:text-lg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  Detail Jejak Rekam Audit
                </h3>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  ID: {serverLogs[selectedLogIndex].id}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedLogIndex(Math.max(0, selectedLogIndex - 1))}
                  disabled={selectedLogIndex === 0}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                  title="Log Sebelumnya"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setSelectedLogIndex(Math.min(serverLogs.length - 1, selectedLogIndex + 1))}
                  disabled={selectedLogIndex === serverLogs.length - 1}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                  title="Log Berikutnya"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="w-px h-6 bg-border mx-1"></div>
                <button
                  onClick={() => setSelectedLogIndex(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Tutup Panel"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 pb-24">
              {/* Banner Status & Aksi */}
              <div className="p-4 bg-bg rounded-2xl border border-border flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-300">
                      Modul: {serverLogs[selectedLogIndex].modul}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wide border uppercase ${getActionBadge(serverLogs[selectedLogIndex].aksi)}`}>
                      {serverLogs[selectedLogIndex].aksi}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    VERIFIED IMMUTABLE
                  </span>
                </div>
              </div>

              {/* Timestamp WIB */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg rounded-2xl border border-border">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                    <Calendar size={12} /> Tanggal Mutasi
                  </h4>
                  <p className="text-xs font-bold text-text-main">
                    {format(new Date(serverLogs[selectedLogIndex].createdAt), "EEEE, dd MMMM yyyy", { locale: idLocale })}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                    <Clock size={12} /> Waktu Sistem
                  </h4>
                  <p className="text-xs font-bold text-text-main font-mono">
                    {format(new Date(serverLogs[selectedLogIndex].createdAt), "HH:mm:ss")} WIB
                  </p>
                </div>
              </div>

              {/* Pelaksana / Aktor */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                  <User size={13} /> Pelaksana / Aktor
                </h4>
                <div className="flex items-center gap-3 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                    {serverLogs[selectedLogIndex].penggunaName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">{serverLogs[selectedLogIndex].penggunaName}</p>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      {serverLogs[selectedLogIndex].penggunaRole || "STAF TEROTENTIKASI"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Keterangan Lengkap & Tombol Salin */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FileText size={13} /> Rincian Mutasi Lengkap
                  </h4>
                  <button 
                    onClick={() => handleCopy(serverLogs[selectedLogIndex].keterangan, "Rincian mutasi")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors p-1 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Salin Teks</span>
                  </button>
                </div>
                <div className="text-xs text-text-main leading-relaxed bg-bg p-4 rounded-2xl border border-border font-mono whitespace-pre-wrap select-all">
                  {serverLogs[selectedLogIndex].keterangan}
                </div>
              </div>

              {/* Security & Integrity Note */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Jejak audit ini dicatat secara otomatis oleh trigger server backend saat transaksi terjadi. Tidak ada pihak yang dapat mengedit atau memalsukan rekaman ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
