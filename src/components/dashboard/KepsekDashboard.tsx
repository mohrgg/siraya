'use client'

import { Building, Users, LayoutDashboard, Calendar, GraduationCap, CheckCircle2, TrendingUp, TrendingDown, BookOpen } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function KepsekDashboard(props: any) {
  const { 
    activeUnit, activeYear, totalMurid, totalRombel, totalJurusan, 
    dataQualityScore, jobData, topCrowded, topEmpty, retentionData, 
    jenjangData, genderData, statusData, anomalyList, capacityData
  } = props

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num)

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
    <div className="flex flex-col gap-6 pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Kepala Sekolah</h1>
        <p className="text-gray-500 mt-1">Ringkasan eksekutif laporan data akademik untuk pimpinan.</p>
      </div>

      {/* Info Bar Yayasan & Unit */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap items-center gap-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-blue-600 rounded-lg flex items-center justify-center shadow-sm border border-blue-100">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium">Unit Aktif</p>
            <p className="text-sm font-bold text-gray-900">{activeUnit?.name || '-'}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-blue-200 hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-blue-600 rounded-lg flex items-center justify-center shadow-sm border border-blue-100">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs text-blue-600 font-medium">Tahun Akademik</p>
            <p className="text-sm font-bold text-gray-900">{activeYear?.name || '-'}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-blue-200 hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-emerald-600 rounded-lg flex items-center justify-center shadow-sm border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-medium">Skor Kualitas Data</p>
            <p className={`text-sm font-bold ${dataQualityScore >= 90 ? 'text-emerald-700' : 'text-amber-600'}`}>{dataQualityScore}% Lengkap</p>
          </div>
        </div>
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
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><GraduationCap size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Kelas Berjalan</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalRombel)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><BookOpen size={20} /></div>
            <h3 className="font-bold text-gray-700 text-sm">Total Jurusan</h3>
          </div>
          <p className="text-3xl font-black text-gray-900">{formatNumber(totalJurusan)}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Target vs Kapasitas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center">
          <h3 className="font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
            Pencapaian Target Siswa
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">DUMMY</span>
          </h3>
          <div className="relative w-full h-12 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            {capacityData && (
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((capacityData.actual / capacityData.target) * 100, 100)}%` }}
              ></div>
            )}
            {capacityData && capacityData.actual >= capacityData.target && (
              <div className="absolute top-0 left-0 w-full h-full bg-emerald-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white tracking-wider">TARGET TERCAPAI</span>
              </div>
            )}
          </div>
          {capacityData && (
            <div className="flex justify-between w-full mt-3 px-2">
              <div className="text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Siswa Saat Ini</p>
                <p className="text-lg font-black text-gray-900">{formatNumber(capacityData.actual)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Target</p>
                <p className="text-lg font-black text-gray-900">{formatNumber(capacityData.target)}</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-6 text-center italic">*Target diambil berdasarkan pertumbuhan tahunan (asumsi +10%).</p>
        </div>
      </div>
    </div>
  )
}
