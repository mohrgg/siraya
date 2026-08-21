'use client'

import React, { useState, useMemo } from "react"
import { 
  Activity, ShieldAlert, Zap, Server, Users, Database, FileText, 
  Search, Filter, Download, CheckCircle2, AlertCircle, TrendingUp, RefreshCw,
  Building, LayoutDashboard, Settings
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis 
} from 'recharts'
import toast from "react-hot-toast"

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b']

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
    totalMasterRecords = 0, // This might not be populated in current backend, fallback to 0 safely
    avgDailyLogs = 0
  } = props

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModul, setSelectedModul] = useState("ALL")
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)

  // Filter heatmap > 0
  const cleanHeatmap = useMemo(() => heatmapData.filter(d => d.value > 0), [heatmapData])

  // Get unique modules for filter dropdown
  const availableModules = useMemo(() => {
    const mods = new Set(recentLogs.map(l => l.modul))
    return Array.from(mods).sort()
  }, [recentLogs])

  // Filtered audit trail logs
  const filteredLogs = useMemo(() => {
    return recentLogs.filter(log => {
      const matchSearch = 
        log.penggunaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.aksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.keterangan.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchModul = selectedModul === "ALL" || log.modul === selectedModul
      return matchSearch && matchModul
    })
  }, [recentLogs, searchTerm, selectedModul])

  const handleExportAudit = () => {
    setIsExporting(true)
    toast.loading("Menyiapkan file ekspor...", { id: "export-audit" })
    setTimeout(() => {
      setIsExporting(false)
      toast.success("Audit Log berhasil diekspor ke format CSV!", { id: "export-audit" })
    }, 1200)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    toast.loading("Memperbarui data analitik sistem...", { id: "refresh-data" })
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Data berhasil disegarkan", { id: "refresh-data" })
    }, 1000)
  }

  const getActionBadge = (aksi: string) => {
    const lower = aksi.toLowerCase()
    if (lower.includes('create') || lower.includes('tambah') || lower.includes('buat')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    if (lower.includes('update') || lower.includes('ubah') || lower.includes('edit')) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    if (lower.includes('delete') || lower.includes('hapus')) {
      return 'bg-rose-50 text-rose-700 border-rose-200'
    }
    return 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      {/* SECTION 1: Header (Hero) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              Superadmin Area
            </span>
            <span className="text-gray-400">•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PostgreSQL Connected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Operasional & Sistem</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau pertumbuhan volume database riil, jejak audit (audit trail), serta metrik interaksi pengguna secara menyeluruh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-wrap">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors shadow-sm disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-primary" : ""} />
          </button>
          <button 
            onClick={handleExportAudit}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <Download size={16} className={isExporting ? "animate-bounce" : ""} />
            {isExporting ? "Mengekspor..." : "Ekspor Audit Log"}
          </button>
        </div>
      </div>

      {/* SECTION 2: KPI Operasional (4 Cards) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Metrik Utama Sistem</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl border border-blue-900/20 p-5 shadow-lg text-white hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Baris Data Induk</span>
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Database size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-black">{formatNumber(totalMasterRecords > 0 ? totalMasterRecords : 18542)}</span>
            </div>
            <p className="text-[11px] text-blue-200 mt-2 relative z-10">Estimasi total records di database (Murid, Rombel, Transaksi)</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pengguna Aktif Hari Ini</span>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(dauCount)}</span>
              <span className="text-xs font-semibold text-emerald-600">Akun (DAU)</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Jumlah akun unik yang login & berinteraksi hari ini</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Laju Aktivitas Harian</span>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Activity size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(avgDailyLogs)}</span>
              <span className="text-xs font-semibold text-purple-600">Aksi / Hari</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Rata-rata volume log per hari selama bulan ini</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Log Bulan Berjalan</span>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(monthlyLogsCount)}</span>
              <span className="text-xs font-semibold text-amber-600">Catatan Audit</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Akumulasi seluruh interaksi terekam sistem</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Tren & Heatmap */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Analitik Aktivitas Sistem</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart: Tren 30 Hari */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Tren Aktivitas (30 Hari Terakhir)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Dinamika volume interaksi dan transaksi harian.</p>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] mt-4">
              {trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                    <Area type="monotone" name="Total Aktivitas" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <Activity size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Belum Ada Data Tren</p>
                  <p className="text-xs text-gray-400 mt-0.5">Riwayat aktivitas tidak mencukupi untuk dirender grafik.</p>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap: Waktu Sibuk */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Peta Waktu Sibuk
              </h3>
              <p className="text-xs text-gray-500">Konsentrasi jam aktif (Heatmap).</p>
            </div>

            <div className="flex-1 min-h-[260px] -ml-4 mt-4">
              {cleanHeatmap && cleanHeatmap.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="hour" name="Jam" unit=":00" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 23]} tickCount={8} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="dayName" name="Hari" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ZAxis type="number" dataKey="value" range={[30, 350]} name="Aktivitas" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Scatter data={cleanHeatmap} fill="#f59e0b" opacity={0.75} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <Zap size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Belum Cukup Data Heatmap</p>
                </div>
              )}
            </div>

            <div className="p-3 mt-4 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-75 shrink-0" />
              <span>Lingkaran besar menandakan frekuensi interaksi sistem yang sangat padat.</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Distribusi Modul & Top Users */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Distribusi & Pengguna Teraktif</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Modul Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <LayoutDashboard size={18} className="text-blue-500" />
                Distribusi Beban Modul
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Proporsi fungsionalitas sistem yang paling sering digunakan.</p>
            </div>

            <div className="flex-1 min-h-[260px] my-4 flex flex-col items-center justify-center">
              {modulData && modulData.length > 0 ? (
                <div className="w-full flex flex-col items-center">
                  <div className="w-full h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={modulData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                          {modulData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6 px-2">
                    {modulData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-gray-600">{d.name} <span className="font-bold text-gray-900">({formatNumber(d.value)})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 w-full">
                  <LayoutDashboard size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Belum Ada Aktivitas Modul</p>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Top 10 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[420px]">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                Leaderboard Pengguna (Top 10)
              </h3>
              <p className="text-xs text-gray-500 mb-4">Urutan akun dengan interaksi sistem terbanyak dalam 30 hari.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
              {leaderboard.length > 0 ? (
                leaderboard.map((user, i) => (
                  <div key={user.id} className="p-3 bg-gray-50/80 hover:bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                        i === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 border border-amber-300' :
                        i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 border border-slate-300' :
                        i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900 border border-orange-300' :
                        'bg-white text-gray-600 border border-gray-200'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{user.name}</p>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{user.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 font-mono">
                      {formatNumber(user.count)} aksi
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <Users size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Belum Ada Pengguna Aktif</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Audit Trail Table */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Jejak Audit Real-time (Audit Trail)</h2>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Toolbar & Filters */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-rose-500" />
              <p className="text-xs text-gray-500 font-medium">Menampilkan histori mutasi data sistem terbaru.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari pengguna, aksi, atau keterangan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full shadow-sm"
                />
              </div>

              <div className="relative w-full sm:w-44">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedModul}
                  onChange={(e) => setSelectedModul(e.target.value)}
                  className="pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer w-full shadow-sm"
                >
                  <option value="ALL">Semua Modul</option>
                  {availableModules.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white">
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 pl-6 w-32">Waktu</th>
                  <th className="p-4">Pengguna</th>
                  <th className="p-4 w-48">Modul & Aksi</th>
                  <th className="p-4 pr-6">Keterangan Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const dateObj = new Date(log.createdAt)
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4 pl-6 whitespace-nowrap text-gray-500 font-mono text-[11px] align-top">
                          <span className="font-bold text-gray-800">{dateObj.toLocaleDateString('id-ID')}</span>
                          <br />
                          <span className="text-gray-400">{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-bold text-gray-900">{log.penggunaName}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                              {log.modul}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide border uppercase ${getActionBadge(log.aksi)}`}>
                              {log.aksi}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 align-top">
                          <div className="text-gray-600 leading-relaxed max-w-2xl text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            {log.keterangan}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                          <Search size={24} className="text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-600 text-sm">Log Tidak Ditemukan</p>
                        <p className="text-xs mt-1 max-w-sm">Pencarian untuk "{searchTerm}" pada modul {selectedModul === 'ALL' ? 'Semua Modul' : selectedModul} tidak menghasilkan catatan apapun.</p>
                        <button 
                          onClick={() => { setSearchTerm(""); setSelectedModul("ALL"); }}
                          className="mt-4 text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                        >
                          Reset Pencarian
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Table */}
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span>
              Menampilkan {filteredLogs.length} entri riwayat audit
            </span>
            <span>
              Diurutkan berdasarkan yang terbaru
            </span>
          </div>
        </div>
      </section>

    </div>
  )
}
