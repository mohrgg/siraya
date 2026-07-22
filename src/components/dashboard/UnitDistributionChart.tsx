"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function UnitDistributionChart({ data }: { data: { name: string, total: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted">
        <p className="font-semibold">Belum ada data unit sekolah</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
        <YAxis 
          type="category" 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: '#64748B' }}
          width={80}
        />
        <Tooltip 
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
