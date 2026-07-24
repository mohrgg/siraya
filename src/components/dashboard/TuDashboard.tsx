'use client'

import { Users, AlertCircle, UserPlus, FileEdit, UserCheck, LayoutDashboard, Calendar, History, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function TuDashboard(props: any) {
  const { 
    activeUnit, activeYear, totalMurid, totalRombel, totalJurusan, 
    rombelData, capacityWarnings, genderData, statusData, anomalyList, missingParent, mutationLogs, parentData 
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Detail Unit: {activeUnit?.name}</h1>
          <p className="text-gray-500 mt-1">Dashboard operasional khusus unit sekolah Anda.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-primary shadow-sm">
            <LayoutDashboard size={14} /> Unit: {activeUnit?.name}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 shadow-sm">
            <Calendar size={14} /> Tahun: {activeYear?.name || '-'}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS & METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2"><Users size={18} className="text-blue-500" /><h3 className="font-bold text-gray-500 text-sm">Siswa Aktif</h3></div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(totalMurid)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2"><LayoutDashboard size={18} className="text-emerald-500" /><h3 className="font-bold text-gray-500 text-sm">Rombel Aktif</h3></div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(totalRombel)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2"><FileEdit size={18} className="text-purple-500" /><h3 className="font-bold text-gray-500 text-sm">Total Jurusan</h3></div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(totalJurusan)}</p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 bg-primary/5 rounded-2xl border border-primary/20 p-4 shadow-sm flex flex-col gap-2 justify-center">
          <h3 className="font-bold text-primary text-xs uppercase tracking-wider mb-1">Jalur Cepat</h3>
          <Link href="/kelas?tab=murid" className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold py-2 px-3 rounded-lg border border-gray-200 transition-colors">
            <UserPlus size={16} className="text-primary"/> Tambah Murid
          </Link>
          <Link href="/kelas" className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-800 text-sm font-bold py-2 px-3 rounded-lg border border-gray-200 transition-colors">
            <LayoutDashboard size={16} className="text-primary"/> Kelola Kelas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tugas Hari Ini & Warnings */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-600" />
              <h3 className="font-bold text-red-800 text-sm">Tugas Perbaikan Data</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {anomalyList.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><UserCheck size={14} className="text-red-600"/></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{anomalyList.length} Siswa Tanpa Identitas</p>
                    <p className="text-xs text-gray-500 mt-0.5">Siswa memiliki NIK/NISN kosong. Harap lengkapi.</p>
                  </div>
                </div>
              )}
              
              {missingParent > 0 && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Users size={14} className="text-amber-600"/></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{missingParent} Data Ortu Kosong</p>
                    <p className="text-xs text-gray-500 mt-0.5">Data ayah/ibu siswa belum lengkap di-input.</p>
                  </div>
                </div>
              )}

              {capacityWarnings.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><AlertCircle size={14} className="text-purple-600"/></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{capacityWarnings.length} Kelas Kelebihan Kapasitas</p>
                    <p className="text-xs text-gray-500 mt-0.5">Terdapat rombel dengan lebih dari 35 siswa.</p>
                  </div>
                </div>
              )}

              {anomalyList.length === 0 && missingParent === 0 && capacityWarnings.length === 0 && (
                <p className="text-sm text-emerald-600 font-medium text-center py-4">Semua data dan kapasitas dalam kondisi baik!</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><History size={16}/> Mutasi Terbaru</h3>
            <div className="flex flex-col gap-3">
              {mutationLogs.length > 0 ? mutationLogs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{log.name}</p>
                    <p className="text-xs text-gray-500">{new Date(log.updatedAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">{log.status}</span>
                </div>
              )) : (
                <p className="text-xs text-gray-500 text-center py-2">Tidak ada mutasi/keluar bulan ini.</p>
              )}
            </div>
          </div>
        </div>

        {/* Charts & Tables */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-1">Kapasitas Kelas</h3>
            <p className="text-xs text-gray-500 mb-4">Jumlah siswa per rombongan belajar.</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rombelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Bar dataKey="total" name="Siswa" radius={[4, 4, 0, 0]}>
                    {rombelData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 35 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
              <h3 className="font-bold text-gray-800 mb-2 w-full text-center text-sm">Kelengkapan Wali</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={parentData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {parentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
              <h3 className="font-bold text-gray-800 mb-2 w-full text-center text-sm">Gender Siswa</h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {genderData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899', '#94a3b8'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
