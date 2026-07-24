'use client'

import { Users, Building, Layers, ShieldCheck, Gauge, TrendingUp, MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, AreaChart, Area, Treemap } from 'recharts'
import React from 'react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function AdminDashboard(props: any) {
  const { 
    usersCount, unitCount, rombelCount, muridCount, 
    units, unitDistribution, scholarshipData, genderData, 
    dataQualityIndex, trendData, districtData, classEfficiency, statusDataGlobal 
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Yayasan</h1>
        <p className="text-gray-500 mt-1">Ringkasan eksekutif seluruh unit sekolah di bawah yayasan.</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Users size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Siswa Aktif</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(muridCount)}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Building size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Unit Sekolah</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(unitCount)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Layers size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Rombel</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(rombelCount)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Pengguna</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(usersCount)}</p>
        </div>
      </div>

      {/* NEW WIDGETS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Quality Gauge / Index */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Gauge size={20} className="text-primary"/> Indeks Kualitas Data</h3>
          <p className="text-xs text-gray-500 mb-6">Persentase kelengkapan data NIK, NISN, dan Wali</p>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
              <circle cx="50" cy="50" r="40" stroke={dataQualityIndex >= 90 ? '#10b981' : dataQualityIndex >= 70 ? '#f59e0b' : '#ef4444'} strokeWidth="12" fill="none" 
                strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * dataQualityIndex) / 100} strokeLinecap="round" 
                className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{dataQualityIndex}%</span>
            </div>
          </div>
        </div>

        {/* Tren Pertumbuhan Siswa */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500"/> Tren Penambahan Siswa 
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">DUMMY</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4">Pertumbuhan jumlah murid dalam 5 tahun terakhir (contoh data).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 2: Bar & Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rasio Efisiensi Kelas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-1">Rasio Kepadatan Kelas (Siswa/Rombel)</h3>
          <p className="text-xs text-gray-500 mb-6">Melihat unit mana yang kelebihan atau kekurangan kapasitas per kelas.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classEfficiency} layout="vertical" margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="ratio" radius={[0, 4, 4, 0]}>
                  {classEfficiency.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.ratio > 35 ? '#ef4444' : entry.ratio < 20 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Ideal (20-35)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Padat (&gt;35)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Sepi (&lt;20)</span>
          </div>
        </div>

        {/* Peta Wilayah Asal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><MapPin size={20} className="text-red-500"/> Pemetaan Asal Siswa (Kecamatan)</h3>
          <p className="text-xs text-gray-500 mb-2">Distribusi tempat tinggal siswa terbanyak.</p>
          <div className="h-72">
            {districtData && districtData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" name="Jumlah Siswa" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data alamat/kecamatan.</div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Existing Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-4 w-full text-center">Status Beasiswa</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={scholarshipData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value">
                  {scholarshipData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-4 w-full text-center">Demografi Gender</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value">
                  {genderData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-4 w-full text-center">Status Siswa</h3>
          <div className="h-48 w-full">
            {statusDataGlobal && statusDataGlobal.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDataGlobal} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value">
                    {statusDataGlobal.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data status.</div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}
