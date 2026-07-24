'use client'

import { Activity, ShieldAlert, Zap } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis } from 'recharts'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function AdminOperasionalDashboard(props: any) {
  const { trendData, modulData, roleData, heatmapData, leaderboard, recentLogs } = props

  // Filter out 0 value for heatmap to make it clean
  const cleanHeatmap = heatmapData.filter((d: any) => d.value > 0)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Operasional</h1>
        <p className="text-gray-500 mt-1">Monitoring kesehatan sistem, audit trail, dan aktivitas pengguna.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Tren 30 Hari */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Activity size={20} className="text-primary"/> Tren Aktivitas Sistem (30 Hari)</h3>
          <p className="text-xs text-gray-500 mb-6">Total interaksi dan aksi yang dicatat sistem setiap harinya.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap: Waktu Sibuk */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Zap size={20} className="text-amber-500"/> Peta Waktu Sibuk (Heatmap)</h3>
          <p className="text-xs text-gray-500 mb-2">Hari dan Jam saat sistem paling banyak diakses.</p>
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                <XAxis type="number" dataKey="hour" name="Jam" unit=":00" tick={{fontSize: 10}} domain={[0, 23]} tickCount={12} />
                <YAxis type="category" dataKey="dayName" name="Hari" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="value" range={[20, 400]} name="Aktivitas" />
                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                <Scatter data={cleanHeatmap} fill="#f59e0b" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Aktivitas Berdasarkan Modul */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1 flex flex-col items-center">
          <h3 className="font-bold text-gray-800 mb-2 w-full text-center">Penggunaan Modul</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modulData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {modulData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '11px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-1 overflow-hidden flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4">Top 10 Pengguna Teraktif</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex flex-col gap-3">
              {leaderboard.length > 0 ? leaderboard.map((user: any, i: number) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{user.name}</p>
                      <p className="text-[10px] font-medium text-gray-500">{user.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{user.count} aksi</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center mt-4">Belum ada aktivitas.</p>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Audit Trail */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-800">Log Aktivitas Terbaru (Audit Trail)</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/80">
                <tr>
                  <th className="px-5 py-3 font-bold">Waktu</th>
                  <th className="px-5 py-3 font-bold">Pengguna</th>
                  <th className="px-5 py-3 font-bold">Aksi / Modul</th>
                  <th className="px-5 py-3 font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLogs.map((log: any) => {
                  const dateObj = new Date(log.createdAt)
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-gray-500">
                        {dateObj.toLocaleDateString('id-ID')} <br/> {dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-5 py-3 font-bold text-gray-700">{log.penggunaName}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 mb-1">
                          {log.aksi}
                        </span>
                        <br/>
                        <span className="text-[10px] text-gray-500 font-medium">{log.modul}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 line-clamp-2" title={log.keterangan}>
                        {log.keterangan}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
