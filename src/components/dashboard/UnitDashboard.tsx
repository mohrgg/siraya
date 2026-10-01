'use client'

import React, { useState } from "react"
import { 
  Users, GraduationCap, LayoutDashboard, AlertTriangle, 
  CheckCircle2, PlusCircle, ArrowRight, UserCheck, Activity,
  ShieldCheck, School, ChevronRight, ArrowLeft
} from "lucide-react"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, 
  LineChart, Line 
} from 'recharts'
import Link from 'next/link'
import PendapatanInteractiveChart from './PendapatanInteractiveChart'
import toast from "react-hot-toast"
import { AdaptiveValue } from "@/components/ui/AdaptiveValue"
import { sortSchoolClasses } from "@/lib/school-class-helpers"

// Brand disciplined palette: Al-Basyariah Forest Green (#065f32), Emerald, Slate, Amber
const BRAND_COLORS = ['#065f32', '#10b981', '#475569', '#d97706', '#0284c7', '#64748b']

interface UnitDashboardProps {
  role?: string
  unitName?: string
  totalMurid?: number
  totalRombel?: number
  totalGuru?: number
  rombelData?: Array<{ 
    id?: string;
    name: string; 
    tingkatName?: string | null;
    tingkatId?: string | null;
    total: number;
    genderDist?: Array<{ name: string; value: number; color?: string }>;
    topStudents?: Array<any>;
  }>
  genderData?: Array<{ name: string; value: number; color?: string }>
  guruStatusData?: Array<{ name: string; value: number; color?: string }>
  // Keuangan Unit
  penerimaanBulanIni?: number
  pengeluaranBulanIni?: number
  totalTagihanUnit?: number
  terbayarUnit?: number
  totalTunggakanUnit?: number
  capacityWarnings?: Array<any>
  tunggakanKritisList?: Array<any>
  pendapatanHariIniChart?: any[]
  pendapatanMingguIniChart?: any[]
  pendapatanBulanIniChart?: any[]
  trendData?: Array<{ year: string; total: number }>
  kolektibilitasUnit?: number | null
  incompleteDataCount?: number
}

