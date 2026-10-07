'use client'

import React, { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { setGlobalContext } from "@/actions/app-context"
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
import { AdaptiveValue } from "@/components/ui/AdaptiveValue"

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
  topUnitTunggakan?: Array<{ id?: string, name: string, total: number }>
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

  const [selectedUnitDrillDown, setSelectedUnitDrillDown] = useState<any | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedDrawerIndex, setSelectedDrawerIndex] = useState(0)

  const router = useRouter()
  const [isSyncing, startSync] = useTransition()

  const handleDrilldownUnitTunggakan = (unitId?: string) => {
    if (!unitId) {
      window.location.href = "/rekapitulasi-tunggakan"
      return
    }
    startSync(async () => {
      await setGlobalContext(unitId, academicYear?.id || "")
      window.location.href = `/rekapitulasi-tunggakan?unitId=${unitId}`
    })
  }

  const handleDrilldownUnitDashboard = (unitId?: string) => {
    if (!unitId) return
    startSync(async () => {
      await setGlobalContext(unitId, academicYear?.id || "")
      window.location.href = `/?tab=unit&unitId=${unitId}`
    })
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => `Rp ${new Intl.NumberFormat('id-ID').format(num || 0)}`

  // Urutan hierarki jenjang sekolah dari paling kecil ke paling besar (TK -> SD -> SMP -> SMA -> SMK)
  const getUnitLevel = (name: string) => {
    const str = (name || '').toUpperCase()
    if (str.includes('TK') || str.includes('PAUD')) return 0
    if (str.includes('SD') || str.includes('MI')) return 1
    if (str.includes('SMP') || str.includes('MTS')) return 2
    if (str.includes('SMA') || str.includes('MA')) return 3
    if (str.includes('SMK')) return 4
    return 5
  }

  const sortedUnitData = useMemo(() => {
    return [...unitData].sort((a, b) => getUnitLevel(a.name) - getUnitLevel(b.name))
  }, [unitData])

  // Status evaluasi kesehatan kolektibilitas unit
  const performaUnitData = sortedUnitData && sortedUnitData.length > 0 
    ? sortedUnitData.map(u => {
        let status: 'sehat' | 'perhatian' | 'kritis' | 'N/A' = 'sehat'
        if (u.kolektibilitas === null || u.kolektibilitas === undefined || isNaN(u.kolektibilitas)) {
          status = 'N/A'
        } else if (u.kolektibilitas < 50) {
          status = 'kritis'
        } else if (u.kolektibilitas < 80) {
          status = 'perhatian'
        }
        
        return {
          id: u.id,
          unit: u.name,
          unitName: u.name,
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

  // Grid adaptif cerdas berbasis jumlah unit agar simetris & hemat ruang vertikal
  const getScorecardGridClass = (count: number) => {
    if (count <= 1) return "grid grid-cols-1 max-w-2xl mx-auto gap-4 sm:gap-5"
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
    if (count === 3) return "grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
    if (count === 4) return "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-5"
    if (count <= 6) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5"
  }

  return (
    <div className="flex flex-col gap-8 pb-20 md:pb-12 animate-in fade-in duration-300 max-w-[1600px] mx-auto w-full">
      
      {/* SECTION 1: Header Yayasan */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex-1 min-w-0 pr-0 lg:pr-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/40 text-[#065f32] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              {role === 'ADMIN' ? 'Superadmin • Yayasan Al-Basyariah' : 'Yayasan Al-Basyariah'}
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-xs font-medium text-text-muted">TA {academicYear?.name || 'Aktif'}</span>
            <span className="text-text-muted">•</span>
            <span className="text-xs font-bold text-text-main">Semua Unit</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-text-main tracking-tight">Dashboard Yayasan</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <Link
            href="/laporan"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#065f32] hover:bg-[#054d28] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
          >
            <FileText size={16} />
            <span>Laporan Konsolidasi</span>
          </Link>
          <Link
            href="/rekapitulasi-tunggakan"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border hover:bg-surface-hover text-text-main text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
          >
            <Wallet size={16} className="text-text-muted" />
            <span>Piutang SPP</span>
          </Link>
        </div>
      </div>

      {/* SECTION 2: Ringkasan Eksekutif */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight px-0.5">Ringkasan Eksekutif</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Kas Riil */}
          <Link 
            href="/kas-masuk"
            className="group bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-primary hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider group-hover:text-primary transition-colors">Total Kas Riil</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#065f32] dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Wallet size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(totalKasGlobal)}
                  className="text-primary font-black"
                  maxFontSize={28}
                  minFontSize={15}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">Akumulasi seluruh unit</p>
            </div>
          </Link>

          {/* Tile 2: Total Siswa */}
          <Link 
            href="/kelas"
            className="group bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-primary hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider group-hover:text-text-main transition-colors">Total Siswa</span>
              <div className="w-8 h-8 rounded-lg bg-bg text-text-muted flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">{formatNumber(muridCount)}</span>
                <span className="text-xs font-medium text-text-muted">Siswa</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">{formatNumber(rombelCount)} Rombel • {unitCount} Unit</p>
            </div>
          </Link>

          {/* Tile 3: Tenaga Pendidik */}
          <Link 
            href="/guru"
            className="group bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-primary hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider group-hover:text-text-main transition-colors">Tenaga Pendidik</span>
              <div className="w-8 h-8 rounded-lg bg-bg text-text-muted flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">{formatNumber(guruCount)}</span>
                <span className="text-xs font-medium text-text-muted">Guru</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Rasio 1 : {guruCount > 0 ? Math.round(muridCount / guruCount) : 0} Murid</p>
            </div>
          </Link>

          {/* Tile 4: Kolektibilitas */}
          <Link 
            href="/rekapitulasi-tunggakan"
            className="group bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-primary hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider group-hover:text-text-main transition-colors">Kolektibilitas SPP</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${isKolektibilitasSehat ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'}`}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${isKolektibilitasSehat ? 'text-text-main' : 'text-amber-600 dark:text-amber-400'}`}>
                  {kolektibilitas}%
                </span>
              </div>
              <p className="text-[11px] text-rose-600 font-medium mt-1 truncate">Sisa {formatCurrency(totalPiutangGlobal)}</p>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 3: Asymmetric 12-Col Split: Konsolidasi Arus Kas & Piutang Yayasan */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Arus Kas & Likuiditas Konsolidasi</h2>
          <p className="text-xs text-slate-500 mt-0.5">Analisis tren penerimaan kas lintas waktu dan unit prioritas penagihan piutang SPP.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: 7 Cols Interactive Cashflow Chart */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs h-full flex flex-col">
              <div className="mb-4">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-[#065f32] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 inline-block mb-1">
                  Arus Kas Masuk (Riil)
                </span>
                <h3 className="text-lg font-bold text-text-main">Penerimaan Kas Riil Konsolidasi</h3>
                <p className="text-xs text-text-muted">Pantau transaksi penerimaan kas riil (tunai & bank) yang telah diverifikasi per hari, minggu, bulan, atau distribusi per unit.</p>
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
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" />
                    Trend Arus Kas (6 Bulan)
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Perbandingan arus kas masuk riil vs pengeluaran operasional.</p>
                </div>
              </div>

              <div className="min-h-[220px] w-full mt-2">
                {arusKasTrend && arusKasTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={arusKasTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPemasukanYayasan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPengeluaranYayasan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-text-muted" />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        className="text-text-muted"
                        tickFormatter={(value) => `Rp${(value/1000000).toFixed(0)}Jt`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                      />
                      <Area type="monotone" name="Kas Masuk (Riil)" dataKey="pemasukan" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPemasukanYayasan)" />
                      <Area type="monotone" name="Kas Keluar (Operasional)" dataKey="pengeluaran" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPengeluaranYayasan)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-text-muted py-10">
                    Belum ada data transaksi keuangan tercatat
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-border mt-2 text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Kas Masuk (Riil)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Kas Keluar
                </span>
              </div>
            </div>

            {/* Card 2: Piutang Tertinggi Antar Unit */}
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600" />
                    Unit Prioritas Piutang SPP
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Daftar unit dengan akumulasi tagihan belum tertagih.</p>
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
                    <button 
                      key={idx}
                      type="button"
                      disabled={isSyncing}
                      onClick={() => handleDrilldownUnitTunggakan(unit.id)}
                      className="w-full flex justify-between items-center p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-[#065f32] hover:bg-slate-50 transition-colors group cursor-pointer text-left"
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
                    </button>
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

      {/* SECTION 4: Scorecard Matrix Komparasi Kinerja Antar Unit (SD, SMP, SMK) */}
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

        <div className={getScorecardGridClass(performaUnitData.length)}>
          {performaUnitData.map((item, idx) => {
            const kolektibilitasVal = typeof item.kolektibilitas === 'number' ? item.kolektibilitas : 0
            const isUnitSehat = item.status === 'sehat'
            const isUnitKritis = item.status === 'kritis'
            const avgPerRombel = item.rombel > 0 ? Math.round(item.siswa / item.rombel) : 0

            return (
              <div 
                key={idx} 
                className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-border mb-3.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-text-main tracking-tight">
                        {item.unit}
                      </h3>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      isUnitSehat 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        : isUnitKritis
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {item.status === 'sehat' ? 'Kinerja Sehat' : item.status === 'kritis' ? 'Audit Kritis' : 'Perlu Atensi'}
                    </span>
                  </div>

                  {/* 4 KPI Grid Per Unit */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                    <div className="bg-bg p-2.5 sm:p-3 rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Siswa</span>
                      <span className="text-lg sm:text-xl font-black text-text-main mt-0.5 block">{formatNumber(item.siswa)}</span>
                      <span className="text-[10px] text-text-muted font-medium block">{avgPerRombel} siswa/rombel</span>
                    </div>

                    <div className="bg-bg p-2.5 sm:p-3 rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Rombel Aktif</span>
                      <span className="text-lg sm:text-xl font-black text-text-main mt-0.5 block">{formatNumber(item.rombel)}</span>
                      <span className="text-[10px] text-text-muted font-medium block">Kelas Belajar</span>
                    </div>

                    <div className="bg-bg p-2.5 sm:p-3 rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Tenaga Guru</span>
                      <span className="text-lg sm:text-xl font-black text-text-main mt-0.5 block">{formatNumber(item.guru)}</span>
                      <span className="text-[10px] text-text-muted font-medium block">Pengajar Unit</span>
                    </div>

                    <div className="bg-bg p-2.5 sm:p-3 rounded-xl border border-border">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Kolektibilitas</span>
                      <span className={`text-lg sm:text-xl font-black mt-0.5 block ${isUnitSehat ? 'text-emerald-600 dark:text-emerald-400' : isUnitKritis ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {item.kolektibilitas === 'N/A' ? '-' : `${item.kolektibilitas}%`}
                      </span>
                      <span className="text-[10px] text-text-muted font-medium block">Realisasi SPP</span>
                    </div>
                  </div>

                  {/* Progress Kolektibilitas Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                      <span className="text-text-muted">Efektivitas Pelunasan</span>
                      <span className="font-bold text-text-main">{item.kolektibilitas === 'N/A' ? 'N/A' : `${item.kolektibilitas}%`}</span>
                    </div>
                    <div className="w-full bg-bg border border-border rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isUnitSehat ? 'bg-emerald-600 dark:bg-emerald-500' : isUnitKritis ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, kolektibilitasVal))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDrawerIndex(idx)
                      setIsDrawerOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 text-[#065f32] dark:text-emerald-300 text-[11px] sm:text-xs font-bold rounded-xl transition-all min-h-[44px] shadow-2xs group whitespace-nowrap min-w-0"
                    title={`Audit sebaran rombel & siswa ${item.unit}`}
                  >
                    <Layers size={14} className="text-[#065f32] dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Audit Rombel</span>
                    <ChevronRight size={13} className="text-[#065f32]/70 dark:text-emerald-400/70 shrink-0 group-hover:translate-x-0.5 transition-transform ml-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDrilldownUnitDashboard(item.id || item.raw?.id)}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2.5 bg-surface hover:bg-surface-hover border border-border hover:border-primary/50 text-text-main text-[11px] sm:text-xs font-bold rounded-xl transition-all min-h-[44px] shadow-2xs group whitespace-nowrap min-w-0"
                    title={`Buka dashboard ${item.unit}`}
                  >
                    <LayoutDashboard size={14} className="text-text-muted group-hover:text-primary shrink-0 transition-colors" />
                    <span className="truncate">Dashboard Unit</span>
                    <ChevronRight size={13} className="text-text-muted group-hover:text-primary shrink-0 group-hover:translate-x-0.5 transition-transform ml-auto" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 5: Mutu Kelembagaan & Kepatuhan Administrasi */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">Kepatuhan Administrasi & Mutu Kesiswaan</h2>
          <p className="text-xs text-text-muted mt-0.5">Distribusi sebaran tingkat kelas, demografi gender, dan radar kelengkapan data identitas peserta didik.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: 7 Cols Sebaran Tingkat Kelas Antar Unit */}
          <div className="lg:col-span-7 bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                  <Building size={18} className="text-primary" />
                  {selectedUnitDrillDown ? `Sebaran Tingkat Kelas: ${selectedUnitDrillDown.name}` : 'Distribusi Siswa per Unit Sekolah'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
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
                      const foundIdx = sortedUnitData.findIndex(u => u.name === selectedUnitDrillDown.name)
                      if (foundIdx !== -1) setSelectedDrawerIndex(foundIdx)
                      setIsDrawerOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#065f32] hover:bg-[#054d28] text-white text-xs font-bold rounded-xl transition-all shadow-xs min-h-[44px] sm:min-h-[36px]"
                  >
                    <Layers size={13} />
                    Buka Panel Rombel
                  </button>
                )}
                <Link
                  href="/kelas"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-bg border border-border hover:bg-surface-hover text-text-main text-xs font-bold rounded-xl transition-all shadow-xs min-h-[44px] sm:min-h-[36px]"
                >
                  Modul Kelas <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Unit Selector Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-border">
              <button
                type="button"
                onClick={() => setSelectedUnitDrillDown(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !selectedUnitDrillDown
                    ? 'bg-[#065f32] dark:bg-emerald-600 text-white shadow-2xs'
                    : 'bg-bg border border-border text-text-muted hover:text-text-main'
                }`}
              >
                Semua Unit (Konsolidasi)
              </button>
              {sortedUnitData.map((u, uIdx) => (
                <button
                  key={uIdx}
                  type="button"
                  onClick={() => setSelectedUnitDrillDown(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedUnitDrillDown?.name === u.name
                      ? 'bg-[#065f32] dark:bg-emerald-600 text-white shadow-2xs'
                      : 'bg-bg border border-border text-text-muted hover:text-text-main'
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-text-muted font-medium" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-text-muted font-medium" />
                      <Tooltip 
                        cursor={{ fill: 'currentColor', opacity: 0.06 }}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid var(--border-color)', 
                          backgroundColor: 'var(--surface)', 
                          color: 'var(--text-main)', 
                          boxShadow: 'var(--shadow-md)' 
                        }} 
                        formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                      />
                      <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                    <GraduationCap size={32} className="text-text-muted mb-2" />
                    <p className="text-sm font-semibold text-text-main">Belum Ada Data Tingkat Kelas</p>
                    <p className="text-xs text-text-muted mt-0.5">Tidak ditemukan sebaran kelas aktif pada unit ini.</p>
                  </div>
                )
              ) : sortedUnitData && sortedUnitData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedUnitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-text-muted font-medium" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} className="text-text-muted font-medium" />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.06 }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--surface)', 
                        color: 'var(--text-main)', 
                        boxShadow: 'var(--shadow-md)' 
                      }} 
                      formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                  <Users size={32} className="text-text-muted mb-2" />
                  <p className="text-sm font-semibold text-text-main">Belum Ada Data Siswa</p>
                  <p className="text-xs text-text-muted mt-0.5">Tambahkan data murid pada unit sekolah terlebih dahulu.</p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: 5 Cols Demografi Gender & Kepatuhan Data */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Demografi Gender */}
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-text-main text-base mb-1 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  Demografi Gender Siswa Yayasan
                </h3>
                <p className="text-xs text-text-muted">Komposisi murid laki-laki dan perempuan seluruh unit.</p>
              </div>

              <div className="my-5">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-text-muted">Laki-laki: <strong className="text-text-main">{formatNumber(maleCount)}</strong> ({malePercent}%)</span>
                  <span className="text-text-muted">Perempuan: <strong className="text-text-main">{formatNumber(femaleCount)}</strong> ({femalePercent}%)</span>
                </div>
                <div className="w-full h-3 bg-bg border border-border rounded-full overflow-hidden flex">
                  <div className="bg-[#065f32] dark:bg-emerald-500 h-full" style={{ width: `${malePercent}%` }} title={`Laki-laki: ${malePercent}%`} />
                  <div className="bg-slate-400 dark:bg-slate-600 h-full" style={{ width: `${femalePercent}%` }} title={`Perempuan: ${femalePercent}%`} />
                </div>
              </div>

              <div className="p-3 bg-bg rounded-xl border border-border flex items-center justify-between text-xs text-text-muted font-medium">
                <span>Rasio Keseimbangan L : P</span>
                <span className="font-bold text-text-main">{malePercent}% : {femalePercent}%</span>
              </div>
            </div>

            {/* Kepatuhan Identitas Siswa (NISN / NIK) */}
            <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text-main text-base flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary" />
                    Integritas Data Siswa
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">Audit kelengkapan nomor induk resmi (NISN / NIK / NIS).</p>
                </div>
              </div>

              {activeIncompleteData.length > 0 ? (
                <div className="space-y-2 mt-1">
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mb-1">Ditemukan Data Belum Lengkap:</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mb-2.5">
                      Beberapa siswa belum memiliki NISN/NIK valid. Koordinasikan dengan pihak Tata Usaha unit sekolah untuk pembaruan data Dapodik/EMIS.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeIncompleteData.map((d, idx) => (
                        <Link 
                          key={idx}
                          href="/kelas"
                          className="bg-surface border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] px-2.5 py-1 rounded-md font-bold shadow-2xs hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          {d.unitName}: {formatNumber(d.incompleteCount)} siswa →
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-[#065f32] dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#065f32] dark:text-emerald-400">Data Administrasi Lengkap</p>
                    <p className="text-[11px] text-text-muted mt-0.5">Seluruh peserta didik pada semua unit memiliki NISN & NIK yang tercatat rapi.</p>
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
        unitDataList={sortedUnitData}
        currentUnitIndex={selectedDrawerIndex}
        onSelectUnitIndex={setSelectedDrawerIndex}
      />

    </div>
  )
}
