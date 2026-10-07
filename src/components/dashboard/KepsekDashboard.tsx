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
  const formatCurrency = (num: number) => `Rp ${new Intl.NumberFormat('id-ID').format(num || 0)}`

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/40 text-[#065f32] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
              Kepala Sekolah
            </span>
            <span className="text-text-muted/40">•</span>
            <span className="text-xs font-medium text-text-muted">TA {activeYear?.name || 'Aktif'}</span>
            <span className="text-text-muted/40">•</span>
            <span className="text-xs font-bold text-text-main">{activeUnit?.name || 'Unit Sekolah'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight">Dashboard Kepala Sekolah</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          <Link
            href="/kelas"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#065f32] hover:bg-[#054d28] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
          >
            <LayoutDashboard size={16} />
            Kapasitas Rombel
          </Link>
          <Link
            href="/rekapitulasi-tunggakan"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-bg border border-border hover:bg-surface-hover text-text-main text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
          >
            <Wallet size={16} />
            Monitoring SPP
          </Link>
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-surface border border-border hover:bg-surface-hover text-text-main text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
          >
            <FileText size={16} />
            Pusat Laporan
          </Link>
          {hasMajors && (
            <Link
              href="/jurusan"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-bg border border-border hover:bg-surface-hover text-text-main text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap min-h-[44px]"
            >
              <Award size={16} />
              Jurusan
            </Link>
          )}
        </div>
      </div>

      {/* SECTION 2: Ringkasan Unit */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight px-0.5">Ringkasan Unit</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tile 1: Total Siswa Aktif */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Total Siswa</span>
              <div className="w-8 h-8 rounded-lg bg-bg border border-border text-text-muted flex items-center justify-center shrink-0">
                <GraduationCap size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">{formatNumber(totalMurid)}</span>
                <span className="text-xs font-medium text-text-muted">Siswa</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Status Aktif</p>
            </div>
          </div>

          {/* Tile 2: Kapasitas Rombel */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Rombongan Belajar</span>
              <div className="w-8 h-8 rounded-lg bg-bg border border-border text-text-muted flex items-center justify-center shrink-0">
                <LayoutDashboard size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">{formatNumber(totalRombel)}</span>
                <span className="text-xs font-medium text-text-muted">Kelas</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Rata-rata {avgPerRombel} Siswa/Kelas</p>
            </div>
          </div>

          {/* Tile 3: Rasio Pendidik */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Tenaga Pendidik</span>
              <div className="w-8 h-8 rounded-lg bg-bg border border-border text-text-muted flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">{formatNumber(totalGuru)}</span>
                <span className="text-xs font-medium text-text-muted">Guru</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Rasio 1 : {ratioGuru} Murid</p>
            </div>
          </div>

          {/* Tile 4: Kolektibilitas SPP */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">Kolektibilitas SPP</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isKolektibilitasSehat 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              }`}>
                {isKolektibilitasSehat ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-text-main tracking-tight">{displayKolektibilitas}%</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 truncate">Sisa {formatCurrency(totalSisaTagihanUnit)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Pengawasan Finansial & Likuiditas Kas (Asymmetric 12-Col Split) */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">Pengawasan Finansial & Arus Kas</h2>
          <p className="text-xs text-text-muted mt-0.5">Monitoring perputaran kas riil bulanan, efektivitas penerimaan tagihan, dan audit pengeluaran.</p>
        </div>

        {/* 3 Key Financial Value Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card Saldo Kas Riil (Brand Forest Green Accent) */}
          <div className="bg-[#065f32] dark:bg-[#065f32]/80 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[#054d28] dark:border-emerald-800/40">
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
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Penerimaan Kas Masuk</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div>
              <div className="my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(penerimaanBulanIni)}
                  className="text-text-main"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+ Arus Kas Masuk</span>
                <span className="text-[11px] text-text-muted">Pembayaran terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Card Belanja Kas */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Realisasi Belanja Kas</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown size={16} />
              </div>
            </div>
            <div>
              <div className="my-0.5">
                <AdaptiveValue 
                  value={formatCurrency(pengeluaranBulanIni)}
                  className="text-text-main"
                  maxFontSize={30}
                  minFontSize={16}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">- Realisasi Pengeluaran</span>
                <span className="text-[11px] text-text-muted">Operasional berjalan</span>
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
          <div className="lg:col-span-5 bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between h-[420px]">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-text-main text-sm sm:text-base">Audit Likuiditas & Belanja</h3>
                  <p className="text-[11px] text-text-muted">Efektivitas penagihan dan pos pengeluaran terbesar</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  isKolektibilitasSehat 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                }`}>
                  {displayKolektibilitas}% Terbayar
                </span>
              </div>

              {/* Progress Kolektibilitas Tagihan */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Realisasi Penerimaan SPP</span>
                  <span className="font-bold text-text-main">{formatCurrency(totalLunas)} <span className="text-text-muted font-normal">/ {formatCurrency(totalTagihanUnit)}</span></span>
                </div>
                <div className="w-full bg-bg border border-border rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#065f32] dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, displayKolektibilitas)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted pt-0.5">
                  <span>Target Tagihan Unit</span>
                  <span>Sisa: <strong className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(totalSisaTagihanUnit)}</strong></span>
                </div>
              </div>

              {/* Pos Belanja Operasional Terbesar */}
              <div>
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Pos Belanja Terbesar Bulan Ini</span>
                  <Link href="/kas-keluar" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                    Audit Kas Keluar <ArrowUpRight size={12} />
                  </Link>
                </h4>

                <div className="space-y-2 overflow-y-auto max-h-[165px] pr-1">
                  {alokasiPengeluaran && alokasiPengeluaran.length > 0 ? (
                    alokasiPengeluaran.slice(0, 4).map((item: any, idx: number) => {
                      const pct = pengeluaranBulanIni > 0 ? Math.round((item.value / pengeluaranBulanIni) * 100) : 0
                      return (
                        <div key={`exp-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-bg border border-border text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-text-main truncate">{item.name}</p>
                            <p className="text-[10px] text-text-muted">{pct}% dari total belanja</p>
                          </div>
                          <span className="font-bold text-text-main shrink-0">{formatCurrency(item.value)}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-text-muted text-xs text-center">
                      <p>Belum ada catatan belanja kas bulan ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>Total Belanja Kas:</span>
              <span className="font-bold text-text-main">{formatCurrency(pengeluaranBulanIni)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Mutu Akademik, Kapasitas Rombel & Ketenagaan */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">Kapasitas Kelas & Demografi Kesiswaan</h2>
          <p className="text-xs text-text-muted mt-0.5">Audit daya tampung ruang kelas, persebaran tingkatan, dan profil sosial-ekonomi keluarga murid.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Audit Kapasitas Rombel */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-text-main text-base">Audit Daya Tampung Rombel</h3>
                  <p className="text-xs text-text-muted">Standar Permendikbud: 20 – 36 siswa</p>
                </div>
                {hasCrowded ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                    Ada Kelas Padat
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    Kapasitas Ideal
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Rombel Terpadat */}
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Rombel Terpadat (&gt;35 Siswa)</span>
                    <span className="text-[10px] text-text-muted">Prioritas Split</span>
                  </p>
                  {topCrowded && topCrowded.length > 0 ? (
                    topCrowded.map((c: any) => (
                      <div key={`crowded-${c.name}`} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-xs">
                        <span className="font-medium text-text-main">{c.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.total > 36 
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60' 
                            : 'bg-bg border border-border text-text-main'
                        }`}>
                          {c.total} Siswa
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted py-1">Semua kelas dalam batas normal</p>
                  )}
                </div>

                {/* Rombel Terlonggar */}
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Rombel Kuota Minim (&lt;20 Siswa)</span>
                    <span className="text-[10px] text-text-muted">Optimalisasi</span>
                  </p>
                  {topEmpty && topEmpty.length > 0 ? (
                    topEmpty.map((c: any) => (
                      <div key={`empty-${c.name}`} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-xs">
                        <span className="font-medium text-text-main">{c.name}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          {c.total} Siswa
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted py-1">Belum ada rombel terdaftar</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border mt-4">
              <Link href="/kelas" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Audit rincian seluruh rombel di Kapasitas Rombel <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Card 2: Distribusi Siswa per Jenjang */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-text-main text-base">Distribusi per Jenjang Tingkat</h3>
                  <p className="text-xs text-text-muted">Sebaran populasi murid berdasarkan tingkatan</p>
                </div>
                <span className="text-xs font-bold text-text-main bg-bg border border-border px-2.5 py-0.5 rounded-md">
                  {formatNumber(totalMurid)} Siswa
                </span>
              </div>

              <div className="h-56">
                {jenjangData && jenjangData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jenjangData} layout="vertical" margin={{ left: 5, right: 20, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-border/40" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'currentColor'}} className="text-text-muted font-medium" />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'currentColor'}} className="text-text-main font-medium" width={80} />
                      <Tooltip 
                        cursor={{ fill: 'currentColor', opacity: 0.06 }} 
                        contentStyle={{
                          borderRadius: '12px', 
                          border: '1px solid var(--border-color)', 
                          backgroundColor: 'var(--surface)', 
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          boxShadow: 'var(--shadow-md)'
                        }} 
                        formatter={(val: any) => [`${val} Siswa`, 'Jumlah Murid']}
                      />
                      <Bar dataKey="value" name="Jumlah Siswa" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted text-xs">
                    Belum ada data jenjang kelas
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border text-xs text-text-muted">
              Total daya serap: <strong className="text-text-main">{formatNumber(totalMurid)} Murid Aktif</strong>
            </div>
          </div>

          {/* Card 3: Profil Penghasilan & Kemampuan Bayar */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-text-main text-base">Profil Finansial Orang Tua</h3>
                  <p className="text-xs text-text-muted">Kemampuan daya dukung pembiayaan siswa</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-bg border border-border text-text-muted flex items-center justify-center">
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
                          <span className="font-medium text-text-main truncate max-w-[180px]">{item.name}</span>
                          <span className="font-bold text-text-main">{item.value} <span className="text-text-muted font-normal">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-bg border border-border rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-text-muted text-xs text-center">
                    <p>Data penghasilan orang tua belum lengkap</p>
                    <span className="text-[11px] text-text-muted mt-1">Dapat dilengkapi oleh Tata Usaha</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border text-xs text-text-muted">
              Indikator acuan kebijakan dispensasi SPP
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