export default function UnitDashboard(props: UnitDashboardProps) {
  const {
    role = 'TATA_USAHA',
    unitName = 'Unit Sekolah',
    totalMurid = 0,
    totalRombel = 0,
    totalGuru = 0,
    rombelData = [],
    genderData = [],
    guruStatusData = [],
    penerimaanBulanIni = 0,
    pengeluaranBulanIni = 0,
    totalTagihanUnit = 0,
    terbayarUnit = 0,
    totalTunggakanUnit = 0,
    capacityWarnings = [],
    tunggakanKritisList = [],
    pendapatanHariIniChart = [], pendapatanMingguIniChart = [], pendapatanBulanIniChart = [],
    trendData = [],
    kolektibilitasUnit = null,
    incompleteDataCount = 0
  } = props

  const [selectedRombelDrilldown, setSelectedRombelDrilldown] = useState<any>(null)
  const [selectedTingkatDrilldown, setSelectedTingkatDrilldown] = useState<string | null>(null)
  const [isOverCapacityFilterActive, setIsOverCapacityFilterActive] = useState<boolean>(false)

  // Helper untuk ekstraksi tingkat dari nama rombel (misal "X AK 1" -> "Kelas X", "71" -> "Kelas 7")
  const extractTingkat = React.useCallback((name: string): string => {
    if (!name) return 'Lainnya'
    const trimmed = name.trim()

    // 1. Cek format angka 2 digit SMP (71-79 -> Kelas 7, 81-89 -> Kelas 8, 91-99 -> Kelas 9)
    const matchSmp = trimmed.match(/^([7-9])\d\b/)
    if (matchSmp) {
      return `Kelas ${matchSmp[1]}`
    }

    // 2. Cek Angka Romawi (XII turun ke I)
    const matchRoman = trimmed.match(/^(XII|XI|X|VII|VIII|IX|VI|IV|V|I{1,3})\b/i)
    if (matchRoman) {
      return `Kelas ${matchRoman[1].toUpperCase()}`
    }

    // 3. Cek Angka Arab 1-12
    const matchNum = trimmed.match(/^([1-9]|1[0-2])\b/)
    if (matchNum) {
      return `Kelas ${matchNum[1]}`
    }

    return 'Lainnya'
  }, [])

  // Helper resolusi nama tingkat: utamakan relasi database resmi
  const getTingkatName = React.useCallback((r: { name: string; tingkatName?: string | null }): string => {
    return r.tingkatName || extractTingkat(r.name)
  }, [extractTingkat])

  // Agregasi per tingkat untuk Level 1 Bar Chart (Prioritaskan data resmi relasi tingkat dari DB)
  const tingkatAggregatedData = React.useMemo(() => {
    if (!rombelData || rombelData.length === 0) return []
    const map = new Map<string, {
      name: string
      tingkatId: string
      totalSiswa: number
      totalRombel: number
      overCapacityCount: number
      rombelList: typeof rombelData
    }>()

    rombelData.forEach(r => {
      const t = getTingkatName(r)
      const tId = r.tingkatName || t
      if (!map.has(t)) {
        map.set(t, { name: t, tingkatId: tId, totalSiswa: 0, totalRombel: 0, overCapacityCount: 0, rombelList: [] })
      }
      const entry = map.get(t)!
      entry.totalSiswa += r.total
      entry.totalRombel += 1
      entry.rombelList.push(r)
      if (r.total > 35) entry.overCapacityCount += 1
    })

    return Array.from(map.values())
      .map(entry => ({
        ...entry,
        rataRata: Math.round(entry.totalSiswa / (entry.totalRombel || 1))
      }))
      .sort((a, b) => sortSchoolClasses(a.name, b.name))
  }, [rombelData, getTingkatName])

  // Opsi Tingkat dinamis dari data riil rombel untuk selector cepat
  const tingkatOptions = React.useMemo(() => {
    return tingkatAggregatedData.map(t => ({ id: t.tingkatId, label: t.name, count: t.totalRombel }))
  }, [tingkatAggregatedData])

  // Data Rombel aktif di Level 2 (Berdasarkan tingkat yang dipilih atau filter over-kapasitas)
  const activeLevel2Rombel = React.useMemo(() => {
    if (!rombelData) return []
    let list = rombelData
    if (selectedTingkatDrilldown) {
      list = list.filter(r => getTingkatName(r) === selectedTingkatDrilldown || r.tingkatId === selectedTingkatDrilldown)
    }
    if (isOverCapacityFilterActive) {
      list = list.filter(r => r.total > 35)
    }
    return list
  }, [rombelData, selectedTingkatDrilldown, isOverCapacityFilterActive, getTingkatName])

  const overCapacityCount = React.useMemo(() => {
    return rombelData.filter(r => r.total > 35).length
  }, [rombelData])

  // Helper render label badge untuk batas ideal pada reference line (anti-tertindih bar)
  const renderIdealLimitBadge = (labelTxt: string) => (props: any) => {
    const { viewBox } = props
    if (!viewBox) return null
    const { x, y, width } = viewBox
    const badgeWidth = labelTxt.length > 18 ? 128 : 108
    const badgeHeight = 20
    const badgeX = x + width - badgeWidth - 4
    const badgeY = y - 10

    return (
      <g>
        <rect
          x={badgeX}
          y={badgeY}
          width={badgeWidth}
          height={badgeHeight}
          rx={5}
          fill="#ffffff"
          stroke="#f87171"
          strokeWidth={1}
        />
        <text
          x={badgeX + badgeWidth / 2}
          y={badgeY + badgeHeight / 2}
          fill="#dc2626"
          fontSize={10}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {labelTxt}
        </text>
      </g>
    )
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => `Rp ${new Intl.NumberFormat('id-ID').format(num || 0)}`

  const handleQuickAction = (actionName: string) => {
    toast.success(`Membuka fitur: ${actionName}`)
  }

  // Harmonized gender chart colors
  const refinedGenderData = React.useMemo(() => {
    return genderData.map(g => {
      const isMale = g.name.toLowerCase().includes('laki')
      return {
        ...g,
        color: isMale ? '#065f32' : '#10b981'
      }
    })
  }, [genderData])

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* SECTION 1: Header Hero & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 sm:p-6 rounded-2xl border border-border shadow-2xs">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
              {role === 'ADMIN' ? 'Superadmin • Supervisi Unit' : 'Tata Usaha • Operasional Unit'}
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-xs font-bold text-text-main flex items-center gap-1">
              <School size={13} className="text-[#065f32]" />
              {unitName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">
            Dashboard Unit
          </h1>
        </div>

        {/* Role Quick Action Button */}
        {role === 'TATA_USAHA' ? (
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <Link
              href="/kelas"
              onClick={() => handleQuickAction('Kelola Kelas & Murid')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all duration-200 whitespace-nowrap min-h-[44px]"
            >
              <PlusCircle size={16} />
              <span>Kelola Kelas & Murid</span>
            </Link>
          </div>
        ) : (
          <div className="px-3.5 py-2 bg-bg rounded-xl border border-border text-xs font-bold text-text-muted shrink-0 self-start md:self-center whitespace-nowrap flex items-center gap-1.5 min-h-[44px]">
            <ShieldCheck size={16} className="text-primary" />
            <span>Mode Supervisi (Read-Only)</span>
          </div>
        )}
      </div>

      {/* SECTION 2: Overview KPI Cards */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight px-0.5">Overview Unit</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Siswa Aktif */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text-muted">Total Siswa</span>
              <div className="w-8 h-8 bg-emerald-50 text-[#065f32] border border-emerald-100/80 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight truncate max-w-full" title={formatNumber(totalMurid)}>{formatNumber(totalMurid)}</span>
                <span className="text-xs font-medium text-text-muted shrink-0">Siswa</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Status Aktif</p>
            </div>
          </div>

          {/* Card 2: Rombel */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text-muted">Rombel</span>
              <div className="w-8 h-8 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-lg flex items-center justify-center shrink-0">
                <LayoutDashboard size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight truncate max-w-full" title={formatNumber(totalRombel)}>{formatNumber(totalRombel)}</span>
                <span className="text-xs font-medium text-text-muted shrink-0">Kelas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Rombel Aktif</p>
            </div>
          </div>

          {/* Card 3: Tenaga Pendidik */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-text-muted">Tenaga Pendidik</span>
              <div className="w-8 h-8 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight truncate max-w-full" title={formatNumber(totalGuru)}>{formatNumber(totalGuru)}</span>
                <span className="text-xs font-medium text-text-muted shrink-0">Guru</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Guru Bertugas</p>
            </div>
          </div>

          {/* Card 4: Total Piutang Unit */}
          <div className="bg-surface rounded-2xl border border-rose-200/90 p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-700">Total Piutang Unit</span>
              <div className="w-8 h-8 bg-rose-50 text-rose-700 border border-rose-200/70 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(totalTunggakanUnit)}
                  className="text-rose-700"
                  maxFontSize={28}
                  minFontSize={15}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Tagihan Belum Lunas</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Keuangan Unit (Arus Kas Riil vs Proyeksi Tagihan & Sisa Piutang) */}
      <section className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-0.5 px-1 mt-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">Keuangan Unit</h2>
          <p className="text-xs text-text-muted">Realisasi kas masuk nyata, proyeksi tagihan diterbitkan, dan rasio efektivitas penagihan piutang.</p>
        </div>

        {/* 3 KPI Cards: Arus Kas Riil vs Proyeksi Tagihan vs Sisa Piutang */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Realisasi Kas Masuk (Riil) */}
          <div className="bg-surface rounded-2xl border border-emerald-200/90 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Arus Kas Masuk (Bulan Ini)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Uang Kas Riil
                </span>
              </div>
              <div className="my-1">
                <AdaptiveValue 
                  value={formatCurrency(penerimaanBulanIni)}
                  className="text-emerald-800 font-black"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
            </div>
            <p className="text-xs text-emerald-700/80 mt-2 font-medium">Realisasi pembayaran tunai & bank yang telah diverifikasi</p>
          </div>
          
          {/* Card 2: Proyeksi Target Tagihan (Billing) */}
          <div className="bg-surface rounded-2xl border border-blue-200/90 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Target Tagihan (Tahun Ini)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Proyeksi Invoice
                </span>
              </div>
              <div className="my-1">
                <AdaptiveValue 
                  value={formatCurrency(totalTagihanUnit)}
                  className="text-blue-900 font-black"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
            </div>
            <p className="text-xs text-blue-700/80 mt-2 font-medium">Total kewajiban biaya pendidikan yang diterbitkan</p>
          </div>

          {/* Card 3: Sisa Piutang / Tunggakan */}
          <div className="bg-surface rounded-2xl border border-rose-200/90 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Sisa Piutang (Tunggakan)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Belum Tertagih
                </span>
              </div>
              <div className="my-1">
                <AdaptiveValue 
                  value={formatCurrency(totalTunggakanUnit)}
                  className="text-rose-700 font-black"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
            </div>
            <p className="text-xs text-rose-600/80 mt-2 font-medium">Akumulasi tunggakan siswa yang belum lunas</p>
          </div>
        </div>

        {/* Visual Reconciliation Bar: Rasio Realisasi Kas Masuk vs Proyeksi Tagihan */}
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-black text-sm">
              {kolektibilitasUnit === null ? 'N/A' : `${kolektibilitasUnit}%`}
            </div>
            <div>
              <div className="text-xs font-bold text-text-main flex items-center gap-2">
                <span>Efektivitas Penagihan Tagihan (Kolektibilitas)</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  kolektibilitasUnit && kolektibilitasUnit >= 80 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {kolektibilitasUnit && kolektibilitasUnit >= 80 ? 'Kolektibilitas Sehat' : 'Perlu Atensi'}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Dari total proyeksi tagihan {formatCurrency(totalTagihanUnit)}, sebesar {formatCurrency(terbayarUnit)} ({kolektibilitasUnit || 0}%) telah terealisasi masuk kas.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72 shrink-0 flex flex-col gap-1.5">
            <div className="h-3 w-full bg-rose-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, kolektibilitasUnit || 0))}%` }}
                title={`Terbayar: ${kolektibilitasUnit || 0}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-medium">
              <span className="text-emerald-700 font-bold">● Kas Masuk {kolektibilitasUnit || 0}%</span>
              <span className="text-rose-600 font-bold">● Piutang {100 - (kolektibilitasUnit || 0)}%</span>
            </div>
          </div>
        </div>

        {/* Trend Pendapatan & Tunggakan Kritis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-h-[420px]">
            <PendapatanInteractiveChart 
              hariIniData={pendapatanHariIniChart}
              mingguIniData={pendapatanMingguIniChart}
              bulanIniData={pendapatanBulanIniChart}
            />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs flex flex-col justify-between min-h-[420px]">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3 shrink-0">
                <h3 className="font-bold text-text-main text-lg flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-600" />
                  <span>Tunggakan Kritis</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Prioritas
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                {tunggakanKritisList && tunggakanKritisList.length > 0 ? (
                  tunggakanKritisList.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-text-main truncate">{item.murid?.name}</p>
                        <p className="text-[11px] text-text-muted font-mono mt-0.5">NIS: {item.murid?.nis}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="bg-surface border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.akun?.nama}</span>
                          <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[10px] font-extrabold">{formatCurrency(item.sisaTagihan)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/laporan/tunggakan-siswa`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-700 hover:bg-rose-100/80 rounded-xl transition-colors shrink-0 cursor-pointer"
                        title="Tindak Lanjut"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-text-muted text-xs">
                    <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-text-main">Tidak Ada Tunggakan Kritis</p>
                    <p className="text-[11px] mt-0.5">Seluruh tagihan unit tertagih dengan baik.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Statistik Akademik (Data-Density Proportionate Layout) */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 px-1 mt-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">Statistik Akademik</h2>
          <p className="text-xs text-text-muted">Distribusi kapasitas rombel belajar, komposisi gender, dan riwayat pertumbuhan siswa.</p>
        </div>

        {/* CARD 1: Kepadatan Siswa per Rombel (2-Level Interactive Drill-Down Bar Chart - 100% Fit, Bebas Potong) */}
        <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs flex flex-col min-h-[460px]">
          {/* Card Header with Breadcrumb, Legend & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-3 mb-3 pb-3 border-b border-border">
            <div className="min-w-0 flex-1">
              {/* Breadcrumb Navigasi */}
              {selectedRombelDrilldown ? (
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1 font-medium">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedRombelDrilldown(null); setSelectedTingkatDrilldown(null); setIsOverCapacityFilterActive(false); }}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    Semua Tingkat
                  </button>
                  <ChevronRight size={12} className="text-text-muted" />
                  <button 
                    type="button" 
                    onClick={() => {
                      const tName = selectedRombelDrilldown.tingkatName || extractTingkat(selectedRombelDrilldown.name);
                      setSelectedTingkatDrilldown(tName);
                      setSelectedRombelDrilldown(null);
                    }}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {selectedRombelDrilldown.tingkatName || extractTingkat(selectedRombelDrilldown.name)}
                  </button>
                  <ChevronRight size={12} className="text-text-muted" />
                  <span className="font-bold text-text-main">{selectedRombelDrilldown.name}</span>
                </div>
              ) : selectedTingkatDrilldown || isOverCapacityFilterActive ? (
                <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1 font-medium">
                  <button 
                    type="button" 
                    onClick={() => { setSelectedTingkatDrilldown(null); setIsOverCapacityFilterActive(false); }}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    Semua Tingkat
                  </button>
                  <ChevronRight size={12} className="text-text-muted" />
                  <span className="font-bold text-text-main">
                    {isOverCapacityFilterActive && !selectedTingkatDrilldown
                      ? `Rombel Over-Kapasitas (${activeLevel2Rombel.length})`
                      : `${selectedTingkatDrilldown} (${activeLevel2Rombel.length} Rombel)`}
                  </span>
                </div>
              ) : null}

              <h3 className="font-bold text-text-main text-lg flex items-center gap-2">
                <Users size={18} className="text-[#065f32]" />
                <span>Kepadatan Siswa per Rombel</span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {selectedRombelDrilldown 
                  ? `Detail statistik siswa dan komposisi kelas ${selectedRombelDrilldown.name}.`
                  : selectedTingkatDrilldown || isOverCapacityFilterActive
                  ? `Rincian kapasitas rombel pada tingkat terpilih. Klik salah satu bar untuk detail siswa.`
                  : `Tingkat agregasi sekolah. Klik salah satu bar tingkat untuk zoom-in ke rombel masing-masing (Standar Permendikbud: 20 – 35 siswa/rombel).`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-nowrap self-start sm:self-center">
              {/* Legend Ringkas */}
              <div className="hidden sm:flex items-center gap-2.5 mr-1 text-[11px] font-medium text-text-muted shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#065f32]"></span> Ideal (20-35)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span> Over (&gt;35)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Minim (&lt;20)
                </span>
              </div>

              {/* Alert Overcapacity Filter Button */}
              {overCapacityCount > 0 && !selectedRombelDrilldown && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOverCapacityFilterActive(!isOverCapacityFilterActive)
                    if (!isOverCapacityFilterActive) {
                      setSelectedTingkatDrilldown(null)
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isOverCapacityFilterActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                  title="Klik untuk menyaring hanya rombel yang over-kapasitas"
                >
                  <AlertTriangle size={13} />
                  <span>{overCapacityCount} Over-Kapasitas</span>
                </button>
              )}

              {/* Back Button */}
              {selectedRombelDrilldown ? (
                <button
                  type="button"
                  onClick={() => setSelectedRombelDrilldown(null)}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-bg text-text-main font-semibold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] shrink-0 cursor-pointer"
                  title={`Kembali ke ${selectedTingkatDrilldown || 'Daftar Rombel'}`}
                >
                  <ArrowLeft size={14} className="shrink-0 text-text-muted group-hover:text-text-main transition-colors" />
                  <span>Kembali</span>
                </button>
              ) : (selectedTingkatDrilldown || isOverCapacityFilterActive) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTingkatDrilldown(null)
                    setIsOverCapacityFilterActive(false)
                  }}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-bg text-text-main font-semibold text-xs transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] shrink-0 cursor-pointer"
                  title="Kembali ke Semua Tingkat"
                >
                  <ArrowLeft size={14} className="shrink-0 text-text-muted group-hover:text-text-main transition-colors" />
                  <span>Kembali</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Quick Filter Tingkat Tabs */}
          {!selectedRombelDrilldown && tingkatOptions.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 select-none custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setSelectedTingkatDrilldown(null)
                  setIsOverCapacityFilterActive(false)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedTingkatDrilldown === null && !isOverCapacityFilterActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-bg text-text-muted hover:text-text-main border border-border'
                }`}
              >
                Semua Tingkat ({tingkatAggregatedData.length})
              </button>

              {tingkatOptions.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTingkatDrilldown(t.id)
                    setIsOverCapacityFilterActive(false)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedTingkatDrilldown === t.id && !isOverCapacityFilterActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-bg text-text-muted hover:text-text-main border border-border'
                  }`}
                >
                  {t.label} ({t.count} Kelas)
                </button>
              ))}
            </div>
          )}

          {/* Canvas Area: Level 3 (Student Detail), Level 2 (Rombel Detail), Level 1 (Tingkat Overview) */}
          <div className="flex-1 w-full min-h-0">
            {selectedRombelDrilldown ? (
              /* LEVEL 3: Detail Siswa & Komposisi Gender */
              <div className="h-full flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex-1 min-w-[200px] flex flex-col items-center justify-center bg-bg rounded-xl p-4 border border-border">
                  <h4 className="text-sm font-bold text-text-main mb-2">Komposisi Gender Kelas {selectedRombelDrilldown.name}</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={selectedRombelDrilldown.genderDist || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {(selectedRombelDrilldown.genderDist || []).map((entry: any, index: number) => {
                          const isMale = entry.name?.toLowerCase().includes('laki')
                          return (
                            <Cell key={`cell-${index}`} fill={isMale ? '#065f32' : '#10b981'} />
                          )
                        })}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} Siswa`, 'Jumlah']} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col bg-bg rounded-xl p-4 border border-border overflow-hidden">
                  <h4 className="text-sm font-bold text-text-main mb-3 flex items-center justify-between">
                    <span>Daftar Siswa (Sampel)</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-[#065f32] border border-emerald-200 rounded-full">{selectedRombelDrilldown.total} Total</span>
                  </h4>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[220px] custom-scrollbar">
                    {selectedRombelDrilldown.topStudents && selectedRombelDrilldown.topStudents.length > 0 ? (
                      selectedRombelDrilldown.topStudents.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-border shadow-2xs">
                          <span className="text-xs font-semibold text-text-main line-clamp-1">{s.name}</span>
                          <span className="text-[10px] text-text-muted font-mono bg-bg px-2 py-0.5 rounded border border-border">{s.gender}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-center text-text-muted py-6">Data siswa tidak tersedia</div>
                    )}
                  </div>
                  {selectedRombelDrilldown.id && (
                    <Link 
                      href={`/kelas`}
                      className="mt-3 w-full flex items-center justify-center py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-primary hover:bg-slate-50 transition-colors min-h-[44px] shadow-2xs"
                    >
                      Kelola Kelas di Modul Akademik
                    </Link>
                  )}
                </div>
              </div>
            ) : selectedTingkatDrilldown !== null || isOverCapacityFilterActive ? (
              /* LEVEL 2: Bar Chart Rombel di Tingkat Terpilih (Full-Width, 100% Fit) */
              <div className="h-[340px] w-full min-h-[300px]">
                {activeLevel2Rombel.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activeLevel2Rombel}
                      margin={{ top: 20, right: 20, left: -10, bottom: 40 }}
                      onClick={(state: any) => {
                        if (state && state.activePayload && state.activePayload.length > 0) {
                          setSelectedRombelDrilldown(state.activePayload[0].payload)
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: 'currentColor' }} 
                        className="text-text-muted font-medium" 
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={45}
                      />
                      <YAxis 
                        domain={[0, (dataMax: number) => Math.max(40, dataMax + 5)]} 
                        tick={{ fontSize: 11, fill: 'currentColor' }} 
                        className="text-text-muted font-medium" 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const isOver = data.total > 35
                            const isUnder = data.total < 20
                            return (
                              <div className="bg-surface p-3 rounded-xl border border-border shadow-md text-xs">
                                <p className="font-bold text-text-main text-sm mb-1">{data.name}</p>
                                <p className="flex items-center justify-between gap-4 text-text-muted">
                                  <span>Total Siswa:</span>
                                  <span className="font-black text-text-main text-sm">{data.total} Siswa</span>
                                </p>
                                <p className="flex items-center justify-between gap-4 text-text-muted mt-1">
                                  <span>Status Kapasitas:</span>
                                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                    isOver ? 'bg-rose-100 text-rose-700' : isUnder ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {isOver ? 'Over-Kapasitas (>35)' : isUnder ? 'Di Bawah Standar (<20)' : 'Ideal'}
                                  </span>
                                </p>
                                <p className="text-[10px] text-primary font-semibold mt-2 pt-1 border-t border-border/60">
                                  💡 Klik bar untuk melihat sampel siswa
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="total" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      >
                        {activeLevel2Rombel.map((entry, index) => {
                          const isOver = entry.total > 35
                          const isUnder = entry.total < 20
                          return (
                            <Cell 
                              key={`cell-rombel-${index}`} 
                              fill={isOver ? '#e11d48' : isUnder ? '#f59e0b' : '#065f32'} 
                              className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                              onClick={() => setSelectedRombelDrilldown(entry)}
                            />
                          )
                        })}
                      </Bar>
                      <ReferenceLine 
                        y={35} 
                        stroke="#dc2626" 
                        strokeDasharray="4 4" 
                        label={renderIdealLimitBadge('Batas Ideal (35)')} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                    <LayoutDashboard size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-text-muted">Tidak Ada Rombel yang Sesuai Filter</p>
                  </div>
                )}
              </div>
            ) : (
              /* LEVEL 1: Bar Chart Tingkat Overview (Agregasi Sekolah) */
              <div className="h-[340px] w-full min-h-[300px]">
                {tingkatAggregatedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tingkatAggregatedData}
                      margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                      onClick={(state: any) => {
                        if (state && state.activePayload && state.activePayload.length > 0) {
                          const clickedTingkat = state.activePayload[0].payload.tingkatId
                          setSelectedTingkatDrilldown(clickedTingkat)
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 13, fill: 'currentColor' }} 
                        className="text-text-main font-bold" 
                      />
                      <YAxis 
                        domain={[0, 45]} 
                        tick={{ fontSize: 11, fill: 'currentColor' }} 
                        className="text-text-muted font-medium" 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-surface p-3 rounded-xl border border-border shadow-md text-xs min-w-[210px]">
                                <p className="font-bold text-text-main text-sm mb-1">{data.name}</p>
                                <div className="space-y-1 my-2">
                                  <p className="flex items-center justify-between text-text-muted">
                                    <span>Rata-Rata Siswa/Kelas:</span>
                                    <span className="font-bold text-text-main">{data.rataRata} Siswa</span>
                                  </p>
                                  <p className="flex items-center justify-between text-text-muted">
                                    <span>Total Seluruh Siswa:</span>
                                    <span className="font-bold text-text-main">{formatNumber(data.totalSiswa)} Siswa</span>
                                  </p>
                                  <p className="flex items-center justify-between text-text-muted">
                                    <span>Jumlah Rombel:</span>
                                    <span className="font-bold text-text-main">{data.totalRombel} Rombel</span>
                                  </p>
                                  {data.overCapacityCount > 0 && (
                                    <p className="flex items-center justify-between text-rose-700 font-semibold pt-1 border-t border-border/50">
                                      <span>Over-Kapasitas (&gt;35):</span>
                                      <span className="bg-rose-100 px-1.5 py-0.5 rounded text-[10px]">{data.overCapacityCount} Rombel</span>
                                    </p>
                                  )}
                                </div>
                                <p className="text-[10px] text-primary font-bold mt-2 pt-1.5 border-t border-border/60 flex items-center gap-1">
                                  <span>🔍 Klik bar tingkat ini untuk rincian kelas</span>
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar 
                        dataKey="rataRata" 
                        radius={[8, 8, 0, 0]}
                        maxBarSize={64}
                      >
                        {tingkatAggregatedData.map((entry, index) => {
                          const isOver = entry.rataRata > 35
                          return (
                            <Cell 
                              key={`cell-tingkat-${index}`} 
                              fill={isOver ? '#e11d48' : '#065f32'} 
                              className="transition-all duration-300 hover:opacity-85 hover:brightness-110 cursor-pointer"
                              onClick={() => setSelectedTingkatDrilldown(entry.tingkatId)}
                            />
                          )
                        })}
                      </Bar>
                      <ReferenceLine 
                        y={35} 
                        stroke="#dc2626" 
                        strokeDasharray="4 4" 
                        label={renderIdealLimitBadge('Batas Ideal (35 Siswa)')} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                    <LayoutDashboard size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-text-muted">Tidak Ada Data Rombel Tersedia</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Guide & Status Hierarchy */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50 text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-text-main">Hierarki Navigasi:</span>
              {selectedRombelDrilldown ? (
                <span>Level 3 (Detail Sampel Murid {selectedRombelDrilldown.name})</span>
              ) : selectedTingkatDrilldown || isOverCapacityFilterActive ? (
                <span>Level 2 (Rincian Kelas {selectedTingkatDrilldown || 'Over-Kapasitas'} — {activeLevel2Rombel.length} Rombel Full-Width)</span>
              ) : (
                <span>Level 1 (Ringkasan per Tingkat — {tingkatAggregatedData.length} Tingkat)</span>
              )}
            </div>
            {!selectedRombelDrilldown && (
              <span className="text-primary font-medium">
                {selectedTingkatDrilldown || isOverCapacityFilterActive 
                  ? "💡 Klik salah satu bar rombel untuk melihat komposisi siswa"
                  : "💡 Klik salah satu batang tingkat untuk rincian kelas per tingkat"}
              </span>
            )}
          </div>
        </div>

        {/* ROW 2: Demografi Gender (50%) & Trend Siswa Baru (50%) Berdampingan Seimbang */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Demografi Gender */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs flex flex-col justify-between min-h-[380px]">
            <div>
              <h3 className="font-bold text-text-main text-lg flex items-center gap-2 mb-1">
                <Users size={20} className="text-[#065f32]" />
                <span>Demografi Gender</span>
              </h3>
              <p className="text-xs text-text-muted">Perbandingan siswa laki-laki dan perempuan di unit ini.</p>
            </div>

            <div className="flex-1 min-h-[200px] my-3 flex items-center justify-center">
              {refinedGenderData && refinedGenderData.length > 0 && refinedGenderData.some(d => d.value > 0) ? (
                <div className="w-full flex flex-col items-center">
                  <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={refinedGenderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {refinedGenderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px 0 rgb(0 0 0 / 0.05)' }} 
                          formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-3 px-2">
                    {refinedGenderData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span className="text-text-muted">{d.name} <span className="font-bold text-text-main">({formatNumber(d.value)})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-text-muted">Belum ada data</div>
              )}
            </div>

            <div className="p-3 bg-bg rounded-xl border border-border flex items-center justify-between text-xs font-medium text-text-muted">
              <span>Rasio Unit L:P</span>
              <span className="font-bold text-text-main">
                {(() => {
                  const l = genderData.find(g => g.name.toLowerCase().includes('laki'))?.value || 0;
                  const p = genderData.find(g => g.name.toLowerCase().includes('perempuan'))?.value || 0;
                  return (l > 0 || p > 0) ? `${Math.round((l / (l + p)) * 100)}% : ${Math.round((p / (l + p)) * 100)}%` : '-';
                })()}
              </span>
            </div>
          </div>

          {/* Card B: Trend Pertumbuhan Siswa Baru */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs flex flex-col justify-between min-h-[380px]">
            <div>
              <h3 className="font-bold text-text-main text-lg flex items-center gap-2 mb-1">
                <Activity size={18} className="text-[#065f32]" />
                <span>Trend Pertumbuhan Siswa Baru</span>
              </h3>
              <p className="text-xs text-text-muted">Pertumbuhan penerimaan siswa 3 tahun terakhir.</p>
            </div>

            <div className="w-full my-3 h-[220px] min-h-[220px]">
              {trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                      formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Siswa Baru']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#065f32" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#065f32' }} 
                      activeDot={{ r: 6, fill: '#065f32' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-bg rounded-xl border border-dashed border-border">
                  <p className="text-sm font-semibold text-text-muted">Belum Ada Data Trend</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-bg rounded-xl border border-border flex items-center justify-between text-xs font-medium text-text-muted">
              <span>Status Trend</span>
              <span className="font-bold text-emerald-700">Tahun Akademik Berjalan</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Sumber Daya Manusia */}
      <section className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-0.5 px-1 mt-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">Sumber Daya Manusia</h2>
          <p className="text-xs text-text-muted">Status kepegawaian tenaga pendidik dan rasio bimbingan siswa per guru.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guru Status Table */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-2xs flex flex-col lg:col-span-2 min-h-[350px]">
            <h3 className="font-bold text-text-main text-lg flex items-center gap-2 mb-4 border-b border-border pb-3">
              <UserCheck size={18} className="text-[#065f32]" />
              <span>Komposisi Guru / Pegawai</span>
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {(() => {
                const totalGuruPgw = guruStatusData?.reduce((sum, item) => sum + item.value, 0) || 0;
                if (!guruStatusData || guruStatusData.length === 0 || totalGuruPgw === 0) {
                  return <div className="flex items-center justify-center h-full text-xs text-text-muted">Belum ada data status kepegawaian</div>;
                }
                
                // Urutkan dari jumlah terbanyak
                const sortedData = [...guruStatusData].sort((a, b) => b.value - a.value);

                return (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-bg/60 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider">Status Kepegawaian</th>
                          <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider text-right w-24">Jumlah</th>
                          <th className="px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wider text-right w-24">Persentase</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sortedData.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 text-text-main font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}></div>
                                <span>{d.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-text-main text-right font-semibold">{formatNumber(d.value)}</td>
                            <td className="px-4 py-3 text-text-muted text-right">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-bg text-[11px] font-bold border border-border">
                                {Math.round((d.value / totalGuruPgw) * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Rasio Guru:Siswa (Solid Matte Card, No Blur Orb) */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-2xs flex flex-col items-center justify-center text-center min-h-[350px]">
            <div className="w-16 h-16 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-2xl flex items-center justify-center mb-5">
              <Users size={30} />
            </div>
            <h3 className="text-text-muted font-bold uppercase tracking-widest text-xs mb-2">Rasio Guru : Siswa</h3>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-black text-amber-700">1</span>
              <span className="text-3xl font-bold text-gray-300">:</span>
              <span className="text-5xl font-black text-text-main">{totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0}</span>
            </div>
            <p className="text-xs text-text-muted mt-4 max-w-[220px] leading-relaxed">
              Setiap 1 Guru Aktif rata-rata menangani {totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0} Siswa Aktif di unit ini.
            </p>
          </div>
        </div>
      </section>



      {/* SECTION 6: Peringatan Data Tidak Lengkap */}
      {incompleteDataCount > 0 && (
        <section className="flex flex-col gap-3.5 mt-2">
          <div className="flex flex-col gap-0.5 px-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">Peringatan Integritas Data</h2>
            <p className="text-xs text-text-muted">Notifikasi kelengkapan identitas Dapodik/EMIS peserta didik pada unit ini.</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 border border-amber-200/80 text-amber-800 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm">Data Peserta Didik Belum Lengkap</h3>
                <p className="text-xs text-amber-800/90 mt-1">
                  Terdapat <span className="font-black text-amber-950">{incompleteDataCount} data siswa</span> pada {unitName} yang belum memiliki kelengkapan NIS / NISN / NIK resmi.
                </p>
              </div>
            </div>
            <Link
              href="/kelas"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <span>Perbarui Data Murid</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
