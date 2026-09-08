'use client'

import { 
  Users, LayoutDashboard, GraduationCap, CheckCircle2, 
  TrendingUp, TrendingDown, Wallet, Award, FileText, AlertCircle, PieChart as PieIcon
} from "lucide-react"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap 
} from 'recharts'
import Link from "next/link"
import PendapatanInteractiveChart from './PendapatanInteractiveChart'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function KepsekDashboard(props: any) {
  const { 
    activeUnit, activeYear, totalMurid = 0, totalRombel = 0, totalGuru = 0,
    dataQualityScore, jobData = [], incomeData = [], topCrowded = [], topEmpty = [], retentionData = [], 
    jenjangData = [], guruPendidikanData = [],
    // Keuangan
    penerimaanBulanIni = 0, pengeluaranBulanIni = 0, saldoBulanIni = 0,
    kolektibilitasData = [], alokasiPengeluaran = [], 
    totalTagihanUnit = 0, totalSisaTagihanUnit = 0, kolektibilitasPersen = null,
    pendapatanHariIniChart = [], pendapatanMingguIniChart = [], pendapatanBulanIniChart = []
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  // Treemap custom renderer
  const TreemapContent = (props: any) => {
    const { depth, x, y, width, height, index, name, value } = props
    if (depth !== 1) return null
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} rx={4} />
        {width > 50 && height > 28 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold" dy={4}>
            {name} ({value})
          </text>
        )}
      </g>
    )
  }

  // Hitung persentase kolektibilitas jika ada
  const displayKolektibilitas = kolektibilitasPersen !== null ? kolektibilitasPersen : (totalTagihanUnit > 0 ? Math.round(((totalTagihanUnit - totalSisaTagihanUnit) / totalTagihanUnit) * 100) : 100)
  const isKolektibilitasSehat = displayKolektibilitas >= 80

  const hasMajors = activeUnit?.level === 'SMK' || activeUnit?.level === 'SMA'

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300 w-full">
      {/* SECTION 1: Header Banner Eksekutif */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              Kepala Sekolah • Pimpinan Unit
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-gray-500">Tahun Akademik: {activeYear?.name || 'Aktif'}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-bold text-gray-800">{activeUnit?.name || '-'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Eksekutif Unit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pusat monitoring kesehatan operasional, evaluasi beban tenaga pendidik, dan audit finansial pada {activeUnit?.name || 'Unit Sekolah'}.
          </p>
        </div>

        {/* Action Buttons (Kontekstual & Relevan untuk Kepsek) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          <Link
            href="/kelas"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#065f32] hover:bg-[#054d28] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <LayoutDashboard size={16} />
            Kapasitas Rombel
          </Link>
          <Link
            href="/rekapitulasi-tunggakan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <Wallet size={16} />
            Monitoring SPP
          </Link>
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <FileText size={16} />
            Pusat Laporan
          </Link>
          {hasMajors && (
            <Link
              href="/jurusan"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
            >
              <Award size={16} />
              Jurusan
            </Link>
          )}
        </div>
      </div>

      {/* SECTION 2: Overview Indikator Kunci (4 Kolom) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Overview Eksekutif Unit</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
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
            <p className="text-[11px] text-gray-400 mt-2">Siswa terdaftar aktif pada tahun ajaran ini</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
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
            <p className="text-[11px] text-gray-400 mt-2">
              Rata-rata {totalRombel > 0 ? Math.round(totalMurid / totalRombel) : 0} siswa per rombel
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tenaga Pendidik</span>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{formatNumber(totalGuru)}</span>
              <span className="text-xs font-semibold text-amber-600">
                Rasio 1 : {totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Guru aktif bertugas di unit ini</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Kolektibilitas SPP</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isKolektibilitasSehat ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{displayKolektibilitas}%</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isKolektibilitasSehat ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {isKolektibilitasSehat ? 'Kolektibilitas Sehat' : 'Perlu Perhatian'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Sisa Tunggakan: <strong className="text-gray-700">{formatCurrency(totalSisaTagihanUnit)}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Pengawasan Finansial & Arus Kas */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pengawasan Finansial & Arus Kas</h2>
        </div>

        {/* 3 Metric Cards Keuangan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#065f32] via-[#08733e] to-[#044e28] rounded-2xl border border-emerald-800/30 p-5 shadow-sm text-white hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="font-bold text-emerald-100 text-xs uppercase tracking-wider">Saldo Kas Riil Unit</h3>
                <p className="text-[10px] text-emerald-200">Bulan Berjalan</p>
              </div>
            </div>
            <p className="text-3xl font-black relative z-10">{formatCurrency(saldoBulanIni)}</p>
            <p className="text-[11px] text-emerald-100/80 mt-2 relative z-10">Selisih arus kas masuk & keluar</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Penerimaan Kas Masuk</h3>
                <p className="text-[10px] text-gray-400">Bulan Berjalan</p>
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(penerimaanBulanIni)}</p>
            <p className="text-[11px] text-gray-400 mt-2">Total kas & pembayaran SPP masuk</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Realisasi Belanja Kas</h3>
                <p className="text-[10px] text-gray-400">Bulan Berjalan</p>
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatCurrency(pengeluaranBulanIni)}</p>
            <p className="text-[11px] text-gray-400 mt-2">Total pengeluaran operasional unit</p>
          </div>
        </div>

        {/* 3 Detail Financial Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-2">
          {/* Chart 1: Interactive Cash Inflow */}
          <div className="lg:col-span-2 xl:col-span-1 h-[380px]">
            <PendapatanInteractiveChart 
              hariIniData={pendapatanHariIniChart}
              mingguIniData={pendapatanMingguIniChart}
              bulanIniData={pendapatanBulanIniChart}
            />
          </div>

          {/* Chart 2: Kolektibilitas Tagihan */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[380px]">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Rasio Kolektibilitas SPP
              </h3>
              <p className="text-xs text-gray-500 mb-2">Perbandingan kewajiban lunas vs tunggakan siswa unit.</p>
            </div>
            <div className="h-56">
              {kolektibilitasData && kolektibilitasData.length > 0 && (kolektibilitasData[0]?.value > 0 || kolektibilitasData[1]?.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={kolektibilitasData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {kolektibilitasData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} 
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                  <CheckCircle2 size={32} className="text-gray-300 mb-2" />
                  Belum ada catatan tagihan unit
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-50">
              <span>Total Tagihan: <strong>{formatCurrency(totalTagihanUnit)}</strong></span>
              <span className="text-emerald-600 font-bold">{displayKolektibilitas}% Terbayar</span>
            </div>
          </div>

          {/* Chart 3: Alokasi Pengeluaran */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[380px]">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <TrendingDown size={18} className="text-rose-500" />
                Alokasi Pengeluaran Unit
              </h3>
              <p className="text-xs text-gray-500 mb-2">Pos belanja operasional terbesar bulan ini.</p>
            </div>
            <div className="h-56">
              {alokasiPengeluaran && alokasiPengeluaran.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alokasiPengeluaran} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10}} width={100} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} 
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="value" name="Pengeluaran" radius={[0, 4, 4, 0]}>
                      {alokasiPengeluaran.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                  <TrendingDown size={32} className="text-gray-300 mb-2" />
                  Belum ada data belanja kas bulan ini
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-50 text-right">
              Total Realisasi: <strong className="text-gray-700">{formatCurrency(pengeluaranBulanIni)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Mutu Akademik, Kapasitas & Demografi */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Kapasitas Kelas & Demografi Kesiswaan</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Peringkat Kapasitas Kelas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Peringkat Kapasitas Kelas</h3>
              <p className="text-xs text-gray-500 mb-4">Monitoring daya tampung rombel (Standar ideal: 20-36).</p>
            </div>
            <div className="flex-1 flex flex-col justify-around gap-4">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-red-500" /> Rombel Terpadat (&gt;35 Siswa)
                </p>
                {topCrowded && topCrowded.length > 0 ? (
                  topCrowded.map((c: any) => (
                    <div key={`crowded-${c.name}`} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-semibold text-gray-700">{c.name}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${c.total > 36 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'}`}>
                        {c.total} siswa
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-1">Semua kelas dalam batas kapasitas normal</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-emerald-500" /> Rombel Terlonggar (&lt;20 Siswa)
                </p>
                {topEmpty && topEmpty.length > 0 ? (
                  topEmpty.map((c: any) => (
                    <div key={`empty-${c.name}`} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-semibold text-gray-700">{c.name}</span>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md font-bold">
                        {c.total} siswa
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-1">Belum ada rombel terdaftar</p>
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-gray-50 mt-4">
              <Link href="/kelas" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Audit seluruh rombel di Kapasitas Rombel →
              </Link>
            </div>
          </div>

          {/* Distribusi Jenjang */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Distribusi Siswa per Jenjang</h3>
              <p className="text-xs text-gray-500 mb-4">Jumlah murid berdasarkan tingkatan kelas aktif.</p>
            </div>
            <div className="h-56">
              {jenjangData && jenjangData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jenjangData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10}} width={70} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} />
                    <Bar dataKey="value" name="Jumlah Siswa" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                  Belum ada data jenjang kelas
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-50">
              Total: <strong className="text-gray-700">{formatNumber(totalMurid)} Siswa</strong>
            </div>
          </div>

          {/* Retensi Siswa */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Retensi Siswa (Tahun Ini)</h3>
              <p className="text-xs text-gray-500 mb-4">Perbandingan siswa aktif bertahan vs mutasi/keluar.</p>
            </div>
            <div className="h-56">
              {retentionData && retentionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={retentionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {retentionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                  Belum ada data retensi
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-50 text-center">
              Indikator kepuasan & keberlanjutan siswa
            </div>
          </div>
        </div>

        {/* Row 2: Profil Ortu & Pendidikan Guru */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treemap Pekerjaan Orang Tua */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Profil Pekerjaan Orang Tua</h3>
              <p className="text-xs text-gray-500 mb-4">Demografi profesi kepala keluarga siswa.</p>
            </div>
            <div className="h-56">
              {jobData && jobData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={jobData}
                    dataKey="value"
                    stroke="#fff"
                    fill="#8884d8"
                    content={<TreemapContent />}
                  >
                    <Tooltip />
                  </Treemap>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs bg-gray-50/50 rounded-xl p-4 border border-dashed border-gray-200">
                  <Users size={28} className="text-gray-300 mb-2" />
                  <span>Data pekerjaan ayah belum diisi lengkap</span>
                  <span className="text-[11px] text-gray-400 mt-1">Dapat diupdate melalui data siswa oleh TU</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-50">
              Analisis latar belakang sosial-ekonomi
            </div>
          </div>

          {/* Demografi Penghasilan Orang Tua */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <Wallet size={18} className="text-emerald-600" />
                Rentang Gaji Orang Tua
              </h3>
              <p className="text-xs text-gray-500 mb-4">Demografi penghasilan bulanan keluarga siswa.</p>
            </div>
            <div className="h-56">
              {incomeData && incomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {incomeData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs bg-gray-50/50 rounded-xl p-4 border border-dashed border-gray-200">
                  <Wallet size={28} className="text-gray-300 mb-2" />
                  Belum ada data penghasilan orang tua
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-50">
              Data kemampuan pembiayaan pendidikan
            </div>
          </div>

          {/* Pendidikan Terakhir Guru */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                <Award size={18} className="text-pink-600" />
                Kualifikasi Pendidik
              </h3>
              <p className="text-xs text-gray-500 mb-4">Linieritas & jenjang pendidikan guru aktif.</p>
            </div>
            <div className="h-56">
              {guruPendidikanData && guruPendidikanData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={guruPendidikanData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {guruPendidikanData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs bg-gray-50/50 rounded-xl p-4 border border-dashed border-gray-200">
                  <Award size={28} className="text-gray-300 mb-2" />
                  Belum ada data pendidikan guru
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 pt-3 border-t border-gray-50">
              Kesiapan standar akreditasi unit
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

