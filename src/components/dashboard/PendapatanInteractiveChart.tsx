"use client"

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Calendar, CalendarDays, Clock, Wallet } from 'lucide-react'

interface PendapatanInteractiveChartProps {
  hariIniData: any[]
  mingguIniData: any[]
  bulanIniData: any[]
  perUnitData?: any[]
}

const formatCurrency = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0)

export default function PendapatanInteractiveChart({ hariIniData, mingguIniData, bulanIniData, perUnitData = [] }: PendapatanInteractiveChartProps) {
  const [activeTab, setActiveTab] = useState<'hari' | 'minggu' | 'bulan' | 'unit'>('hari')

  const data = activeTab === 'hari' ? hariIniData : activeTab === 'minggu' ? mingguIniData : activeTab === 'bulan' ? bulanIniData : perUnitData
  const maxBarSize = activeTab === 'unit' ? 40 : activeTab === 'bulan' ? 15 : activeTab === 'minggu' ? 40 : 30
  const color = activeTab === 'hari' ? '#3b82f6' : activeTab === 'minggu' ? '#f59e0b' : activeTab === 'bulan' ? '#10b981' : '#8b5cf6'

  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col w-full h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Wallet size={18} className={activeTab === 'hari' ? "text-blue-500" : activeTab === 'minggu' ? "text-amber-500" : activeTab === 'bulan' ? "text-emerald-500" : "text-purple-500"} />
            Pendapatan {activeTab === 'hari' ? 'Hari Ini' : activeTab === 'minggu' ? 'Minggu Ini' : activeTab === 'bulan' ? 'Bulan Ini' : 'Per Unit (Bulan Ini)'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Total: <span className="font-bold text-gray-700">{formatCurrency(totalValue)}</span></p>
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => setActiveTab('hari')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'hari' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Clock size={14} />
            Hari Ini
          </button>
          <button 
            onClick={() => setActiveTab('minggu')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'minggu' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar size={14} />
            Minggu Ini
          </button>
          <button 
            onClick={() => setActiveTab('bulan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'bulan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarDays size={14} />
            Bulan Ini
          </button>
          {perUnitData && perUnitData.length > 0 && (
            <button 
              onClick={() => setActiveTab('unit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'unit' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Wallet size={14} />
              Per Unit
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
          <div className="flex items-center justify-center h-full text-xs text-gray-400">Belum ada transaksi pada periode ini.</div>
        )}
      </div>
    </div>
  )
}
