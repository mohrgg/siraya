'use client'

import React, { useState } from "react"
import { 
  Building, Users, GraduationCap, LayoutDashboard, 
  AlertTriangle, TrendingUp, CheckCircle2, 
  Wallet, FileText, ArrowRight, ShieldCheck, 
  BarChart3, School, Layers, ChevronRight
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts'
import PendapatanInteractiveChart from './PendapatanInteractiveChart'
import Link from "next/link"
import UnitAuditSideDrawer from './UnitAuditSideDrawer'

interface YayasanDashboardProps {
  role?: string
  unitCount?: number
  muridCount?: number
  rombelCount?: number
  usersCount?: number
  guruCount?: number
  unitData?: Array<any>
  genderData?: Array<{ name: string; value: number; color?: string }>
  incompleteData?: Array<{ unitName: string; incompleteCount: number }>
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
  pendapatanPerUnitChart?: any[]
}

export default function YayasanDashboard(props: YayasanDashboardProps) {
  const {
    role = 'YAYASAN',
    unitCount = 0,
    muridCount = 0,
    rombelCount = 0,
    usersCount = 0,
    guruCount = 0,
    unitData = [],
    genderData = [],
    incompleteData = [],
    academicYear,
    totalKasGlobal = 0,
    totalPiutangGlobal = 0,
    kolektibilitas = 0,
    arusKasTrend = [],
    topUnitTunggakan = [],
    pendapatanHariIniChart = [],
    pendapatanMingguIniChart = [],
    pendapatanBulanIniChart = [],
    pendapatanPerUnitChart = []
  } = props

  const [selectedUnitDrillDown, setSelectedUnitDrillDown] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedDrawerIndex, setSelectedDrawerIndex] = useState(0)

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  // Status evaluasi kesehatan kolektibilitas unit
  const performaUnitData = unitData && unitData.length > 0 
    ? unitData.map(u => {
        let status: 'sehat' | 'perhatian' | 'kritis' | 'N/A' = 'sehat'
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
          status,
          raw: u
        }
      })
    : []

  const activeIncompleteData = incompleteData?.filter(d => d.incompleteCount > 0) || []

  // Hitung rasio gender
  const maleCount = genderData.find(g => g.name === 'Laki-laki')?.value || 0
  const femaleCount = genderData.find(g => g.name === 'Perempuan')?.value || 0
  const totalGender = maleCount + femaleCount
  const malePercent = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 50
  const femalePercent = totalGender > 0 ? (100 - malePercent) : 50

  const isKolektibilitasSehat = kolektibilitas >= 80

  return (
    <div className="flex flex-col gap-8 pb-20 md:pb-12 animate-in fade-in duration-300 max-w-[1600px] mx-auto w-full">
      
      {/* SECTION 1: Header Komando Eksekutif Yayasan */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 min-w-[300px]">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-50 text-[#065f32] border border-emerald-200/80">
              {role === 'ADMIN' ? 'Superadmin • Badan Penyelenggara Al-Basyariah' : 'Pengurus Yayasan • Badan Penyelenggara Al-Basyariah'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Tahun Akademik: {academicYear?.name || 'Aktif'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-800">Cakupan: Seluruh Unit (SD, SMP, SMK)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard 360° Cockpit Eksekutif Yayasan</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Konsolidasi pengawasan kelembagaan terpadu: pantau kesehatan mutu akademik, stabilitas arus kas riil, kepatuhan kapasitas rombel, dan efektivitas SPP di bawah naungan Yayasan Al-Basyariah.
          </p>
        </div>

        {/* Action Buttons (Kontekstual Audit Eksekutif) */}
        <div className="flex flex-wrap items-center gap-2">
          {role === 'ADMIN' && (
            <Link
              href="/manajemen-user"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Users size={16} />
              Kelola Pengguna
            </Link>
          )}
          <Link
            href="/unit-sekolah"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#065f32] hover:bg-[#054d28] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <School size={16} />
            Direktori Unit
          </Link>
          <Link
            href="/guru"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <GraduationCap size={16} />
            SDM Pendidik
          </Link>
          <Link
            href="/kelas"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <LayoutDashboard size={16} />
            Rombel Global
          </Link>
          <Link
            href="/rekapitulasi-tunggakan"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <Wallet size={16} />
            Piutang SPP
          </Link>
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <FileText size={16} />
            Laporan Konsolidasi
          </Link>
        </div>
      </div>

      {/* SECTION 2: Hero Telemetry Strip (4 Vital Signs Konsolidasi Yayasan) */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vital Signs Konsolidasi Yayasan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Indikator utama kekuatan finansial, kesiswaan, kapasitas ketenagaan, dan efektivitas SPP lintas unit.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Total Kas Riil Yayasan */}
          <Link 
            href="/kas-masuk"
            className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-[#065f32] hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#065f32] transition-colors">Total Kas Riil YTD</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#065f32] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#065f32] tracking-tight">{formatCurrency(totalKasGlobal)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Likuiditas Bersih
                </span>
                <span className="text-[11px] text-slate-400">Seluruh unit & rekening</span>
              </div>
            </div>
          </Link>

          {/* Tile 2: Total Siswa Seluruh Unit */}
          <Link 
            href="/kelas"
            className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">Total Siswa Terdaftar</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{formatNumber(muridCount)}</span>
                <span className="text-xs font-semibold text-slate-600">Peserta Didik</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {unitCount} Unit Binaan
                </span>
                <span className="text-[11px] text-slate-400">{formatNumber(rombelCount)} Rombongan Belajar</span>
              </div>
            </div>
          </Link>

          {/* Tile 3: Tenaga Pendidik & Staf */}
          <Link 
            href="/guru"
            className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">Kapasitas Tenaga Pendidik</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{formatNumber(guruCount)}</span>
                <span className="text-xs font-semibold text-slate-600">Guru & Staf</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Rasio 1 : {guruCount > 0 ? Math.round(muridCount / guruCount) : 0} Siswa
                </span>
                <span className="text-[11px] text-slate-400">{usersCount} Akun Sistem</span>
              </div>
            </div>
          </Link>

          {/* Tile 4: Kolektibilitas Tagihan Yayasan */}
          <Link 
            href="/rekapitulasi-tunggakan"
            className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">Kolektibilitas SPP Yayasan</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${isKolektibilitasSehat ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isKolektibilitasSehat ? 'text-slate-900' : 'text-amber-700'}`}>
                  {kolektibilitas}%
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isKolektibilitasSehat ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {isKolektibilitasSehat ? 'Kolektibilitas Prima' : 'Perhatian Khusus'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500">
                  Piutang Berjalan: <strong className="text-rose-600 font-bold">{formatCurrency(totalPiutangGlobal)}</strong>
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 3: Scorecard Matrix Komparasi Kinerja Antar Unit (SD, SMP, SMK) */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Scorecard Kinerja Antar Unit Sekolah</h2>
            <p className="text-xs text-slate-500 mt-0.5">Komparasi komprehensif populasi siswa, rombel, kapasitas guru, dan efektivitas penerimaan SPP.</p>
          </div>
          <Link 
            href="/unit-sekolah" 
            className="text-xs font-semibold text-[#065f32] hover:text-[#054d28] inline-flex items-center gap-1 self-start sm:self-auto"
          >
            Kelola Master Unit Sekolah <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {performaUnitData.map((item, idx) => {
            const kolektibilitasVal = typeof item.kolektibilitas === 'number' ? item.kolektibilitas : 0
            const isUnitSehat = item.status === 'sehat'
            const isUnitKritis = item.status === 'kritis'
            const avgPerRombel = item.rombel > 0 ? Math.round(item.siswa / item.rombel) : 0

            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Sekolah #{idx + 1}</span>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{item.unit}</h3>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      isUnitSehat 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isUnitKritis
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {item.status === 'sehat' ? 'Kinerja Sehat' : item.status === 'kritis' ? 'Audit Kritis' : 'Perlu Atensi'}
                    </span>
                  </div>

                  {/* 4 KPI Grid Per Unit */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{formatNumber(item.siswa)}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{avgPerRombel} siswa/rombel</span>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rombel Aktif</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{formatNumber(item.rombel)}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Kelas Belajar</span>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tenaga Guru</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{formatNumber(item.guru)}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Pengajar Unit</span>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kolektibilitas</span>
                      <span className={`text-xl font-black mt-0.5 block ${isUnitSehat ? 'text-[#065f32]' : isUnitKritis ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.kolektibilitas === 'N/A' ? '-' : `${item.kolektibilitas}%`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Realisasi SPP</span>
                    </div>
                  </div>

                  {/* Progress Kolektibilitas Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-600">Efektivitas Pelunasan</span>
                      <span className="font-bold text-slate-900">{item.kolektibilitas === 'N/A' ? 'N/A' : `${item.kolektibilitas}%`}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUnitSehat ? 'bg-[#065f32]' : isUnitKritis ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, kolektibilitasVal))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDrawerIndex(idx)
                    setIsDrawerOpen(true)
                  }}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#065f32]/10 hover:bg-[#065f32]/20 border border-[#065f32]/30 text-[#065f32] text-xs font-bold rounded-xl transition-all min-h-[44px] shadow-2xs group"
                >
                  <Layers size={14} className="text-[#065f32] group-hover:scale-110 transition-transform" />
                  Audit Sebaran Tingkat & Rombel
                  <ChevronRight size={14} className="text-[#065f32] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 4: Asymmetric 12-Col Split: Konsolidasi Arus Kas & Piutang Yayasan */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Arus Kas & Likuiditas Konsolidasi</h2>
          <p className="text-xs text-slate-500 mt-0.5">Analisis tren penerimaan kas lintas waktu dan unit prioritas penagihan piutang SPP.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: 7 Cols Interactive Cashflow Chart */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs h-full flex flex-col">
              <div className="mb-4">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-[#065f32] border border-emerald-200/80 inline-block mb-1">
                  Arus Kas Masuk
                </span>
                <h3 className="text-lg font-bold text-slate-900">Penerimaan Kas & Pendapatan Konsolidasi</h3>
                <p className="text-xs text-slate-500">Pantau transaksi penerimaan berdasarkan interval hari, minggu, bulan, atau distribusi per unit.</p>
              </div>

              <div className="flex-1 min-h-[380px] w-full">
                <PendapatanInteractiveChart
                  title="Penerimaan Kas Global"
                  hideContainerCard={true}
                  hariIniData={pendapatanHariIniChart}
                  mingguIniData={pendapatanMingguIniChart}
                  bulanIniData={pendapatanBulanIniChart}
                  perUnitData={pendapatanPerUnitChart}
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: 5 Cols Trend Arus Kas & Peringkat Tunggakan */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card 1: Trend 6 Bulan */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#065f32]" />
                    Trend Arus Kas (6 Bulan)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Perbandingan pemasukan vs pengeluaran konsolidasi.</p>
                </div>
              </div>

              <div className="min-h-[220px] w-full mt-2">
                {arusKasTrend && arusKasTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={arusKasTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPemasukanYayasan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#065f32" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#065f32" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPengeluaranYayasan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
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
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Area type="monotone" name="Pemasukan" dataKey="pemasukan" stroke="#065f32" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPemasukanYayasan)" />
                      <Area type="monotone" name="Pengeluaran" dataKey="pengeluaran" stroke="#e11d48" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPengeluaranYayasan)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 py-10">
                    Belum ada data transaksi keuangan tercatat
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 mt-2 text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#065f32]"></span> Pemasukan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]"></span> Pengeluaran
                </span>
              </div>
            </div>

            {/* Card 2: Piutang Tertinggi Antar Unit */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600" />
                    Unit Prioritas Piutang SPP
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar unit dengan akumulasi tagihan belum tertagih.</p>
                </div>
                <Link
                  href="/rekapitulasi-tunggakan"
                  className="text-xs font-semibold text-[#065f32] hover:underline"
                >
                  Lihat Rekap
                </Link>
              </div>

              <div className="space-y-2.5 mt-2">
                {topUnitTunggakan && topUnitTunggakan.length > 0 ? (
                  topUnitTunggakan.map((unit, idx) => (
                    <Link 
                      key={idx}
                      href="/rekapitulasi-tunggakan" 
                      className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-[#065f32] hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 group-hover:text-[#065f32]">
                        <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-700 font-black flex items-center justify-center text-[10px] border border-rose-200">
                          {idx + 1}
                        </span>
                        {unit.name}
                      </span>
                      <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md font-bold border border-rose-200 flex items-center gap-1">
                        {formatCurrency(unit.total)}
                        <ChevronRight size={12} className="text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-6 text-xs text-slate-400 text-center">
                    Tidak ada tunggakan tercatat pada seluruh unit.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Mutu Kelembagaan & Kepatuhan Administrasi */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kepatuhan Administrasi & Mutu Kesiswaan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Distribusi sebaran tingkat kelas, demografi gender, dan radar kelengkapan data identitas peserta didik.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: 7 Cols Sebaran Tingkat Kelas Antar Unit */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Building size={18} className="text-[#065f32]" />
                  {selectedUnitDrillDown ? `Sebaran Tingkat Kelas: ${selectedUnitDrillDown.name}` : 'Distribusi Siswa per Unit Sekolah'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedUnitDrillDown 
                    ? 'Populasi murid berdasarkan tingkat pada unit terpilih.' 
                    : 'Pilih unit untuk melihat rincian per tingkat atau klik tombol buka panel audit.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                {selectedUnitDrillDown && (
                  <button
                    type="button"
                    onClick={() => {
                      const foundIdx = unitData.findIndex(u => u.name === selectedUnitDrillDown.name)
                      if (foundIdx !== -1) setSelectedDrawerIndex(foundIdx)
                      setIsDrawerOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#065f32] hover:bg-[#054d28] text-white text-xs font-bold rounded-xl transition-all shadow-xs min-h-[36px]"
                  >
                    <Layers size={13} />
                    Buka Panel Rombel
                  </button>
                )}
                <Link
                  href="/kelas"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs min-h-[36px]"
                >
                  Modul Kelas <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Unit Selector Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUnitDrillDown(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !selectedUnitDrillDown
                    ? 'bg-[#065f32] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Unit (Konsolidasi)
              </button>
              {unitData.map((u, uIdx) => (
                <button
                  key={uIdx}
                  type="button"
                  onClick={() => setSelectedUnitDrillDown(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedUnitDrillDown?.name === u.name
                      ? 'bg-[#065f32] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-[300px] w-full mt-2">
              {selectedUnitDrillDown ? (
                selectedUnitDrillDown.classes && selectedUnitDrillDown.classes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={selectedUnitDrillDown.classes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                        formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                      />
                      <Bar dataKey="total" fill="#065f32" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <GraduationCap size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Belum Ada Data Tingkat Kelas</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tidak ditemukan sebaran kelas aktif pada unit ini.</p>
                  </div>
                )
              ) : unitData && unitData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={unitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                      formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                    />
                    <Bar dataKey="total" fill="#065f32" radius={[6, 6, 0, 0]} barSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Users size={32} className="text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Belum Ada Data Siswa</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tambahkan data murid pada unit sekolah terlebih dahulu.</p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: 5 Cols Demografi Gender & Kepatuhan Data */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Demografi Gender */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
                  <Users size={18} className="text-[#065f32]" />
                  Demografi Gender Siswa Yayasan
                </h3>
                <p className="text-xs text-slate-500">Komposisi murid laki-laki dan perempuan seluruh unit.</p>
              </div>

              <div className="my-5">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-700">Laki-laki: <strong>{formatNumber(maleCount)}</strong> ({malePercent}%)</span>
                  <span className="text-slate-700">Perempuan: <strong>{formatNumber(femaleCount)}</strong> ({femalePercent}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-[#065f32] h-full" style={{ width: `${malePercent}%` }} title={`Laki-laki: ${malePercent}%`} />
                  <div className="bg-slate-400 h-full" style={{ width: `${femalePercent}%` }} title={`Perempuan: ${femalePercent}%`} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Rasio Keseimbangan L : P</span>
                <span className="font-bold text-slate-900">{malePercent}% : {femalePercent}%</span>
              </div>
            </div>

            {/* Kepatuhan Identitas Siswa (NISN / NIK) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#065f32]" />
                    Integritas Data Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Audit kelengkapan nomor induk resmi (NISN / NIK / NIS).</p>
                </div>
              </div>

              {activeIncompleteData.length > 0 ? (
                <div className="space-y-2 mt-1">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 font-semibold mb-1">Ditemukan Data Belum Lengkap:</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed mb-2.5">
                      Beberapa siswa belum memiliki NISN/NIK valid. Koordinasikan dengan pihak Tata Usaha unit sekolah untuk pembaruan data Dapodik/EMIS.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeIncompleteData.map((d, idx) => (
                        <Link 
                          key={idx}
                          href="/kelas"
                          className="bg-white border border-amber-200 text-amber-800 text-[11px] px-2.5 py-1 rounded-md font-bold shadow-2xs hover:bg-amber-100/50 transition-colors"
                        >
                          {d.unitName}: {formatNumber(d.incompleteCount)} siswa →
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-[#065f32] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#065f32]">Data Administrasi Lengkap</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Seluruh peserta didik pada semua unit memiliki NISN & NIK yang tercatat rapi.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Side Drawer: Unit Audit */}
      <UnitAuditSideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        unitDataList={unitData}
        currentUnitIndex={selectedDrawerIndex}
        onSelectUnitIndex={setSelectedDrawerIndex}
      />

    </div>
  )
}
