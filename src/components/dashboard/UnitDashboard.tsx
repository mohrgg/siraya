'use client'

import React, { useState } from "react"
import { 
  Users, GraduationCap, LayoutDashboard, ShieldAlert, AlertTriangle, 
  CheckCircle2, Clock, PlusCircle, BookOpen, ArrowRight, UserCheck, 
  HeartHandshake, Sparkles, Activity, Wallet
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import Link from 'next/link'
import PendapatanInteractiveChart from './PendapatanInteractiveChart'
import toast from "react-hot-toast"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface UnitDashboardProps {
  role?: string
  unitName?: string
  totalMurid?: number
  totalRombel?: number
  totalJurusan?: number
  totalGuru?: number
  rombelData?: Array<{ name: string; total: number }>
  capacityWarnings?: Array<{ name: string; total: number }>
  genderData?: Array<{ name: string; value: number; color?: string }>
  statusData?: Array<{ name: string; value: number }>
  anomalyList?: Array<any>
  missingParent?: number
  mutationLogs?: Array<any>
  parentData?: Array<{ name: string; value: number; color?: string }>
  scholarshipData?: Array<{ name: string; value: number; color?: string }>
  incomeData?: Array<{ name: string; value: number; color?: string }>
  guruStatusData?: Array<{ name: string; value: number; color?: string }>
  ageData?: Array<{ ageGroup: string; name?: string; total: number }>
  unitLogs?: Array<any>
  // Keuangan Unit
  penerimaanBulanIni?: number
  pengeluaranBulanIni?: number
  totalTunggakanUnit?: number
  tunggakanKritisList?: Array<any>
  pendapatanHariIniChart?: any[]
  pendapatanMingguIniChart?: any[]
  pendapatanBulanIniChart?: any[]
}

export default function UnitDashboard(props: UnitDashboardProps) {
  const {
    role = 'TATA_USAHA',
    unitName = 'Unit Sekolah',
    totalMurid = 0,
    totalRombel = 0,
    totalJurusan = 0,
    rombelData = [],
    capacityWarnings = [],
    genderData = [],
    statusData = [],
    anomalyList = [],
    missingParent = 0,
    mutationLogs = [],
    parentData = [],
    scholarshipData = [],
    incomeData = [],
    guruStatusData = [],
    ageData = [],
    unitLogs = [],
    totalGuru = 0,
    penerimaanBulanIni = 0,
    pengeluaranBulanIni = 0,
    totalTunggakanUnit = 0,
    tunggakanKritisList = [],
    pendapatanHariIniChart = [], pendapatanMingguIniChart = [], pendapatanBulanIniChart = []
  } = props

  const [activeTab, setActiveTab] = useState<'anomali' | 'mutasi' | 'tunggakan'>('anomali')

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  const handleQuickAction = (actionName: string) => {
    toast.success(`Membuka fitur: ${actionName}`)
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Role Injection (Quick Actions for TU) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-50 text-blue-600 border border-blue-100">
              {role === 'ADMIN' ? 'Superadmin • Supervisi Unit' : 'Tata Usaha • Operasional Unit'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs font-bold text-gray-800">{unitName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Operasional Unit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau kapasitas kelas, demografi murid, serta kelengkapan data administratif pada {unitName}.
          </p>
        </div>

        {/* Role Injection: TU mendapatkan tombol Quick Actions, Admin mendapatkan mode Supervisi */}
        {role === 'TATA_USAHA' ? (
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <Link
              href="/kelas"
              onClick={() => handleQuickAction('Kelola Kelas & Murid')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
            >
              <PlusCircle size={16} />
              Kelola Kelas & Murid
            </Link>
          </div>
        ) : (
          <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 shrink-0 self-start md:self-center whitespace-nowrap">
            Mode Supervisi (Read-Only)
          </div>
        )}
      </div>

      {/* Row 1: Keuangan (Financial Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl border border-emerald-900/20 p-5 shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Penerimaan Bulan Ini</span>
            <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black">{formatCurrency(penerimaanBulanIni)}</span>
          </div>
          <p className="text-[11px] text-emerald-200 mt-2 relative z-10">Total kas masuk di unit {unitName}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl border border-rose-900/20 p-5 shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Total Tunggakan Unit</span>
            <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black">{formatCurrency(totalTunggakanUnit)}</span>
          </div>
          <p className="text-[11px] text-rose-200 mt-2 relative z-10">Total tagihan siswa yang belum dibayar</p>
        </div>
      </div>

      {/* Row 2: Key Metrics Akademik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Siswa Aktif</span>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(totalMurid)}</span>
            <span className="text-xs font-semibold text-blue-600">Peserta Didik</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Siswa berstatus aktif di unit ini</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Rombongan Belajar</span>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(totalRombel)}</span>
            <span className="text-xs font-semibold text-purple-600">Rombel Aktif</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Kelas yang sedang berjalan</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Program / Jurusan</span>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(totalJurusan)}</span>
            <span className="text-xs font-semibold text-emerald-600">Jurusan Terdaftar</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Kompetensi keahlian / peminatan</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tenaga Pendidik</span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(totalGuru)}</span>
            <span className="text-xs font-semibold text-amber-600">Guru Aktif</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Berbasis di unit ini</p>
        </div>
      </div>

      {/* Row 1.5: Grafik Pendapatan Interaktif */}
      <div className="w-full h-[350px]">
        <PendapatanInteractiveChart 
          hariIniData={pendapatanHariIniChart}
          mingguIniData={pendapatanMingguIniChart}
          bulanIniData={pendapatanBulanIniChart}
        />
      </div>

      {/* Row 2: Kepadatan Rombel (Bar Chart with Reference Line) & Task Alert List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Kepadatan Rombel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Kepadatan Siswa per Rombel
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Batas ideal maksimal adalah 35 siswa/rombel (Garis Merah).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11px] font-bold">
                Batas Ideal: 35
              </span>
              {capacityWarnings.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold shadow-sm">
                  <AlertTriangle size={14} />
                  {capacityWarnings.length} Melebihi Batas
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 w-full mt-4 min-h-0">
            {rombelData && rombelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rombelData} margin={{ top: 25, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    domain={[0, (dataMax: number) => Math.max(Math.round(dataMax * 1.25), 45)]}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                    formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Jumlah']}
                  />
                  <ReferenceLine 
                    y={35} 
                    label={{ 
                      value: 'Maks Ideal (35)', 
                      fill: '#dc2626', 
                      fontSize: 11, 
                      fontWeight: 'bold', 
                      position: 'top',
                      dy: -6
                    }} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    strokeWidth={2} 
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                    {rombelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 35 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <LayoutDashboard size={32} className="text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">Belum Ada Rombel Aktif</p>
              </div>
            )}
          </div>
        </div>

        {/* Task & Anomaly Center */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[420px]">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 shrink-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('anomali')}
                  className={`text-sm font-bold pb-1 transition-all ${
                    activeTab === 'anomali' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Anomali ({anomalyList.length})
                </button>
                <button
                  onClick={() => setActiveTab('mutasi')}
                  className={`text-sm font-bold pb-1 transition-all ${
                    activeTab === 'mutasi' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Mutasi ({mutationLogs.length})
                </button>
                <button
                  onClick={() => setActiveTab('tunggakan')}
                  className={`text-sm font-bold pb-1 transition-all ${
                    activeTab === 'tunggakan' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Tunggakan
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
              {activeTab === 'anomali' ? (
                anomalyList.length > 0 ? (
                  anomalyList.map((item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">NIS: {item.nis}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {!item.nisn && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold">No NISN</span>}
                          {!item.nik && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold">No NIK</span>}
                          {(!item.fatherName || !item.motherName) && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Ortu Kosong</span>}
                        </div>
                      </div>
                      <Link
                        href={`/kelas`}
                        className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                        title="Perbaiki Data"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                    Tidak ditemukan anomali data di unit ini!
                  </div>
                )
              ) : activeTab === 'mutasi' ? (
                mutationLogs.length > 0 ? (
                  mutationLogs.map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{new Date(item.updatedAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold">
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400 text-xs">Belum ada catatan mutasi siswa.</div>
                )
              ) : (
                tunggakanKritisList.length > 0 ? (
                  tunggakanKritisList.map((item, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-start justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.murid.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">NIS: {item.murid.nis}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{item.akun.nama}</span>
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{formatCurrency(item.sisaTagihan)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/laporan/tunggakan-siswa`}
                        className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors shrink-0"
                        title="Tindak Lanjut"
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                    Tidak ada tunggakan kritis.
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
            <span>Siswa tanpa data wali:</span>
            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{missingParent} Siswa</span>
          </div>
        </div>
      </div>

      {/* Row 3: 5 Pie Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Pie 1: Gender */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <UserCheck size={16} className="text-blue-500" /> Komposisi Gender
          </h4>
          <div className="h-[180px] my-2">
            {genderData && genderData.length > 0 && genderData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {genderData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Pie 2: Kelengkapan Wali */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <HeartHandshake size={16} className="text-emerald-500" /> Kelengkapan Data Wali
          </h4>
          <div className="h-[180px] my-2">
            {parentData && parentData.length > 0 && parentData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={parentData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {parentData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Pie 3: Beasiswa vs Reguler */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" /> Beasiswa vs Reguler
          </h4>
          <div className="h-[180px] my-2">
            {scholarshipData && scholarshipData.length > 0 && scholarshipData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={scholarshipData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {scholarshipData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Pie 4: Rentang Gaji Ortu */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Wallet size={16} className="text-purple-500" /> Rentang Gaji Ortu
          </h4>
          <div className="h-[180px] my-2">
            {incomeData && incomeData.length > 0 && incomeData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incomeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {incomeData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Pie 5: Status Kepegawaian Guru */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <UserCheck size={16} className="text-pink-500" /> Status Guru
          </h4>
          <div className="h-[180px] my-2">
            {guruStatusData && guruStatusData.length > 0 && guruStatusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={guruStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {guruStatusData.map((e, i) => <Cell key={i} fill={e.color || COLORS[(i + 4) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Demografi Usia (Bar Chart) & Unit Activity Log (Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Demografi Usia */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Users size={18} className="text-purple-500" />
                Demografi Rentang Usia Siswa
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Dikalkulasi otomatis berdasarkan tanggal lahir siswa aktif.</p>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] mt-4">
            {ageData && ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                    formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Jumlah']}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">Data tanggal lahir belum dilengkapi.</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline: Log Aktivitas Unit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Activity size={18} className="text-blue-500" />
              Log Operasional Unit
            </h3>
            
            <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
              {unitLogs && unitLogs.length > 0 ? (
                unitLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-gray-800">{log.aksi.replace(/_/g, ' ')}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">{log.keterangan}</p>
                      <span className="text-[10px] text-gray-400">Oleh: {log.penggunaName} • {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 text-xs">Belum ada aktivitas terekam.</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">Menampilkan 5 aktivitas terakhir di unit ini</span>
          </div>
        </div>
      </div>
    </div>
  )
}
