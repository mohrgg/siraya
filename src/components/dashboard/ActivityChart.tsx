"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ActivityChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted">
        <p className="font-semibold">Belum ada data aktivitas</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#64748B' }}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Line type="monotone" name="Total Aktivitas" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
        <Line type="monotone" name="Aktivitas Login" dataKey="login" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        <Line type="monotone" name="Perubahan Data" dataKey="mutation" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
