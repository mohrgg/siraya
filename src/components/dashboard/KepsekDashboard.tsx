'use client'

import { 
  Users, LayoutDashboard, GraduationCap, CheckCircle2, 
  TrendingUp, TrendingDown, Wallet, Award, FileText, 
  ArrowUpRight, BarChart3, AlertTriangle, ShieldCheck
} from "lucide-react"
import { 
  ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import Link from "next/link"
import PendapatanInteractiveChart from './PendapatanInteractiveChart'
import { AdaptiveValue } from "@/components/ui/AdaptiveValue"

export default function KepsekDashboard(props: any) {
  const { 
    activeUnit, activeYear, totalMurid = 0, totalRombel = 0, totalGuru = 0,
    incomeData = [], topCrowded = [], topEmpty = [],
    jenjangData = [],
    // Keuangan
    penerimaanBulanIni = 0, pengeluaranBulanIni = 0, saldoBulanIni = 0,
    alokasiPengeluaran = [], 
    totalTagihanUnit = 0, totalSisaTagihanUnit = 0, kolektibilitasPersen = null,
    pendapatanHariIniChart = [], pendapatanMingguIniChart = [], pendapatanBulanIniChart = []
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  // Hitung metrik turunan eksekutif
  const avgPerRombel = totalRombel > 0 ? Math.round(totalMurid / totalRombel) : 0
  const ratioGuru = totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0
  
  const displayKolektibilitas = kolektibilitasPersen !== null 
    ? kolektibilitasPersen 
    : (totalTagihanUnit > 0 ? Math.round(((totalTagihanUnit - totalSisaTagihanUnit) / totalTagihanUnit) * 100) : 100)
  const isKolektibilitasSehat = displayKolektibilitas >= 80

  const hasCrowded = topCrowded && topCrowded.length > 0 && topCrowded[0]?.total > 36
  const hasMajors = activeUnit?.level === 'SMK' || activeUnit?.level === 'SMA'

  // Total Realisasi Tagihan Lunas
  const totalLunas = totalTagihanUnit - totalSisaTagihanUnit

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300 max-w-[1600px] mx-auto w-full">
      {/* SECTION 1: Header Komando Eksekutif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-50 text-[#065f32] border border-emerald-200/80">
              Kepala Sekolah • Pimpinan Unit
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Tahun Akademik: {activeYear?.name || 'Aktif'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-800">{activeUnit?.name || 'Unit Sekolah'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Eksekutif Unit</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluasi mutu kesiswaan, kepatuhan daya tampung rombel, dan stabilitas operasional {activeUnit?.name || 'Unit Sekolah'}.
          </p>
        </div>

        {/* Action Buttons (Kontekstual & Relevan Eksekutif) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          <Link
            href="/kelas"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#065f32] hover:bg-[#054d28] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <LayoutDashboard size={16} />
            Kapasitas Rombel
          </Link>
          <Link
            href="/rekapitulasi-tunggakan"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <Wallet size={16} />
            Monitoring SPP
          </Link>
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <FileText size={16} />
            Pusat Laporan
          </Link>
          {hasMajors && (
            <Link
              href="/jurusan"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Award size={16} />
              Jurusan
            </Link>
          )}
        </div>
      </div>

      {/* SECTION 2: Executive Pulse (Hero Telemetry Strip) */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Overview Eksekutif Unit</h2>
          <p className="text-xs text-slate-500 mt-0.5">Indikator vital mutu kesiswaan, rasio pendidik, dan kolektibilitas unit sekolah.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Tile 1: Total Siswa Aktif */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <GraduationCap size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{formatNumber(totalMurid)}</span>
                <span className="text-xs font-semibold text-slate-600">Peserta Didik</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif Terdaftar
                </span>
              </div>
            </div>
          </div>

          {/* Tile 2: Kapasitas Rombel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rombongan Belajar</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <LayoutDashboard size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{formatNumber(totalRombel)}</span>
                <span className="text-xs font-semibold text-slate-600">Kelas</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                  avgPerRombel >= 20 && avgPerRombel <= 36 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Rata-rata {avgPerRombel} Siswa/Kelas
                </span>
              </div>
            </div>
          </div>

          {/* Tile 3: Rasio Pendidik */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenaga Pendidik</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">1 : {ratioGuru}</span>
                <span className="text-xs font-semibold text-slate-600">Rasio Murid</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {formatNumber(totalGuru)} Guru Bertugas
                </span>
              </div>
            </div>
          </div>

          {/* Tile 4: Kolektibilitas SPP */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kolektibilitas SPP</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isKolektibilitasSehat ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {isKolektibilitasSehat ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{displayKolektibilitas}%</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                  isKolektibilitasSehat ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isKolektibilitasSehat ? 'Likuiditas Sehat' : 'Perlu Atensi'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 truncate">
                  Sisa Piutang {formatCurrency(totalSisaTagihanUnit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Pengawasan Finansial & Likuiditas Kas (Asymmetric 12-Col Split) */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengawasan Finansial & Arus Kas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring perputaran kas riil bulanan, efektivitas penerimaan tagihan, dan audit pengeluaran.</p>
        </div>

        {/* 3 Key Financial Value Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card Saldo Kas Riil (Brand Forest Green Accent) */}
          <div className="bg-[#065f32] text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[#054d28]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Saldo Kas Riil Unit</span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <Wallet size={16} />
              </div>
            </div>
            <div>
              <div className="my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(saldoBulanIni)}
                  className="text-white"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
              <p className="text-[11px] text-emerald-100/70 mt-1.5">Net cashflow bulan berjalan</p>
            </div>
          </div>

          {/* Card Penerimaan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penerimaan Kas Masuk</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div>
              <div className="my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(penerimaanBulanIni)}
                  className="text-slate-900"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-bold text-emerald-700">+ Arus Kas Masuk</span>
                <span className="text-[11px] text-slate-400">Pembayaran terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Card Belanja Kas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Realisasi Belanja Kas</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <TrendingDown size={16} />
              </div>
            </div>
            <div>
              <div className="my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(pengeluaranBulanIni)}
                  className="text-slate-900"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-bold text-rose-700">- Realisasi Pengeluaran</span>
                <span className="text-[11px] text-slate-400">Operasional berjalan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Asymmetric Split: Chart Arus Kas (7 Cols) + Audit Likuiditas & Belanja (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-1">
          {/* Kolom Kiri: Chart Arus Kas Masuk (7 Cols) */}
          <div className="lg:col-span-7 h-[420px]">
            <PendapatanInteractiveChart 
              hariIniData={pendapatanHariIniChart}
              mingguIniData={pendapatanMingguIniChart}
              bulanIniData={pendapatanBulanIniChart}
            />
          </div>

          {/* Kolom Kanan: Audit Likuiditas & Belanja Operasional (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between h-[420px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Audit Likuiditas & Belanja</h3>
                  <p className="text-[11px] text-slate-400">Efektivitas penagihan dan pos pengeluaran terbesar</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  isKolektibilitasSehat ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {displayKolektibilitas}% Terbayar
                </span>
              </div>

              {/* Progress Kolektibilitas Tagihan */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Realisasi Penerimaan SPP</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalLunas)} <span className="text-slate-400 font-normal">/ {formatCurrency(totalTagihanUnit)}</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#065f32] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, displayKolektibilitas)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Target Tagihan Unit</span>
                  <span>Sisa: <strong className="text-rose-600 font-semibold">{formatCurrency(totalSisaTagihanUnit)}</strong></span>
                </div>
              </div>

              {/* Pos Belanja Operasional Terbesar */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Pos Belanja Terbesar Bulan Ini</span>
                  <Link href="/kas-keluar" className="text-[11px] font-semibold text-[#065f32] hover:underline flex items-center gap-0.5">
                    Audit Kas Keluar <ArrowUpRight size={12} />
                  </Link>
                </h4>

                <div className="space-y-2 overflow-y-auto max-h-[165px] pr-1">
                  {alokasiPengeluaran && alokasiPengeluaran.length > 0 ? (
                    alokasiPengeluaran.slice(0, 4).map((item: any, idx: number) => {
                      const pct = pengeluaranBulanIni > 0 ? Math.round((item.value / pengeluaranBulanIni) * 100) : 0
                      return (
                        <div key={`exp-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{pct}% dari total belanja</p>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0">{formatCurrency(item.value)}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs text-center">
                      <p>Belum ada catatan belanja kas bulan ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Belanja Kas:</span>
              <span className="font-bold text-slate-900">{formatCurrency(pengeluaranBulanIni)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Mutu Akademik, Kapasitas Rombel & Ketenagaan */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kapasitas Kelas & Demografi Kesiswaan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Audit daya tampung ruang kelas, persebaran tingkatan, dan profil sosial-ekonomi keluarga murid.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Audit Kapasitas Rombel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Audit Daya Tampung Rombel</h3>
                  <p className="text-xs text-slate-400">Standar Permendikbud: 20 – 36 siswa</p>
                </div>
                {hasCrowded ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Ada Kelas Padat
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Kapasitas Ideal
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Rombel Terpadat */}
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Rombel Terpadat (&gt;35 Siswa)</span>
                    <span className="text-[10px] text-slate-400">Prioritas Split</span>
                  </p>
                  {topCrowded && topCrowded.length > 0 ? (
                    topCrowded.map((c: any) => (
                      <div key={`crowded-${c.name}`} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-xs">
                        <span className="font-medium text-slate-700">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.total > 36 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.total} Siswa
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-1">Semua kelas dalam batas normal</p>
                  )}
                </div>

                {/* Rombel Terlonggar */}
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Rombel Kuota Minim (&lt;20 Siswa)</span>
                    <span className="text-[10px] text-slate-400">Optimalisasi</span>
                  </p>
                  {topEmpty && topEmpty.length > 0 ? (
                    topEmpty.map((c: any) => (
                      <div key={`empty-${c.name}`} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-xs">
                        <span className="font-medium text-slate-700">{c.name}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {c.total} Siswa
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-1">Belum ada rombel terdaftar</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4">
              <Link href="/kelas" className="text-xs font-semibold text-[#065f32] hover:underline flex items-center gap-1">
                Audit rincian seluruh rombel di Kapasitas Rombel <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Card 2: Distribusi Siswa per Jenjang */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Distribusi per Jenjang Tingkat</h3>
                  <p className="text-xs text-slate-400">Sebaran populasi murid berdasarkan tingkatan</p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {formatNumber(totalMurid)} Siswa
                </span>
              </div>

              <div className="h-56">
                {jenjangData && jenjangData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jenjangData} layout="vertical" margin={{ left: 5, right: 20, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#334155'}} width={80} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}} 
                        contentStyle={{borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px'}} 
                        formatter={(val: any) => [`${val} Siswa`, 'Jumlah Murid']}
                      />
                      <Bar dataKey="value" name="Jumlah Siswa" fill="#065f32" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    Belum ada data jenjang kelas
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
              Total daya serap: <strong className="text-slate-800">{formatNumber(totalMurid)} Murid Aktif</strong>
            </div>
          </div>

          {/* Card 3: Profil Penghasilan & Kemampuan Bayar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Profil Finansial Orang Tua</h3>
                  <p className="text-xs text-slate-400">Kemampuan daya dukung pembiayaan siswa</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <BarChart3 size={14} />
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                {incomeData && incomeData.length > 0 ? (
                  incomeData.map((item: any, idx: number) => {
                    const pct = totalMurid > 0 ? Math.round((item.value / totalMurid) * 100) : 0
                    return (
                      <div key={`inc-${idx}`} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">{item.name}</span>
                          <span className="font-bold text-slate-900">{item.value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-slate-700 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs text-center">
                    <p>Data penghasilan orang tua belum lengkap</p>
                    <span className="text-[11px] text-slate-400 mt-1">Dapat dilengkapi oleh Tata Usaha</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
              Indikator acuan kebijakan dispensasi SPP
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


