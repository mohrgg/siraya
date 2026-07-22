"use client"

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ArrowLeft, ArrowDownAZ, ArrowDown01 } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

type RombelData = {
  name: string
  total: number
}

type UnitData = {
  name: string
  total: number
  rombel?: RombelData[]
}

export default function UnitDistributionChart({ data }: { data: UnitData[] }) {
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null)
  const [sortMode, setSortMode] = useState<'name' | 'total'>('name')

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted">
        <p className="font-semibold">Belum ada data unit sekolah</p>
      </div>
    )
  }

  const handleBarClick = (entry: any) => {
    // Only drill down if it's the main unit chart and the unit has rombels
    if (!selectedUnit) {
      const unit = data.find(u => u.name === entry.name)
      if (unit && unit.rombel && unit.rombel.length > 0) {
        setSelectedUnit(unit)
      }
    }
  }

  const chartData = useMemo(() => {
    const sourceData = selectedUnit ? selectedUnit.rombel : data
    if (!sourceData) return []

    // Copy array before sorting
    let sorted = [...sourceData]
    
    if (selectedUnit) {
      if (sortMode === 'name') {
        // Sort alphabetically by default (Kelas 1, Kelas 2, etc), respecting numeric order
        sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
      } else {
        // Sort by total (descending)
        sorted.sort((a, b) => b.total - a.total)
      }
    } else {
      // Main unit chart default sort (usually keep original or sort by total if desired)
      // I'll keep the original order (SD, SMP, SMK, etc) as it usually has a natural hierarchy
    }

    return sorted
  }, [selectedUnit, data, sortMode])

  return (
    <div className="w-full h-full flex flex-col relative">
      {selectedUnit && (
        <div className="flex justify-between items-center mb-4 animate-in fade-in zoom-in duration-300 px-4">
          <h4 className="text-sm font-bold text-primary bg-primary/10 inline-block px-3 py-1.5 rounded-full">
            Sebaran Rombel: {selectedUnit.name}
          </h4>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortMode(prev => prev === 'name' ? 'total' : 'name')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-colors shadow-sm border border-gray-200"
              title={sortMode === 'name' ? "Urutkan Paling Banyak" : "Urutkan Nama Kelas"}
            >
              {sortMode === 'name' ? <ArrowDown01 size={14} /> : <ArrowDownAZ size={14} />}
              {sortMode === 'name' ? "Sort: Jumlah" : "Sort: Nama"}
            </button>
            <button 
              onClick={() => setSelectedUnit(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors shadow-sm border border-gray-200"
            >
              <ArrowLeft size={14} /> Kembali
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 30, left: -20, bottom: 5 }} 
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
              labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
              itemStyle={{ fontWeight: 'bold', color: '#334155' }}
            />
            <Bar 
              dataKey="total" 
              radius={[0, 4, 4, 0]} 
              barSize={selectedUnit ? 20 : 28}
              onClick={handleBarClick}
              className={!selectedUnit ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
            >
              {chartData?.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={selectedUnit ? '#8b5cf6' : COLORS[index % COLORS.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
