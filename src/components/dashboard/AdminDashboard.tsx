import { Shield, Users, Building, Activity, ShieldAlert, Server, Users2, Banknote, ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react"
import ActivityChart from "./ActivityChart"
import UnitDistributionChart from "./UnitDistributionChart"

export default function AdminDashboard({ 
  usersCount, 
  unitCount, 
  divisiCount,
  muridCount,
  kelasCount,
  kasIn,
  kasOut,
  unitDistribution,
  activityData,
  logs 
}: { 
  usersCount: number, 
  unitCount: number, 
  divisiCount: number, 
  muridCount: number,
  kelasCount: number,
  kasIn: number,
  kasOut: number,
  unitDistribution: any[],
  activityData: any[],
  logs: any[] 
}) {
  // Format date helper
  const timeAgo = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000)
    if (diff < 1) return "Baru saja"
    if (diff < 60) return `${diff} menit lalu`
    if (diff < 1440) return `${Math.floor(diff/60)} jam lalu`
    return `${Math.floor(diff/1440)} hari lalu`
  }

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">Command Center</h1>
        <p className="text-text-muted">Pantauan keamanan, operasional data sekolah, dan analitik sistem.</p>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><Users size={18} /></div>
            <h3 className="font-bold text-text-main text-sm">Akun Sistem</h3>
          </div>
          <p className="text-3xl font-extrabold text-text-main">{formatNumber(usersCount)}</p>
          <p className="text-xs text-text-muted mt-1 font-medium">User Terdaftar</p>
        </div>
        
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Building size={18} /></div>
            <h3 className="font-bold text-text-main text-sm">Unit & Divisi</h3>
          </div>
          <p className="text-3xl font-extrabold text-text-main">{unitCount} <span className="text-lg text-text-muted">/ {divisiCount}</span></p>
          <p className="text-xs text-text-muted mt-1 font-medium">Unit Sekolah & Divisi</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center"><Users2 size={18} /></div>
            <h3 className="font-bold text-text-main text-sm">Murid & Kelas</h3>
          </div>
          <p className="text-3xl font-extrabold text-text-main">{formatNumber(muridCount)}</p>
          <p className="text-xs text-text-muted mt-1 font-medium">Dalam {kelasCount} Rombel/Kelas</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Server size={18} /></div>
            <h3 className="font-bold text-text-main text-sm">System Health</h3>
          </div>
          <div className="flex items-center gap-2 mb-1 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-bold text-emerald-600">Operational</span>
          </div>
          <p className="text-xs text-text-muted mt-2 font-medium">Database Connected</p>
        </div>
      </div>

      {/* Row 2: Finance & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agregat Keuangan (Ringkas) */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-gray-50/50">
            <h3 className="font-bold flex items-center gap-2"><Banknote size={18} className="text-emerald-600" /> Ringkasan Keuangan Global</h3>
            <p className="text-xs text-text-muted mt-1">Total arus kas seluruh unit sekolah.</p>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><ArrowDownRight size={14} className="text-emerald-700" /></div>
                <p className="text-sm font-semibold text-text-muted">Total Kas Masuk</p>
              </div>
              <p className="text-2xl font-extrabold text-emerald-700">{formatRp(kasIn)}</p>
            </div>
            <div className="h-px bg-border w-full"></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center"><ArrowUpRight size={14} className="text-red-700" /></div>
                <p className="text-sm font-semibold text-text-muted">Total Kas Keluar</p>
              </div>
              <p className="text-2xl font-extrabold text-red-700">{formatRp(kasOut)}</p>
            </div>
          </div>
        </div>

        {/* Activity Trend Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col min-h-[300px]">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2"><Activity size={18} className="text-blue-600" /> Tren Aktivitas Sistem (7 Hari Terakhir)</h3>
            <p className="text-xs text-text-muted mt-1">Memantau lalu lintas login dan mutasi data oleh pengguna.</p>
          </div>
          <div className="flex-1 w-full h-full min-h-[200px]">
            <ActivityChart data={activityData} />
          </div>
        </div>
      </div>

      {/* Row 3: Sebaran Murid & Log Aktivitas Lengkap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Sebaran Murid Chart */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm min-h-[400px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2"><Building size={18} className="text-purple-600" /> Sebaran Murid per Unit Sekolah</h3>
            <p className="text-xs text-text-muted mt-1">Perbandingan jumlah murid aktif pada masing-masing unit.</p>
          </div>
          <div className="flex-1 w-full h-full min-h-[250px]">
            <UnitDistributionChart data={unitDistribution} />
          </div>
        </div>

        {/* Log Aktivitas Terakhir */}
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
          <div className="mb-4 shrink-0 flex justify-between items-center">
            <div>
              <h3 className="font-bold flex items-center gap-2"><ShieldAlert size={18} className="text-amber-600" /> Log Aktivitas Terakhir</h3>
              <p className="text-xs text-text-muted mt-1">Jejak rekaman sistem waktu nyata.</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="flex flex-col gap-3">
              {logs && logs.length > 0 ? logs.map(log => {
                const isLogin = log.aksi.includes("LOGIN")
                const isDelete = log.aksi.includes("HAPUS") || log.aksi.includes("NONAKTIF")
                const isCreate = log.aksi.includes("TAMBAH")
                
                let badgeColor = "bg-blue-100 text-blue-700 border-blue-200"
                if (isLogin) badgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200"
                else if (isDelete) badgeColor = "bg-red-100 text-red-700 border-red-200"
                else if (isCreate) badgeColor = "bg-purple-100 text-purple-700 border-purple-200"
                
                return (
                  <div key={log.id} className="p-3 rounded-xl border border-border/50 bg-gray-50/30 flex gap-4">
                    <div className="mt-1">
                      {isLogin ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle2 size={16} /></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Activity size={16} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {log.aksi.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-medium text-text-muted whitespace-nowrap">{timeAgo(log.createdAt)}</span>
                      </div>
                      <p className="text-sm font-medium text-text-main line-clamp-2">{log.keterangan}</p>
                      <p className="text-xs text-text-muted mt-1">Oleh: <span className="font-semibold text-text-main">{log.pengguna?.name}</span></p>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-center py-10 text-sm text-text-muted">Belum ada log aktivitas.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
