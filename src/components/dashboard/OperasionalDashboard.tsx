'use client'

import React, { useState, useMemo } from "react"
import { 
  Activity, ShieldCheck, Zap, Users, Database, FileText, 
  Search, Filter, TrendingUp, RefreshCw,
  LayoutDashboard, X, ChevronLeft, ChevronRight, Copy, Calendar, Clock, User, Tag,
  Server, Layers, ArrowUpRight, BarChart3
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis 
} from 'recharts'
import toast from "react-hot-toast"
import { format } from "date-fns"
import { ToolbarExportExcel, ToolbarExportPDF } from "@/components/ui/DataTableToolbar"
import { getPaginatedAuditLogs, getAllAuditLogsForExport } from "@/actions/audit-log"

interface OperasionalDashboardProps {
  trendData?: Array<{ date: string; total: number }>
  modulData?: Array<{ name: string; value: number }>
  roleData?: Array<{ name: string; value: number }>
  heatmapData?: Array<{ day: number; dayName: string; hour: number; value: number }>
  leaderboard?: Array<{ id: string; name: string; role: string; count: number }>
  recentLogs?: Array<{ id: string; aksi: string; modul: string; keterangan: string; createdAt: string; penggunaName: string }>
  dauCount?: number
  monthlyLogsCount?: number
  totalMasterRecords?: number
  avgDailyLogs?: number
  pengaturan?: any
  userName?: string
}

