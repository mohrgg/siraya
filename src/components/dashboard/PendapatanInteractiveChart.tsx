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
    : "bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col w-full h-full transition-colors"

  return (
    <div className={containerClasses}>
      {/* Two-Tier Header: Anti-Overflow & Responsive */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              activeTab === 'hari' 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" 
                : activeTab === 'minggu' 
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" 
                : activeTab === 'bulan' 
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
            }`}>
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-text-main text-sm sm:text-base truncate">
                {title || (activeTab === 'hari' ? 'Arus Kas Hari Ini' : activeTab === 'minggu' ? 'Arus Kas Minggu Ini' : activeTab === 'bulan' ? 'Arus Kas Bulan Ini' : 'Arus Kas per Unit')}
              </h3>
              <p className="text-[11px] text-text-muted truncate">Penerimaan & pembayaran terverifikasi</p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-xs sm:text-sm font-black text-text-main bg-bg border border-border px-2.5 py-1 rounded-lg inline-block whitespace-nowrap shadow-xs">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        {/* Full-width Responsive Segmented Control */}
        <div className={`grid ${perUnitData && perUnitData.length > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 bg-bg border border-border p-1 rounded-xl w-full select-none`}>
          <button 
            type="button"
            onClick={() => setActiveTab('hari')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
              activeTab === 'hari' 
                ? 'bg-surface text-blue-600 dark:text-blue-400 shadow-xs' 
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Hari Ini"
          >
            <span className="truncate">Hari Ini</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('minggu')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
              activeTab === 'minggu' 
                ? 'bg-surface text-amber-600 dark:text-amber-400 shadow-xs' 
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Minggu Ini"
          >
            <span className="truncate">Minggu</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('bulan')}
            className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
              activeTab === 'bulan' 
                ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs' 
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Bulan Ini"
          >
            <span className="truncate">Bulan</span>
          </button>
          {perUnitData && perUnitData.length > 0 && (
            <button 
              type="button"
              onClick={() => setActiveTab('unit')}
              className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate cursor-pointer ${
                activeTab === 'unit' 
                  ? 'bg-surface text-purple-600 dark:text-purple-400 shadow-xs' 
                  : 'text-text-muted hover:text-text-main'
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'currentColor' }} 
                className="text-text-muted font-medium"
                tickMargin={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-text-muted font-medium"
                tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`}
                tickMargin={10}
                width={70}
              />
              <Tooltip 
                cursor={{ fill: 'currentColor', opacity: 0.06 }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--surface)', 
                  color: 'var(--text-main)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '10px 14px' 
                }} 
                formatter={(val: any) => [formatCurrency(Number(val)), 'Pemasukan']}
                labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={maxBarSize}>
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-text-muted">
            <div className="w-12 h-12 rounded-2xl bg-bg border border-border flex items-center justify-center mb-3 text-text-muted shadow-2xs">
              <Wallet size={22} />
            </div>
            <p className="text-sm font-bold text-text-main">Belum ada penerimaan kas pada {activeTab === 'hari' ? 'hari ini' : activeTab === 'minggu' ? 'minggu ini' : activeTab === 'bulan' ? 'bulan ini' : 'periode ini'}</p>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
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
