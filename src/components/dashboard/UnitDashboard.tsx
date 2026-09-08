'use client'

import React, { useState } from "react"
import { 
  Users, GraduationCap, LayoutDashboard, AlertTriangle, 
  CheckCircle2, PlusCircle, ArrowRight, UserCheck, Activity 
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, LineChart, Line } from 'recharts'
import Link from 'next/link'
import PendapatanInteractiveChart from './PendapatanInteractiveChart'
import toast from "react-hot-toast"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface UnitDashboardProps {
  role?: string
  unitName?: string
  totalMurid?: number
  totalRombel?: number
  totalGuru?: number
  rombelData?: Array<{ 
    id?: string;
    name: string; 
    total: number;
    genderDist?: Array<{ name: string; value: number; color?: string }>;
    topStudents?: Array<any>;
  }>
  genderData?: Array<{ name: string; value: number; color?: string }>
  guruStatusData?: Array<{ name: string; value: number; color?: string }>
  // Keuangan Unit
  penerimaanBulanIni?: number
  pengeluaranBulanIni?: number
  totalTunggakanUnit?: number
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
    totalTunggakanUnit = 0,
    tunggakanKritisList = [],
    pendapatanHariIniChart = [], pendapatanMingguIniChart = [], pendapatanBulanIniChart = [],
    trendData = [],
    kolektibilitasUnit = null,
    incompleteDataCount = 0
  } = props

  const [selectedRombelDrilldown, setSelectedRombelDrilldown] = useState<any>(null)

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

      {/* SECTION 2: Overview KPI */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Overview Unit</h2>
        </div>
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

          <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl border border-rose-900/20 p-5 shadow-sm text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Total Piutang Unit</span>
              <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-2xl font-black">{formatCurrency(totalTunggakanUnit)}</span>
            </div>
            <p className="text-[11px] text-rose-200 mt-2 relative z-10">Total tagihan siswa yang belum dibayar</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Statistik Akademik */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1 mt-2">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Statistik Akademik</h2>
        </div>

        {/* Row 1: Kepadatan Rombel + Gender */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart: Kepadatan Rombel (2 Kolom) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Users size={18} className="text-purple-500" />
                  Kepadatan Siswa per Rombel
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Batas ideal maksimal adalah 35 siswa/rombel.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedRombelDrilldown ? (
                  <button
                    onClick={() => setSelectedRombelDrilldown(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                  >
                    ← Kembali
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11px] font-bold">
                    Batas Ideal: 35
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 w-full mt-4 min-h-0">
              {selectedRombelDrilldown ? (
                <div className="h-full flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 min-w-[200px] flex flex-col items-center justify-center bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Komposisi Gender Kelas {selectedRombelDrilldown.name}</h4>
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
                          {(selectedRombelDrilldown.genderDist || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value} Siswa`, 'Jumlah']} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col bg-gray-50/50 rounded-xl p-4 border border-gray-100 overflow-hidden">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between">
                      <span>Daftar Siswa (Sampel)</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{selectedRombelDrilldown.total} Total</span>
                    </h4>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                      {selectedRombelDrilldown.topStudents && selectedRombelDrilldown.topStudents.length > 0 ? (
                        selectedRombelDrilldown.topStudents.map((s: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-800 line-clamp-1">{s.name}</span>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">{s.gender}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-center text-gray-400 py-4">Data siswa tidak tersedia</div>
                      )}
                    </div>
                    {selectedRombelDrilldown.id && (
                      <Link 
                        href={`/kelas`}
                        className="mt-3 w-full block text-center py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-primary hover:bg-gray-50 transition-colors"
                      >
                        Kelola Kelas di Modul Akademik
                      </Link>
                    )}
                  </div>
                </div>
              ) : rombelData && rombelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={rombelData} 
                    margin={{ top: 25, right: 10, left: -20, bottom: 40 }}
                    onClick={(data: any) => {
                      if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
                        setSelectedRombelDrilldown(data.activePayload[0].payload)
                      }
                    }}
                  >
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
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                      formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Jumlah']}
                      cursor={{ fill: '#f1f5f9' }}
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
                    <Bar 
                      dataKey="total" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32}
                      cursor="pointer"
                      onClick={(data: any) => {
                        if (data) {
                          setSelectedRombelDrilldown(data)
                        }
                      }}
                    >
                      {rombelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.total > 35 ? '#ef4444' : '#8b5cf6'} />
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

          {/* Pie: Gender (1 Kolom) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[420px]">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-1">
                <Users size={20} className="text-pink-500" />
                Demografi Gender
              </h3>
              <p className="text-xs text-gray-500">Perbandingan siswa laki-laki dan perempuan di unit ini.</p>
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
                <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data</div>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs font-medium text-gray-600">
              <span>Rasio Unit L:P</span>
              <span className="font-bold text-gray-900">
                {(() => {
                  const l = genderData.find(g => g.name === 'Laki-laki')?.value || 0;
                  const p = genderData.find(g => g.name === 'Perempuan')?.value || 0;
                  return (l > 0 || p > 0) ? `${Math.round((l / (l + p)) * 100)}% : ${Math.round((p / (l + p)) * 100)}%` : '-';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Pertumbuhan Siswa Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                Trend Pertumbuhan Siswa Baru
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Pertumbuhan siswa 3 tahun terakhir.</p>
            </div>
          </div>
          <div className="flex-1 w-full mt-4 min-h-0">
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                    formatter={(val: any) => [`${formatNumber(val)} Siswa`, 'Siswa Baru']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm font-semibold text-gray-600">Belum Ada Data Trend</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: SDM */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1 mt-2">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Sumber Daya Manusia</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guru Status Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col lg:col-span-2 h-[350px]">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <UserCheck size={18} className="text-amber-500" />
              Komposisi Guru / Pegawai
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {(() => {
                const totalGuruPgw = guruStatusData?.reduce((sum, item) => sum + item.value, 0) || 0;
                if (!guruStatusData || guruStatusData.length === 0 || totalGuruPgw === 0) {
                  return <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada data status kepegawaian</div>;
                }
                
                // Urutkan dari jumlah terbanyak
                const sortedData = [...guruStatusData].sort((a, b) => b.value - a.value);

                return (
                  <div className="overflow-hidden rounded-xl border border-gray-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-600">Status Kepegawaian</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-right w-24">Jumlah</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 text-right w-24">Persentase</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedData.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-gray-900 font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color || COLORS[(i + 4) % COLORS.length] }}></div>
                                {d.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-right font-semibold">{formatNumber(d.value)}</td>
                            <td className="px-4 py-3 text-gray-500 text-right">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-gray-100 text-[11px] font-bold">
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

          {/* Rasio Guru:Siswa */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center h-[350px] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-50 rounded-full opacity-50 blur-2xl"></div>
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <Users size={32} />
            </div>
            <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2 relative z-10">Rasio Guru : Siswa</h3>
            <div className="flex items-center justify-center gap-3 relative z-10">
              <span className="text-5xl font-black text-amber-600">1</span>
              <span className="text-3xl font-bold text-gray-300">:</span>
              <span className="text-5xl font-black text-gray-900">{totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-4 max-w-[200px] relative z-10">
              Setiap 1 Guru Aktif rata-rata menangani {totalGuru > 0 ? Math.round(totalMurid / totalGuru) : 0} Siswa Aktif di unit ini.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: Keuangan Unit */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1 mt-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-gray-900">Keuangan Unit</h2>
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 shadow-sm text-white">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 mb-2">Pendapatan Bulan Ini</div>
            <div className="text-3xl font-black">{formatCurrency(penerimaanBulanIni)}</div>
          </div>
          
          <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-5 shadow-sm text-white">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-100 mb-2">Total Piutang (Tunggakan)</div>
            <div className="text-3xl font-black">{formatCurrency(totalTunggakanUnit)}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 shadow-sm text-white">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-2">Kolektibilitas Unit</div>
            <div className="text-3xl font-black">{kolektibilitasUnit === null ? 'N/A' : `${kolektibilitasUnit}%`}</div>
          </div>
        </div>

        {/* Trend Pendapatan & Tunggakan Kritis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[420px]">
            <PendapatanInteractiveChart 
              hariIniData={pendapatanHariIniChart}
              mingguIniData={pendapatanMingguIniChart}
              bulanIniData={pendapatanBulanIniChart}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-[420px]">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 shrink-0">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-500" />
                  Tunggakan Kritis
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
                {tunggakanKritisList && tunggakanKritisList.length > 0 ? (
                  tunggakanKritisList.map((item, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-start justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{item.murid?.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">NIS: {item.murid?.nis}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{item.akun?.nama}</span>
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
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION Peringatan (Data Tidak Lengkap) - Dipindah ke Bawah */}
      {incompleteDataCount > 0 && (
        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Peringatan Sistem</h2>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-rose-800 text-sm">Data Tidak Lengkap Ditemukan</h3>
                <p className="text-xs text-rose-600 mt-1 mb-2">
                  Terdapat <span className="font-bold">{incompleteDataCount} data siswa</span> pada {unitName} yang belum lengkap (NIS/NISN/NIK kosong atau berisi strip). Harap perbarui data.
                </p>
              </div>
            </div>
            <Link
              href="/kelas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              Perbarui Data Murid <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
