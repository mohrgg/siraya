"use client"

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar, CalendarDays, Clock, Wallet } from 'lucide-react'

interface PendapatanInteractiveChartProps {
  hariIniData: any[]
  mingguIniData: any[]
  bulanIniData: any[]
  perUnitData?: any[]
  title?: string
  hideContainerCard?: boolean
}

const formatCurrency = (num: number) => `Rp ${new Intl.NumberFormat('id-ID').format(num || 0)}`

export default function PendapatanInteractiveChart({ 
  hariIniData, mingguIniData, bulanIniData, perUnitData = [],
  title, hideContainerCard = false
}: PendapatanInteractiveChartProps) {
  const [activeTab, setActiveTab] = useState<'hari' | 'minggu' | 'bulan' | 'unit'>('hari')

  const data = activeTab === 'hari' ? hariIniData : activeTab === 'minggu' ? mingguIniData : activeTab === 'bulan' ? bulanIniData : perUnitData
  const maxBarSize = activeTab === 'unit' ? 40 : activeTab === 'bulan' ? 15 : activeTab === 'minggu' ? 40 : 30
  const color = activeTab === 'hari' ? '#3b82f6' : activeTab === 'minggu' ? '#f59e0b' : activeTab === 'bulan' ? '#10b981' : '#8b5cf6'

  const totalValue = data.reduce((acc, curr) => acc + (curr.value || 0), 0)

  const containerClasses = hideContainerCard 
    ? "flex flex-col w-full h-full" 
    : "bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col w-full h-full"

  return (
    <div className={containerClasses}>
      {/* Two-Tier Header: Anti-Overflow & Responsive */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              activeTab === 'hari' ? "bg-blue-50 text-blue-600" : activeTab === 'minggu' ? "bg-amber-50 text-amber-600" : activeTab === 'bulan' ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
            }`}>
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {title || (activeTab === 'hari' ? 'Arus Kas Hari Ini' : activeTab === 'minggu' ? 'Arus Kas Minggu Ini' : activeTab === 'bulan' ? 'Arus Kas Bulan Ini' : 'Arus Kas per Unit')}
              </h3>
              <p className="text-[11px] text-gray-400 truncate">Penerimaan & pembayaran terverifikasi</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-xs sm:text-sm font-black text-gray-900 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap shadow-xs">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        {/* Full-width Responsive Segmented Control (Zero Overflow Guarantee) */}
        <div className={`grid ${perUnitData && perUnitData.length > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 bg-gray-100/90 p-1 rounded-xl w-full select-none`}>
          <button 
            type="button"
            onClick={() => setActiveTab('hari')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
              activeTab === 'hari' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Hari Ini"
          >
            <span className="truncate">Hari Ini</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('minggu')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
              activeTab === 'minggu' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Minggu Ini"
          >
            <span className="truncate">Minggu</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('bulan')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
              activeTab === 'bulan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Bulan Ini"
          >
            <span className="truncate">Bulan</span>
          </button>
          {perUnitData && perUnitData.length > 0 && (
            <button 
              type="button"
              onClick={() => setActiveTab('unit')}
              className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate ${
                activeTab === 'unit' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Per Unit Sekolah"
            >
              <span className="truncate">Per Unit</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {data && data.length > 0 && totalValue > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                tickMargin={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`}
                tickMargin={10}
                width={70}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px 14px' }} 
                formatter={(val: any) => [formatCurrency(Number(val)), 'Pemasukan']}
                labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={maxBarSize}>
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-300 shadow-2xs">
              <Wallet size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">Belum ada penerimaan kas pada {activeTab === 'hari' ? 'hari ini' : activeTab === 'minggu' ? 'minggu ini' : activeTab === 'bulan' ? 'bulan ini' : 'periode ini'}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {activeTab === 'hari' 
                ? 'Transaksi penerimaan kas yang masuk hari ini akan otomatis terpetakan per jam secara real-time.' 
                : 'Belum ada transaksi penerimaan kas masuk terverifikasi pada rentang waktu ini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
