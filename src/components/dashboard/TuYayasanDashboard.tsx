'use client'

import { Info, Calendar, Bell, Users, Building2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TuYayasanDashboard(props: any) {
  const { units, totalSiswa, unitData, academicYear } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ringkasan Yayasan</h1>
        <p className="text-gray-500 mt-1">Informasi global yayasan. Pilih tab Unit Aktif untuk melakukan operasional harian.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info & Metrics */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={24} /></div>
              <div>
                <p className="text-sm font-bold text-gray-500">Total Siswa Yayasan</p>
                <p className="text-2xl font-black text-gray-900">{formatNumber(totalSiswa)}</p>
              </div>
            </div>
            <div className="w-full h-px bg-gray-100"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Building2 size={24} /></div>
              <div>
                <p className="text-sm font-bold text-gray-500">Total Unit Sekolah</p>
                <p className="text-2xl font-black text-gray-900">{units.length} Unit</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary"/> Informasi Akademik</h3>
            {academicYear ? (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Tahun Akademik Aktif</p>
                <p className="text-lg font-black text-gray-900">{academicYear.name}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada tahun akademik yang diset aktif.</p>
            )}
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Bell size={18} /> Papan Pengumuman</h3>
            <p className="text-sm text-amber-700 leading-relaxed font-medium">
              Selamat datang di SIRAYA (Sistem Informasi Yayasan). Harap pastikan kelengkapan data siswa (NIK dan NISN) diisi dengan benar untuk keperluan sinkronisasi dapodik bulanan.
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Info size={20} className="text-gray-400"/> Distribusi Siswa Antar Unit</h3>
          <p className="text-xs text-gray-500 mb-6">Informasi perbandingan jumlah siswa pada seluruh unit di bawah yayasan.</p>
          <div className="h-72">
            {unitData && unitData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" name="Total Siswa" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data murid.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