export default function OperasionalDashboard(props: OperasionalDashboardProps) {
  const {
    trendData = [],
    modulData = [],
    roleData = [],
    heatmapData = [],
    leaderboard = [],
    recentLogs = [],
    dauCount = 0,
    monthlyLogsCount = 0,
    totalMasterRecords = 0,
    avgDailyLogs = 0,
    pengaturan,
    userName = "Superadmin"
  } = props

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModul, setSelectedModul] = useState("ALL")
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null)

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  const [serverLogs, setServerLogs] = useState<any[]>(recentLogs)
  const [totalLogs, setTotalLogs] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)

  // Filter heatmap > 0
  const cleanHeatmap = useMemo(() => heatmapData.filter(d => d.value > 0), [heatmapData])

  const availableModules = useMemo(() => {
    const mods = new Set(recentLogs.map(l => l.modul))
    return Array.from(mods).sort()
  }, [recentLogs])

  // Total mutations for percentage calculation in module matrix
  const totalModulMutations = useMemo(() => {
    return modulData.reduce((acc, curr) => acc + curr.value, 0) || 1
  }, [modulData])

  React.useEffect(() => {
    let isMounted = true
    const fetchLogs = async () => {
      setIsLoadingLogs(true)
      try {
        const result = await getPaginatedAuditLogs({
          page: currentPage,
          limit: pageSize,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          modul: selectedModul,
          search: searchTerm
        })
        if (isMounted) {
          setServerLogs(result.data)
          setTotalLogs(result.total)
          setTotalPages(result.totalPages)
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err)
      } finally {
        if (isMounted) setIsLoadingLogs(false)
      }
    }
    
    const timeoutId = setTimeout(() => fetchLogs(), 400)
    return () => { isMounted = false; clearTimeout(timeoutId) }
  }, [currentPage, pageSize, startDate, endDate, selectedModul, searchTerm])

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    toast.loading("Menyiapkan file Excel...", { id: "export-excel" })
    try {
      const { exportToExcel } = await import("@/lib/excel")
      
      const allLogs = await getAllAuditLogsForExport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        modul: selectedModul,
        search: searchTerm
      })
      
      const exportData = allLogs.map((log, index) => ({
        "No": index + 1,
        "Waktu": format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
        "Pengguna": log.penggunaName,
        "Modul": log.modul,
        "Aksi": log.aksi,
        "Keterangan": log.keterangan
      }))
      
      exportToExcel(exportData, `AuditLog_${format(new Date(), "yyyyMMdd")}`, {
        title: "Laporan Jejak Audit (Audit Trail)",
        unitInfo: pengaturan || { name: "Yayasan Siraya" }
      })
      toast.success("Audit Log berhasil diekspor ke Excel!", { id: "export-excel" })
    } catch (error) {
      console.error("Export Excel error:", error)
      toast.error("Gagal mengekspor Excel", { id: "export-excel" })
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    toast.loading("Menyiapkan file PDF...", { id: "export-pdf" })
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo, getSignatoryKiri } = await import("@/lib/pdf-helpers")
      
      const allLogs = await getAllAuditLogsForExport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        modul: selectedModul,
        search: searchTerm
      })
      
      const tableColumn = ["No", "Waktu", "Pengguna", "Modul", "Aksi", "Keterangan"]
      const tableRows = allLogs.map((item, index) => [
        index + 1,
        format(new Date(item.createdAt), "dd/MM/yyyy HH:mm:ss"),
        item.penggunaName,
        item.modul,
        item.aksi,
        item.keterangan
      ])

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(pengaturan, undefined),
        title: "Laporan Jejak Audit Sistem",
        subtitle: `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'} • Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        headers: tableColumn,
        data: tableRows,
        filename: `AuditLog_${format(new Date(), "yyyyMMdd")}`.replace(/\s+/g, '_'),
        config: { orientation: 'landscape' },
        penandatanganKiri: getSignatoryKiri(pengaturan, undefined),
        penandatanganKanan: { jabatan: "Administrator Sistem,", nama: userName || "Administrator" }
      })

      toast.success("Audit Log berhasil diekspor ke PDF!", { id: "export-pdf" })
    } catch (error) {
      console.error("Export PDF error:", error)
      toast.error("Gagal mengekspor PDF", { id: "export-pdf" })
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    toast.loading("Memperbarui telemetri dan data log...", { id: "refresh-data" })
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Telemetri sistem berhasil disegarkan!", { id: "refresh-data" })
    }, 800)
  }

  const getActionBadge = (aksi: string) => {
    const lower = aksi.toLowerCase()
    if (lower.includes('create') || lower.includes('tambah') || lower.includes('buat')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    }
    if (lower.includes('update') || lower.includes('ubah') || lower.includes('edit')) {
      return 'bg-blue-50 text-blue-800 border-blue-200'
    }
    if (lower.includes('delete') || lower.includes('hapus')) {
      return 'bg-rose-50 text-rose-800 border-rose-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} berhasil disalin!`)
  }

  return (
    <div className="flex flex-col gap-8 pb-16 min-w-0 w-full animate-in fade-in duration-200">
      {/* SECTION 1: Executive System Telemetry Banner */}
      <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-[#065f32] border border-emerald-200">
              <ShieldCheck size={14} className="text-[#065f32]" />
              Pusat Kendali Sistem & Audit
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Server size={13} className="text-slate-500" />
              PostgreSQL Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Clock size={13} className="text-slate-500" />
              Zona: WIB (UTC+7)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Audit Operasional & Integritas Sistem
          </h1>
          <p className="text-sm text-text-muted mt-1.5 max-w-3xl leading-relaxed">
            Pengawasan telemetri performa basis data, analisis frekuensi mutasi modul, dan catatan jejak audit riil lintas seluruh tenant sekolah Yayasan Al-Basyariah.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-surface hover:bg-slate-50 active:bg-slate-100 text-text-main rounded-xl border border-border transition-colors shadow-2xs text-sm font-semibold disabled:opacity-50 cursor-pointer"
            title="Segarkan Telemetri Data"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-primary" : "text-text-muted"} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: Metrik Utama Sistem (4 Solid Matte Cards) */}
      <section className="flex flex-col gap-3">
        <div className="px-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">
            Indikator Kapasitas & Aktivitas Sistem
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Ringkasan volume data inti dan ritme penggunaan aplikasi terkini.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Data Induk (Executive Dark Slate Matte) */}
          <div className="bg-[#0f172a] text-white rounded-2xl border border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Volume Data Induk
              </span>
              <div className="w-10 h-10 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center">
                <Database size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tracking-tight">{formatNumber(totalMasterRecords)}</span>
                <span className="text-xs font-semibold text-slate-400">Entri Terkelola</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Akumulasi murid, rombel, pendidik, dan akun pengguna di database.
              </p>
            </div>
          </div>

          {/* Card 2: Pengguna Aktif Harian (DAU) */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Pengguna Aktif Hari Ini
              </span>
              <div className="w-10 h-10 bg-emerald-50 text-[#065f32] rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-text-main tracking-tight">{formatNumber(dauCount)}</span>
                <span className="text-xs font-semibold text-[#065f32]">Akun (DAU)</span>
              </div>
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                Pengguna unik yang login dan melakukan aktivitas sistem hari ini.
              </p>
            </div>
          </div>

          {/* Card 3: Laju Mutasi Harian */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Laju Mutasi Harian
              </span>
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                <Activity size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-text-main tracking-tight">{formatNumber(avgDailyLogs)}</span>
                <span className="text-xs font-semibold text-slate-600">Aksi / Hari</span>
              </div>
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                Rata-rata frekuensi transaksi dan pengubahan data dalam 30 hari.
              </p>
            </div>
          </div>

          {/* Card 4: Total Log Bulan Berjalan */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Log Bulan Berjalan
              </span>
              <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
                <FileText size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-text-main tracking-tight">{formatNumber(monthlyLogsCount)}</span>
                <span className="text-xs font-semibold text-amber-700">Catatan Audit</span>
              </div>
              <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                Total jejak rekam audit yang disimpan aman di sistem bulan ini.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Analitik Tren & Heatmap Jam Sibuk */}
      <section className="flex flex-col gap-3">
        <div className="px-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">
            Analisis Dinamika Beban & Jam Operasional
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Pemantauan volume aktivitas harian dan jam kerja tersibuk di lingkungan sekolah.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart: Tren 30 Hari */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs lg:col-span-2 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#065f32]" />
                  Tren Aktivitas Pengguna (30 Hari Terakhir)
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Fluktuasi harian mutasi administrasi, transaksi, dan akademik.</p>
              </div>
            </div>

            <div className="flex-1 min-h-[280px] w-full mt-2">
              {trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorForest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#065f32" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#065f32" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        backgroundColor: '#ffffff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      name="Volume Log" 
                      dataKey="total" 
                      stroke="#065f32" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorForest)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                  <Activity size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-text-main">Belum Ada Riwayat Aktivitas</p>
                  <p className="text-xs text-text-muted mt-0.5">Riwayat belum mencukupi untuk menampilkan grafik tren.</p>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap: Waktu Sibuk */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                <Zap size={16} className="text-amber-600" />
                Peta Jam Operasional (Heatmap)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Konsentrasi jam sibuk berdasarkan hari dalam seminggu.</p>
            </div>

            <div className="flex-1 min-h-[240px] -ml-4 mt-3">
              {cleanHeatmap && cleanHeatmap.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      dataKey="hour" 
                      name="Jam" 
                      unit=":00" 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      domain={[0, 23]} 
                      tickCount={6} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="dayName" 
                      name="Hari" 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <ZAxis type="number" dataKey="value" range={[30, 280]} name="Aktivitas" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' 
                      }} 
                    />
                    <Scatter data={cleanHeatmap} fill="#d97706" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                  <Zap size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-text-main">Data Heatmap Belum Cukup</p>
                </div>
              )}
            </div>

            <div className="p-3 mt-3 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              <span>Titik lebih besar menandakan jam dengan kepadatan mutasi data tertinggi.</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Beban Modul & Pengguna Teraktif (Antislop Matrix) */}
      <section className="flex flex-col gap-3">
        <div className="px-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">
            Utilisasi Modul & Pengguna Teraktif
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Analisis porsi transaksi per modul dan staf dengan kontribusi operasional terbesar.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modul Utilization Matrix (Replaces 8-color Donut Chart) */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#065f32]" />
                  Matriks Beban Modul Sistem
                </h3>
                <span className="text-xs font-semibold text-text-muted">
                  Total: {formatNumber(totalModulMutations)} Aksi
                </span>
              </div>
              <p className="text-xs text-text-muted mb-4">Proporsi mutasi yang membebani database berdasarkan fitur aplikasi.</p>
            </div>

            <div className="space-y-3.5 my-2">
              {modulData && modulData.length > 0 ? (
                modulData.slice(0, 6).map((item, idx) => {
                  const percent = Math.round((item.value / totalModulMutations) * 100) || 0
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-main flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#065f32]" />
                          {item.name}
                        </span>
                        <span className="font-mono text-slate-700">
                          {formatNumber(item.value)} aksi <span className="font-bold text-primary">({percent}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#065f32] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center bg-bg rounded-xl border border-dashed border-border text-text-muted text-sm">
                  Belum ada catatan mutasi modul.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>Fitur keuangan dan kesiswaan memegang porsi mutasi tertinggi.</span>
            </div>
          </div>

          {/* Leaderboard Top 10 Pengguna */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-text-main text-base flex items-center gap-2 mb-1">
                <Users size={16} className="text-[#065f32]" />
                Leaderboard Aktivitas Pengguna (Top 10)
              </h3>
              <p className="text-xs text-text-muted mb-4">Pengguna dengan frekuensi interaksi sistem tertinggi dalam 30 hari terakhir.</p>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1.5 hide-scrollbar">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((user, i) => (
                  <div key={user.id} className="p-3 bg-bg hover:bg-slate-50 rounded-xl border border-border flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        i === 1 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                        i === 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-surface text-slate-600 border border-border'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-main truncate">{user.name}</p>
                        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{user.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono shrink-0">
                      {formatNumber(user.count)} aksi
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-bg rounded-xl border border-dashed border-border text-text-muted text-sm">
                  Belum ada aktivitas pengguna tercatat.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border text-xs text-text-muted flex items-center justify-between">
              <span>Diurutkan berdasarkan entri log aktivitas audit trail.</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Real-time Audit Trail (Desktop Table + Mobile Adaptive Cards) */}
      <section className="flex flex-col gap-3">
        <div className="px-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">
            Jejak Rekam Audit Sistem (Audit Trail)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Histori terverifikasi setiap aksi penambahan, pengubahan, dan penghapusan data.</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          {/* Toolbar & Filters (Reflow Mobile First) */}
          <div className="p-4 sm:p-5 border-b border-border bg-bg/40 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#065f32]" />
                <span className="text-xs font-semibold text-text-main">
                  Daftar Histori Mutasi ({formatNumber(totalLogs)} catatan ditemukan)
                </span>
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

            {/* Filter Inputs with Mobile Touch Target >=44px */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Date Filter */}
              <div className="md:col-span-5 flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1 shadow-2xs min-h-[44px]">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs text-text-main font-medium focus:outline-none w-full cursor-pointer py-1.5"
                  title="Tanggal Mulai"
                />
                <span className="text-xs text-text-muted font-bold">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-xs text-text-main font-medium focus:outline-none w-full cursor-pointer py-1.5"
                  title="Tanggal Selesai"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(""); setEndDate(""); setCurrentPage(1); }}
                    className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                    title="Reset Filter Tanggal"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="md:col-span-4 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Cari pengguna, aksi, keterangan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 min-h-[44px] bg-surface border border-border rounded-xl text-xs font-medium text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-2xs"
                />
              </div>

              {/* Module Selector */}
              <div className="md:col-span-3 relative">
                <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <select
                  value={selectedModul}
                  onChange={(e) => setSelectedModul(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 min-h-[44px] bg-surface border border-border rounded-xl text-xs font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Semua Modul</option>
                  {availableModules.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW A: Desktop Table View (>=md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6 w-36">Waktu & Tanggal</th>
                  <th className="p-4">Pengguna</th>
                  <th className="p-4 w-44">Modul & Aksi</th>
                  <th className="p-4 pr-6">Keterangan Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {serverLogs.length > 0 ? (
                  serverLogs.map((log, index) => {
                    const dateObj = new Date(log.createdAt)
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLogIndex(index)}
                        className="border-b border-border hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="p-4 pl-6 text-text-muted font-mono text-xs align-top">
                          <span className="font-bold text-text-main">{dateObj.toLocaleDateString('id-ID')}</span>
                          <br />
                          <span className="text-[11px] text-text-muted">{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-bold text-text-main">{log.penggunaName}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {log.modul}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide border uppercase ${getActionBadge(log.aksi)}`}>
                              {log.aksi}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 align-top">
                          <div className="text-text-main text-xs bg-bg p-2.5 rounded-lg border border-border line-clamp-2 max-w-xl group-hover:border-primary/40 transition-colors">
                            {log.keterangan}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-text-muted">
                        <Search size={36} className="text-gray-300 mb-2" />
                        <p className="font-bold text-text-main text-sm">Tidak Ada Catatan Log</p>
                        <p className="text-xs mt-1">Pencarian tidak menemukan rekaman audit yang sesuai.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* VIEW B: Mobile Adaptive Card View (<md) - Antislop Layoutmobile */}
          <div className="md:hidden divide-y divide-border">
            {serverLogs.length > 0 ? (
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
                        {dateObj.toLocaleDateString('id-ID')} • {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {log.modul}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadge(log.aksi)}`}>
                          {log.aksi}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#065f32] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {log.penggunaName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-text-main truncate">{log.penggunaName}</span>
                    </div>

                    <p className="text-xs text-text-muted bg-bg p-2.5 rounded-lg border border-border leading-relaxed line-clamp-3">
                      {log.keterangan}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-text-muted">
                <Search size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-main">Tidak Ada Catatan Log</p>
              </div>
            )}
          </div>

          {/* Table Footer & Pagination (Touch-Friendly) */}
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
                {[10, 20, 50, 100].map(size => (
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

      {/* SECTION 6: Side Drawer Detail Jejak Audit (Siraya Standard & Mobile-Ready) */}
      {selectedLogIndex !== null && serverLogs[selectedLogIndex] && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLogIndex(null)}
          />
          
          <div className="relative w-full sm:max-w-lg bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-border z-10">
            {/* Drawer Header with Linear Navigation */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-bg/50 shrink-0">
              <div>
                <h3 className="font-bold text-text-main text-base">Detail Jejak Rekam Audit</h3>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  ID Log: {serverLogs[selectedLogIndex].id.split('-')[0]}...
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedLogIndex(Math.max(0, selectedLogIndex - 1))}
                  disabled={selectedLogIndex === 0}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                  title="Sebelumnya"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setSelectedLogIndex(Math.min(serverLogs.length - 1, selectedLogIndex + 1))}
                  disabled={selectedLogIndex === serverLogs.length - 1}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                  title="Berikutnya"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="w-px h-5 bg-border mx-1"></div>
                <button
                  onClick={() => setSelectedLogIndex(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Tutup Panel"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 pb-24">
              {/* Modul & Aksi */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                  <Tag size={13} /> Modul & Jenis Tindakan
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    {serverLogs[selectedLogIndex].modul}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wide border uppercase ${getActionBadge(serverLogs[selectedLogIndex].aksi)}`}>
                    {serverLogs[selectedLogIndex].aksi}
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg rounded-xl border border-border">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                    <Calendar size={12} /> Tanggal Mutasi
                  </h4>
                  <p className="text-xs font-semibold text-text-main">
                    {new Date(serverLogs[selectedLogIndex].createdAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                    <Clock size={12} /> Waktu Sistem
                  </h4>
                  <p className="text-xs font-semibold text-text-main font-mono">
                    {new Date(serverLogs[selectedLogIndex].createdAt).toLocaleTimeString('id-ID')} WIB
                  </p>
                </div>
              </div>

              {/* Aktor / Pengguna */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                  <User size={13} /> Pelaksana / Aktor
                </h4>
                <div className="flex items-center gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#065f32] flex items-center justify-center font-bold text-base">
                    {serverLogs[selectedLogIndex].penggunaName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">{serverLogs[selectedLogIndex].penggunaName}</p>
                    <p className="text-xs font-semibold text-[#065f32]">Staf / Pengguna Terotentikasi</p>
                  </div>
                </div>
              </div>

              {/* Deskripsi Lengkap */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FileText size={13} /> Rincian Aktivitas Data
                  </h4>
                  <button 
                    onClick={() => handleCopy(serverLogs[selectedLogIndex].keterangan, "Rincian aktivitas")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors p-1"
                  >
                    <Copy size={13} />
                    <span>Salin Rincian</span>
                  </button>
                </div>
                <div className="text-xs text-text-main leading-relaxed bg-bg p-4 rounded-xl border border-border font-mono whitespace-pre-wrap">
                  {serverLogs[selectedLogIndex].keterangan}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
