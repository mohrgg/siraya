'use client'

import { Users, BookOpen, Layers, GraduationCap, BarChart2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ReferenceLine } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

const CustomReferenceLabel = (props: any) => {
  const { viewBox } = props;
  return (
    <g>
      <rect x={viewBox.width / 2 - 50} y={viewBox.y - 12} width={100} height={20} fill="rgba(255, 255, 255, 0.9)" rx={4} />
      <text x={viewBox.width / 2} y={viewBox.y + 3} fill="#ef4444" fontSize={11} fontWeight="bold" textAnchor="middle">
        Batas Ideal (30)
      </text>
    </g>
  );
};

export default function AdminUnitDashboard(props: any) {
  const { unitName, totalMurid, totalSubKelas, totalJurusan, statusData, paralelData, tingkatDistribution, genderData, ageData } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Detail Unit: {unitName}</h1>
        <p className="text-gray-500 mt-1">Analisis mendalam mengenai demografi siswa dan kepadatan kelas.</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center"><Users size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Siswa Aktif</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalMurid)}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Layers size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Kelas Berjalan (Rombel)</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalSubKelas)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><BookOpen size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Jurusan</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalJurusan)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar: Distribusi Siswa per Tingkat */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Layers size={20} className="text-blue-500"/> Distribusi Siswa per Tingkat</h3>
          <p className="text-xs text-gray-500 mb-4">Total keseluruhan siswa berdasarkan tingkat kelas.</p>
          <div className="h-72">
            {tingkatDistribution && tingkatDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tingkatDistribution} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" name="Total Siswa" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Tidak ada data tingkat kelas.</div>
            )}
          </div>
        </div>

        {/* Bar: Rentang Usia Siswa */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Users size={20} className="text-emerald-500"/> Demografi Usia Siswa</h3>
          <p className="text-xs text-gray-500 mb-4">Persebaran umur siswa saat ini (berdasarkan Tanggal Lahir).</p>
          <div className="h-72">
            {ageData && ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="total" name="Jumlah Siswa" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data tanggal lahir.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kepadatan Kelas / Rata-rata Paralel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><BarChart2 size={20} className="text-amber-500"/> Kepadatan Siswa per Tingkat</h3>
          <p className="text-xs text-gray-500 mb-6">
            Rata-rata jumlah siswa di dalam satu rombongan belajar (rombel). Idealnya &lt; 30 siswa per kelas.
          </p>
          <div className="h-64">
            {paralelData && paralelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paralelData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tingkat" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Bar dataKey="average" name="Rata-rata per Kelas" radius={[4, 4, 0, 0]} barSize={40}>
                    {paralelData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.average > 30 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Bar>
                  <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={<CustomReferenceLabel />} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Tidak ada kelas berjalan.</div>
            )}
          </div>
        </div>

        {/* Gender Global */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1 flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-2 w-full text-center">Komposisi Gender Unit</h3>
          <div className="h-64 w-full mt-2">
            {genderData && genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={75} outerRadius={100} paddingAngle={5} dataKey="value">
                    {genderData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400 text-sm">Belum ada data gender.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

