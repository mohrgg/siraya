'use client'

import { Building, Users, LayoutDashboard, Calendar, GraduationCap, CheckCircle2, TrendingUp, TrendingDown, BookOpen, Wallet, Award, Layers } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap } from 'recharts'
import Link from "next/link"
import PendapatanInteractiveChart from './PendapatanInteractiveChart'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function KepsekDashboard(props: any) {
  const { 
    activeUnit, activeYear, totalMurid, totalRombel, totalJurusan, totalGuru,
    dataQualityScore, jobData, incomeData, topCrowded, topEmpty, retentionData, 
    jenjangData, genderData, statusData, anomalyList, capacityData,
    guruStatusData, guruPendidikanData,
    // Keuangan
    penerimaanBulanIni = 0, pengeluaranBulanIni = 0, saldoBulanIni = 0,
    kolektibilitasData = [], alokasiPengeluaran = [], 
    pendapatanHariIniChart = [], pendapatanMingguIniChart = [], pendapatanBulanIniChart = []
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)
  const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

  // Custom Treemap Content
  const TreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, value } = props
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
        {width > 40 && height > 30 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold" dy={4}>
            {name} ({value})
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner Standar (Konsisten dengan Yayasan & Unit) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 min-w-0 pr-0 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
              Kepala Sekolah Area • Pimpinan Unit
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-500">Tahun Akademik: {activeYear?.name || 'Aktif'}</span>
            <span className="text-gray-400">•</span>
            <span className="text-xs font-bold text-gray-800">{activeUnit?.name || '-'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Kepala Sekolah</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan eksekutif dan analitik laporan data akademik, retensi, serta demografi siswa pada {activeUnit?.name || 'Unit Sekolah'}.
          </p>
        </div>

        {/* Action Buttons (Sejajar horizontal, anti wrap pada desktop) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <Link
            href="/kelas"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <GraduationCap size={16} />
            Data Kelas
          </Link>
          <Link
            href="/jurusan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 whitespace-nowrap"
          >
            <Award size={16} />
            Data Jurusan
          </Link>
        </div>
      </div>

      {/* METRIC CARDS (4 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Users size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Siswa Aktif</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalMurid)}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><GraduationCap size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Kelas Berjalan</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalRombel)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Users size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Tenaga Pendidik</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900">{formatNumber(totalGuru)}</p>
            <span className="text-xs font-semibold text-amber-600">
              Rasio 1 : {totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Skor Kualitas Data</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-gray-900">{dataQualityScore}%</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dataQualityScore >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {dataQualityScore >= 90 ? 'Lengkap' : 'Perlu Review'}
            </span>
          </div>
        </div>
      </div>

      {/* METRIC CARDS KEUANGAN (3 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl border border-emerald-900/20 p-5 shadow-sm text-white hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm"><Wallet size={20} /></div>
            <div>
              <h3 className="font-bold text-emerald-100 text-xs uppercase tracking-wider">Saldo Kas Unit</h3>
              <p className="text-[10px] text-emerald-200">Bulan Berjalan</p>
            </div>
          </div>
          <p className="text-3xl font-black relative z-10">{formatCurrency(saldoBulanIni)}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
            <div>
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Pemasukan</h3>
              <p className="text-[10px] text-gray-500">Bulan Berjalan</p>
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatCurrency(penerimaanBulanIni)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><TrendingDown size={20} /></div>
            <div>
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Pengeluaran</h3>
              <p className="text-[10px] text-gray-500">Bulan Berjalan</p>
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatCurrency(pengeluaranBulanIni)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treemap Latar Belakang Ortu */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1">Profil Pekerjaan Orang Tua</h3>
          <p className="text-xs text-gray-500 mb-4">Pemetaan demografi pekerjaan ayah siswa di unit ini.</p>
          <div className="h-64">
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
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data pekerjaan.</div>
            )}
          </div>
        </div>

        {/* Tren Retensi / DO */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-1 w-full text-center">Retensi Siswa (Tahun Ini)</h3>
          <p className="text-xs text-gray-500 mb-4 w-full text-center">Masuk vs Keluar/DO.</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={retentionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {retentionData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Perbandingan Pendapatan Terkini (Interactive Chart) */}
        <div className="lg:col-span-2 h-[350px]">
          <PendapatanInteractiveChart 
            hariIniData={pendapatanHariIniChart}
            mingguIniData={pendapatanMingguIniChart}
            bulanIniData={pendapatanBulanIniChart}
          />
        </div>

        {/* Kolektibilitas Tagihan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            Kolektibilitas Tagihan
          </h3>
          <p className="text-xs text-gray-500 mb-4">Rasio tagihan yang telah lunas vs belum lunas di unit ini.</p>
          <div className="h-56">
            {kolektibilitasData && kolektibilitasData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kolektibilitasData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {kolektibilitasData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none'}} 
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data tagihan.</div>
            )}
          </div>
        </div>

        {/* Alokasi Pengeluaran */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TrendingDown size={18} className="text-rose-500" />
            Alokasi Pengeluaran
          </h3>
          <p className="text-xs text-gray-500 mb-4">Pengeluaran berdasarkan kategori akun (Bulan Ini).</p>
          <div className="h-56">
            {alokasiPengeluaran && alokasiPengeluaran.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alokasiPengeluaran} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11}} tickFormatter={(val) => `Rp${val/1000}k`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11}} width={120} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '8px', border: 'none'}} 
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
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data pengeluaran bulan ini.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Distribusi Jenjang */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 text-center">Siswa per Jenjang</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jenjangData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Bar dataKey="value" name="Siswa" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peringkat Kelas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4">Peringkat Kapasitas Kelas</h3>
          <div className="flex-1 flex flex-col justify-around">
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp size={14}/> Top 3 Paling Padat</p>
              {topCrowded.map((c: any) => (
                <div key={`crowded-${c.name}`} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-bold text-gray-700">{c.name}</span>
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">{c.total} siswa</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingDown size={14}/> Top 3 Paling Longgar</p>
              {topEmpty.map((c: any) => (
                <div key={`empty-${c.name}`} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-bold text-gray-700">{c.name}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{c.total} siswa</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rentang Gaji Orang Tua */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 mb-1 flex items-center justify-center sm:justify-start gap-2">
              <Wallet size={18} className="text-emerald-500" />
              Rentang Gaji Orang Tua
            </h3>
            <p className="text-xs text-gray-500 mb-4 text-center sm:text-left">Demografi penghasilan bulanan orang tua / wali.</p>
          </div>

          <div className="h-56 my-auto">
            {incomeData && incomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incomeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {incomeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data penghasilan.</div>
            )}
          </div>
        </div>

        {/* Pendidikan Guru */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-800 mb-1 flex items-center justify-center sm:justify-start gap-2">
              <Award size={18} className="text-pink-500" />
              Pendidikan Guru
            </h3>
            <p className="text-xs text-gray-500 mb-4 text-center sm:text-left">Linieritas pendidikan terakhir.</p>
          </div>

          <div className="h-56 my-auto">
            {guruPendidikanData && guruPendidikanData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={guruPendidikanData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {guruPendidikanData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data pendidik.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
