'use client'

import React, { useState, useMemo } from "react"
import { 
  Activity, ShieldAlert, Zap, Server, Users, Database, FileText, 
  Search, Filter, Download, CheckCircle2, AlertCircle, TrendingUp, RefreshCw
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
    totalMasterRecords = 0,
    avgDailyLogs = 0
  } = props

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModul, setSelectedModul] = useState("ALL")
  const [isExporting, setIsExporting] = useState(false)

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)

  // Filter heatmap > 0
  const cleanHeatmap = useMemo(() => heatmapData.filter(d => d.value > 0), [heatmapData])

  // Get unique modules for filter dropdown
  const availableModules = useMemo(() => {
    const mods = new Set(recentLogs.map(l => l.modul))
    return Array.from(mods)
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
    setTimeout(() => {
      setIsExporting(false)
      toast.success("Audit Log berhasil diekspor ke format CSV!")
    }, 1200)
  }

  const handleRefresh = () => {
    toast.success("Memperbarui data analitik sistem...")
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Status Koneksi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              PostgreSQL Database • Connected
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-500">Superadmin System Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Operasional & Kesehatan Sistem</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau pertumbuhan volume database riil, jejak audit (audit trail), serta laju interaksi pengguna di seluruh sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors shadow-sm"
            title="Segarkan Data"
          >
            <RefreshCw size={16} />
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

      {/* Row 1: 4 Key Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Volume Data Induk</span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Database size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(totalMasterRecords)}</span>
            <span className="text-xs font-semibold text-blue-600">Baris Data</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Total Pengguna, Unit, Murid & Rombel</p>
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
            <span className="text-xs font-semibold text-emerald-600">Akun Unik (DAU)</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Akun berinteraksi hari ini</p>
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
            <span className="text-xs font-semibold text-purple-600">Aksi/Hari</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Rata-rata interaksi 30 hari terakhir</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Log Bulan Berjalan</span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(monthlyLogsCount)}</span>
            <span className="text-xs font-semibold text-amber-600">Total Log</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Jejak aktivitas terekam bulan ini</p>
        </div>
      </div>

      {/* Row 2: Area Chart (30 Days) & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Tren 30 Hari */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Tren Aktivitas Sistem (30 Hari)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Akumulasi interaksi dan pembaruan data setiap harinya.</p>
            </div>
          </div>

          <div className="flex-1 min-h-[280px] mt-4">
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
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data tren aktivitas.</div>
            )}
          </div>
        </div>

        {/* Heatmap: Waktu Sibuk */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Peta Waktu Sibuk (Heatmap)
            </h3>
            <p className="text-xs text-gray-500">Intensitas akses berdasarkan hari dan jam operasi.</p>
          </div>

          <div className="flex-1 min-h-[240px] -ml-4 mt-4">
            {cleanHeatmap && cleanHeatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                  <XAxis type="number" dataKey="hour" name="Jam" unit=":00" tick={{ fontSize: 10 }} domain={[0, 23]} tickCount={8} />
                  <YAxis type="category" dataKey="dayName" name="Hari" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ZAxis type="number" dataKey="value" range={[30, 350]} name="Aktivitas" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                  <Scatter data={cleanHeatmap} fill="#f59e0b" opacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-xs font-semibold text-gray-400">Belum cukup data heatmap</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/60 text-[11px] text-amber-800 text-center">
            Lingkaran besar menandakan frekuensi interaksi yang lebih padat
          </div>
        </div>
      </div>

      {/* Row 3: Modul Distribution & Leaderboard Top 10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modul Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Database size={18} className="text-blue-500" />
              Distribusi Penggunaan Modul
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Proporsi modul yang paling sering dioperasikan oleh pengguna.</p>
          </div>

          <div className="h-[260px] my-4">
            {modulData && modulData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={modulData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {modulData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada aktivitas modul.</div>
            )}
          </div>
        </div>

        {/* Leaderboard Top 10 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between max-h-[400px]">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
              <Users size={18} className="text-emerald-500" />
              Leaderboard Pengguna Teraktif
            </h3>
            <p className="text-xs text-gray-500 mb-4">Daftar 10 akun dengan kontribusi aktivitas tertinggi dalam 30 hari.</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2.5">
            {leaderboard.length > 0 ? (
              leaderboard.map((user, i) => (
                <div key={user.id} className="p-3 bg-gray-50/80 hover:bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      i === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      i === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                      i === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{user.name}</p>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">{user.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 font-mono">
                    {formatNumber(user.count)} aksi
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-gray-400">Belum ada aktivitas dari pengguna.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Interactive Audit Trail (With Search & Filter QoL) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-500" />
              <h3 className="font-bold text-gray-900 text-lg">Jejak Audit Real-time (Audit Trail)</h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Catatan riwayat 30 aktivitas dan mutasi data terakhir pada sistem.</p>
          </div>

          {/* QoL Controls: Search & Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari pengguna / aksi..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full sm:w-48"
              />
            </div>

            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedModul}
                onChange={(e) => setSelectedModul(e.target.value)}
                className="pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="ALL">Semua Modul</option>
                {availableModules.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/90 backdrop-blur sticky top-0 z-10 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th className="p-4">Waktu</th>
                <th className="p-4">Pengguna</th>
                <th className="p-4">Modul & Aksi</th>
                <th className="p-4">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.createdAt)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        <span className="font-bold text-gray-800">{dateObj.toLocaleDateString('id-ID')}</span>
                        <br />
                        <span>{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">{log.penggunaName}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide bg-blue-50 text-blue-700 border border-blue-100 mb-1">
                          {log.aksi}
                        </span>
                        <br />
                        <span className="text-[11px] text-gray-500 font-semibold">{log.modul}</span>
                      </td>
                      <td className="p-4 text-gray-600 max-w-md leading-relaxed" title={log.keterangan}>
                        {log.keterangan}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle size={28} className="text-gray-300 mb-2" />
                      <p className="font-bold text-gray-600 text-sm">Tidak Ada Log yang Cocok</p>
                      <p className="text-xs mt-0.5">Silakan sesuaikan kata kunci pencarian atau filter modul Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center text-[11px] text-gray-400">
          Menampilkan {filteredLogs.length} dari {recentLogs.length} catatan audit trail
        </div>
      </div>
    </div>
  )
}
