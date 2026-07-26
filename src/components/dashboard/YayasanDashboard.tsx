'use client'

import React from "react"
import { 
  Building, Users, GraduationCap, LayoutDashboard, ShieldCheck, 
  AlertTriangle, ArrowRight, TrendingUp, MapPin, CheckCircle2, 
  Settings, Award
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts'
import Link from "next/link"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface YayasanDashboardProps {
  role?: string
  unitCount?: number
  muridCount?: number
  rombelCount?: number
  usersCount?: number
  unitData?: Array<{ name: string; total: number }>
  genderData?: Array<{ name: string; value: number; color?: string }>
  scholarshipData?: Array<{ name: string; value: number; color?: string }>
  dataQualityIndex?: number
  incompleteData?: Array<{ unitName: string; incompleteCount: number }>
  trendData?: Array<{ year: string; total: number }>
  districtData?: Array<{ name: string; value: number }>
  classEfficiency?: Array<{ name: string; ratio: number }>
  statusDataGlobal?: Array<{ name: string; value: number }>
  academicYear?: any
}

export default function YayasanDashboard(props: YayasanDashboardProps) {
  const {
    role = 'TATA_USAHA',
    unitCount = 0,
    muridCount = 0,
    rombelCount = 0,
    usersCount = 0,
    unitData = [],
    genderData = [],
    scholarshipData = [],
    dataQualityIndex = 0,
    incompleteData = [],
    trendData = [],
    districtData = [],
    classEfficiency = [],
    academicYear
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num || 0)

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
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

        {/* Role Injection: Shortcut navigasi khusus Administrator */}
        {role === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <Link 
              href="/manajemen-user" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
            >
              <Settings size={16} />
              Kelola Pengguna
            </Link>
            <Link 
              href="/unit-sekolah" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
            >
              <Building size={16} />
              Unit Sekolah
            </Link>
          </div>
        )}
      </div>

      {/* Row 1: 4 Key Metric Cards */}
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
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Staf & Pegawai</span>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{formatNumber(usersCount)}</span>
            <span className="text-xs font-semibold text-amber-600">Akun Aktif</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Guru, TU, dan administrator</p>
        </div>
      </div>

      {/* Row 2: Distribusi Siswa & Gender Demography */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Siswa per Unit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Building size={18} className="text-primary" />
                Distribusi Siswa per Unit Sekolah
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Jumlah populasi peserta didik aktif pada masing-masing unit.</p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] mt-4">
            {unitData && unitData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                    formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Total']}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40}>
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

        {/* Pie Chart: Demografi Gender */}
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
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
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-xs font-semibold text-gray-400">Data gender belum tersedia</p>
              </div>
            )}
          </div>

          {/* Mini Summary / Ratio */}
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

      {/* Row 3: Analitik Kualitas Data Induk (NIK/NISN) & Efisiensi Rombel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table: Kualitas Data Induk */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className={dataQualityIndex > 80 ? "text-emerald-500" : "text-amber-500"} />
                <h3 className="font-bold text-gray-900 text-lg">Monitoring Kualitas Data Induk</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Pengawasan kelengkapan NIK, NISN, dan profil orang tua untuk kebutuhan audit Dapodik & EMIS.
              </p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${dataQualityIndex > 80 ? "text-emerald-600" : "text-amber-600"}`}>
                {dataQualityIndex}%
              </span>
              <p className="text-[10px] uppercase font-bold text-gray-400">Skor Kelengkapan</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 mt-2 border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
                  <th className="p-3.5">Unit Sekolah</th>
                  <th className="p-3.5 text-center">Status Kesiapan</th>
                  <th className="p-3.5 text-right">Data Kurang Lengkap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {incompleteData && incompleteData.length > 0 ? (
                  incompleteData.map((item, idx) => {
                    const isAlert = item.incompleteCount > 10
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-gray-900 flex items-center gap-2">
                          <Building size={14} className="text-gray-400" />
                          {item.unitName}
                        </td>
                        <td className="p-3.5 text-center">
                          {item.incompleteCount === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={12} /> Sempurna
                            </span>
                          ) : isAlert ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              <AlertTriangle size={12} /> Perlu Tindakan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              Kurang {item.incompleteCount} data
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-bold text-gray-900">
                          {item.incompleteCount > 0 ? (
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-mono">
                              {item.incompleteCount} Siswa
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                      Seluruh data siswa sudah lengkap 100%!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Efficiency Card & Scholarship distribution */}
        <div className="flex flex-col gap-6">
          {/* Beasiswa vs Reguler Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-md flex items-center gap-2 mb-1">
                <Award size={18} className="text-amber-500" />
                Komposisi Beasiswa
              </h3>
              <p className="text-xs text-gray-500">Rasio siswa penerima beasiswa vs reguler.</p>
            </div>

            <div className="h-[180px] my-2">
              {scholarshipData && scholarshipData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scholarshipData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {scholarshipData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
              )}
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60 flex items-center justify-between text-xs text-amber-900">
              <span className="font-medium">Total Penerima Beasiswa:</span>
              <span className="font-black text-amber-700">
                {scholarshipData.find(d => d.name === 'Beasiswa')?.value || 0} Siswa
              </span>
            </div>
          </div>

          {/* Rasio Kepadatan Rombel */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Efisiensi Akademik</span>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <h4 className="text-lg font-black text-white">Rata-rata Kepadatan Rombel</h4>
              <p className="text-xs text-gray-300 mt-1">
                Rasio ideal sekolah standar nasional adalah 28 - 32 siswa per rombongan belajar.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700/60 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-emerald-400">
                  {classEfficiency && classEfficiency.length > 0 
                    ? Math.round(classEfficiency.reduce((acc, c) => acc + c.ratio, 0) / classEfficiency.length) 
                    : 0}
                </span>
                <span className="text-xs text-gray-400 ml-1">Siswa/Kelas</span>
              </div>
              <span className="text-[11px] px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-semibold rounded-lg border border-emerald-500/30">
                Optimal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
