'use client'

import React, { useState } from "react"
import { 
  Building, Users, GraduationCap, LayoutDashboard, ShieldCheck, 
  AlertTriangle, TrendingUp, CheckCircle2, 
  Settings, Award, Wallet, FileText, Info
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'
import PendapatanInteractiveChart from './PendapatanInteractiveChart'
import Link from "next/link"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface YayasanDashboardProps {
  role?: string
  unitCount?: number
  muridCount?: number
  rombelCount?: number
  usersCount?: number
  guruCount?: number
  unitData?: Array<any>
  genderData?: Array<{ name: string; value: number; color?: string }>
  scholarshipData?: Array<{ name: string; value: number; color?: string }>
  dataQualityIndex?: number
  incompleteData?: Array<{ unitName: string; incompleteCount: number }>
  trendData?: Array<{ year: string; total: number }>
  districtData?: Array<{ name: string; value: number }>
  classEfficiency?: Array<{ name: string; ratio: number }>
  statusDataGlobal?: Array<{ name: string; value: number }>
  academicYear?: any
  // Keuangan
  totalKasGlobal?: number
  totalPiutangGlobal?: number
  kolektibilitas?: number
  arusKasTrend?: Array<{ month: string, pemasukan: number, pengeluaran: number }>
  topUnitTunggakan?: Array<{ name: string, total: number }>
  pendapatanHariIniChart?: any[]
  pendapatanMingguIniChart?: any[]
  pendapatanBulanIniChart?: any[]
}

export default function YayasanDashboard(props: YayasanDashboardProps) {
  const {
    role = 'TATA_USAHA',
    unitCount = 0,
    muridCount = 0,
    rombelCount = 0,
    usersCount = 0,
    guruCount = 0,
    unitData = [],
    genderData = [],
    scholarshipData = [],
    dataQualityIndex = 0,
    incompleteData = [],
    classEfficiency = [],
    academicYear,
    totalKasGlobal = 0,
    totalPiutangGlobal = 0,
    kolektibilitas = 0,
    arusKasTrend = [],
    topUnitTunggakan = [],
    pendapatanHariIniChart = [],
    pendapatanMingguIniChart = [],
    pendapatanBulanIniChart = []
  } = props

  const [selectedUnitDrillDown, setSelectedUnitDrillDown] = useState<any>(null)

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  const performaUnitData = unitData && unitData.length > 0 
    ? unitData.map(u => {
        let status = 'sehat'
        if (u.kolektibilitas === null || u.kolektibilitas === undefined || isNaN(u.kolektibilitas)) {
          status = 'N/A'
        } else if (u.kolektibilitas < 50) {
          status = 'kritis'
        } else if (u.kolektibilitas < 80) {
          status = 'perhatian'
        }
        
        return {
          unit: u.name,
          siswa: u.total || 0,
          rombel: u.rombel || 0,
          guru: u.guru || 0,
          kolektibilitas: u.kolektibilitas ?? 'N/A',
          status
        }
      })
    : []

  const activeIncompleteData = incompleteData?.filter(d => d.incompleteCount > 0) || []

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      {/* SECTION 1: Header (Hero) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              {role === 'ADMIN' ? 'Superadmin Area' : 'Tata Usaha Area'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-500">Tahun Akademik: {academicYear?.name || 'Aktif'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Global Yayasan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan eksekutif dan analitik terpusat untuk seluruh unit sekolah di bawah naungan Yayasan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-wrap">
          {role === 'ADMIN' && (
            <>
              <Link 
                href="/manajemen-user" 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
              >
                <Settings size={16} />
                Kelola Pengguna
              </Link>
              <Link 
                href="/unit-sekolah" 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
              >
                <Building size={16} />
                Unit Sekolah
              </Link>
            </>
          )}
          <Link 
            href="/laporan" 
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <FileText size={16} />
            Buka Laporan
          </Link>
        </div>
      </div>

      {/* SECTION 2: KPI Operasional & Akademik */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Ringkasan Operasional</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Unit Sekolah</span>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Building size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(unitCount)}</span>
              <span className="text-xs font-semibold text-blue-600">Unit Aktif</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Menanungi seluruh jenjang pendidikan</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Siswa Aktif</span>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(muridCount)}</span>
              <span className="text-xs font-semibold text-emerald-600">Siswa Terdaftar</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Tersebar di seluruh kelas & rombel</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Rombongan Belajar</span>
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(rombelCount)}</span>
              <span className="text-xs font-semibold text-purple-600">Rombel Aktif</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Grup kelas belajar mengajar</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Guru & Pegawai</span>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(guruCount)}</span>
              <span className="text-xs font-semibold text-amber-600">Tenaga Pendidik</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">serta {formatNumber(usersCount)} Akun Pengguna</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Informasi Akademik */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Statistik Akademik</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Building size={18} className="text-primary" />
                  {selectedUnitDrillDown ? `Sebaran Siswa per Tingkat: ${selectedUnitDrillDown.name}` : 'Distribusi Siswa per Unit Sekolah'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedUnitDrillDown ? 'Distribusi populasi siswa pada tingkat kelas di unit ini.' : 'Klik pada batang grafik unit untuk melihat sebaran siswa per tingkat kelas.'}
                </p>
              </div>
              {selectedUnitDrillDown && (
                <button
                  onClick={() => setSelectedUnitDrillDown(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                >
                  ← Kembali ke Semua Unit
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[300px] mt-4">
              {selectedUnitDrillDown ? (
                selectedUnitDrillDown.classes && selectedUnitDrillDown.classes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedUnitDrillDown.classes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                        formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total Siswa']}
                      />
                      <Bar dataKey="total" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={40}>
                        {selectedUnitDrillDown.classes.map((entry: any, index: number) => (
                          <Cell key={`cell-drill-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <GraduationCap size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">Belum Ada Data Tingkat Kelas</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tidak ditemukan sebaran kelas pada unit ini.</p>
                  </div>
                )
              ) : unitData && unitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={unitData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(data: any) => {
                      if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload && data.activePayload[0].payload.classes) {
                        setSelectedUnitDrillDown(data.activePayload[0].payload)
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                      formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]} 
                      barSize={40}
                      cursor="pointer"
                      onClick={(data: any) => {
                        if (data && data.classes) {
                          setSelectedUnitDrillDown(data)
                        }
                      }}
                    >
                      {unitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <Users size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">Belum Ada Data Siswa</p>
                  <p className="text-xs text-gray-400 mt-0.5">Silakan tambahkan data murid pada unit sekolah terlebih dahulu.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
                <Users size={18} className="text-pink-500" />
                Demografi Gender
              </h3>
              <p className="text-xs text-gray-500">Perbandingan siswa laki-laki dan perempuan di seluruh Yayasan.</p>
            </div>

            <div className="flex-1 min-h-[240px] my-4 flex items-center justify-center">
              {genderData && genderData.length > 0 && genderData.some(d => d.value > 0) ? (
                <div className="w-full flex flex-col items-center">
                  <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                          formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4 px-2">
                    {genderData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color || COLORS[i % COLORS.length] }}></span>
                        <span className="text-gray-600">{d.name} <span className="font-bold text-gray-900">({formatNumber(d.value)})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs font-semibold text-gray-400">Data gender belum tersedia</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs font-medium text-gray-600">
              <span>Rasio Global L:P</span>
              <span className="font-bold text-gray-900">
                {genderData[0]?.value && genderData[1]?.value
                  ? `${Math.round((genderData[0].value / (genderData[0].value + genderData[1].value)) * 100)}% : ${Math.round((genderData[1].value / (genderData[0].value + genderData[1].value)) * 100)}%`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Performa Unit */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Performa Unit</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 pl-6">Unit</th>
                  <th className="p-4 text-center">Siswa</th>
                  <th className="p-4 text-center">Rombel</th>
                  <th className="p-4 text-center">Guru</th>
                  <th className="p-4 text-center">Kolektibilitas</th>
                  <th className="p-4 text-center pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
                {performaUnitData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-gray-900">{row.unit}</td>
                    <td className="p-4 text-center font-medium">{formatNumber(row.siswa)}</td>
                    <td className="p-4 text-center font-medium">{formatNumber(row.rombel)}</td>
                    <td className="p-4 text-center font-medium">{formatNumber(row.guru)}</td>
                    <td className="p-4 text-center font-medium">{row.kolektibilitas === 'N/A' ? <span className="text-gray-400">-</span> : `${row.kolektibilitas}%`}</td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex justify-center items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${row.status === 'sehat' ? 'bg-emerald-500' : row.status === 'N/A' ? 'bg-gray-400' : row.status === 'kritis' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-medium text-gray-500 capitalize">{row.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: Informasi Keuangan */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Informasi Keuangan</h2>
        </div>
        
        {/* Row 1: Keuangan (Financial Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl border border-emerald-900/20 p-5 shadow-lg text-white hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Kas Global YTD</span>
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-black">{formatCurrency(totalKasGlobal)}</span>
            </div>
            <p className="text-[11px] text-emerald-200 mt-2 relative z-10">Pemasukan bersih dikurangi pengeluaran global</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl border border-rose-900/20 p-5 shadow-lg text-white hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Total Piutang Global</span>
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl font-black">{formatCurrency(totalPiutangGlobal)}</span>
            </div>
            <p className="text-[11px] text-rose-200 mt-2 relative z-10">Total tagihan aktif yang belum dibayar</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Kolektibilitas Tagihan</span>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{kolektibilitas}%</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${kolektibilitas >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {kolektibilitas >= 80 ? 'Sehat' : 'Perhatian'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Rasio tagihan yang telah lunas</p>
          </div>
        </div>

        {/* Row 2: Grafik & Tunggakan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  Trend Arus Kas (6 Bulan Terakhir)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Perbandingan pemasukan vs pengeluaran seluruh unit.</p>
              </div>
            </div>
            
            <div className="flex-1 min-h-[280px] w-full">
              {arusKasTrend && arusKasTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={arusKasTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => `Rp${(value/1000000).toFixed(0)}Jt`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Area type="monotone" name="Pemasukan" dataKey="pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukan)" />
                    <Area type="monotone" name="Pengeluaran" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPengeluaran)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada transaksi keuangan</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-full">
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-500" />
                  Tunggakan Tertinggi
                </h3>
                <p className="text-xs text-gray-500 mb-4">5 Unit dengan piutang terbesar.</p>
              </div>
              
              <div className="flex-1 flex flex-col gap-3 justify-center">
                {topUnitTunggakan && topUnitTunggakan.length > 0 ? (
                  topUnitTunggakan.map((unit, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-[10px]">{idx + 1}</span>
                        {unit.name}
                      </span>
                      <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md font-bold border border-rose-100">
                        {formatCurrency(unit.total)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-400 text-center">
                    <p>Tidak ada tunggakan tercatat.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Grafik Pendapatan Interaktif */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-blue-500" />
            Pendapatan & Transaksi Detail
          </h3>
          <div className="w-full h-[360px]">
            <PendapatanInteractiveChart 
              hariIniData={pendapatanHariIniChart}
              mingguIniData={pendapatanMingguIniChart}
              bulanIniData={pendapatanBulanIniChart}
            />
          </div>
        </div>
      </section>

      {/* SECTION 6: Peringatan (Warning) */}
      {activeIncompleteData.length > 0 ? (
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Peringatan Sistem</h2>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-rose-800 text-sm">Data Tidak Lengkap Ditemukan</h3>
              <p className="text-xs text-rose-600 mt-1 mb-3">Beberapa unit memiliki data murid atau guru yang belum lengkap. Harap segera perbarui data untuk menjaga akurasi laporan.</p>
              <div className="flex flex-wrap gap-2">
                {activeIncompleteData.map((data, idx) => (
                  <span key={idx} className="bg-white border border-rose-100 text-rose-700 text-[11px] px-2.5 py-1 rounded-md font-semibold shadow-sm">
                    {data.unitName} ({data.incompleteCount} data belum lengkap)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Status Sistem</h2>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 text-sm">Sistem Berjalan Optimal</h3>
              <p className="text-xs text-emerald-600 mt-1">Tidak ada anomali data atau peringatan tunggakan kritis saat ini.</p>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
