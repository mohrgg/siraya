"use client"
import { useState } from "react"
import { Shield, Users, Building, Activity, ShieldAlert, Server, Users2, Banknote, ArrowDownRight, ArrowUpRight, CheckCircle2, LayoutDashboard, MonitorPlay } from "lucide-react"
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
  logs,
  userRolesCount,
  activeUsersToday
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
  logs: any[],
  userRolesCount: any,
  activeUsersToday: number
}) {
  const [activeTab, setActiveTab] = useState<"operasional" | "sistem">("operasional")

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">Command Center</h1>
          <p className="text-text-muted">Pantauan operasional yayasan dan analitik sistem terpusat.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-2 bg-surface/50 p-1.5 rounded-2xl w-max border border-border shadow-sm">
        <button 
          onClick={() => setActiveTab("operasional")} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "operasional" ? "bg-white text-primary shadow-sm border border-gray-100" : "text-text-muted hover:text-text-main hover:bg-gray-50/50"}`}
        >
          <LayoutDashboard size={16} /> Operasional Yayasan
        </button>
        <button 
          onClick={() => setActiveTab("sistem")} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "sistem" ? "bg-white text-primary shadow-sm border border-gray-100" : "text-text-muted hover:text-text-main hover:bg-gray-50/50"}`}
        >
          <MonitorPlay size={16} /> Sistem & Keamanan
        </button>
      </div>

      {/* -------------------- TAB OPERASIONAL -------------------- */}
      {activeTab === "operasional" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shadow-inner border border-purple-100"><Users2 size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">Total Murid Aktif</h3>
              </div>
              <p className="text-3xl font-black text-text-main tracking-tight">{formatNumber(muridCount)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Dalam naungan yayasan</p>
            </div>
            
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner border border-blue-100"><Building size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">Kelas & Rombel</h3>
              </div>
              <p className="text-3xl font-black text-text-main tracking-tight">{formatNumber(kelasCount)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Sub Kelas berjalan</p>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner border border-emerald-100"><ArrowDownRight size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">Pemasukan Kas</h3>
              </div>
              <p className="text-2xl lg:text-xl xl:text-2xl font-black text-emerald-700 tracking-tight">{formatRp(kasIn)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Total Akumulasi Masuk</p>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-inner border border-red-100"><ArrowUpRight size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">Pengeluaran Kas</h3>
              </div>
              <p className="text-2xl lg:text-xl xl:text-2xl font-black text-red-700 tracking-tight">{formatRp(kasOut)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Total Akumulasi Keluar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2"><Building size={20} className="text-purple-600" /> Sebaran Murid per Unit Sekolah</h3>
                  <p className="text-sm text-text-muted mt-1 font-medium">Perbandingan jumlah murid aktif pada masing-masing unit sekolah (SD, SMP, SMK, dst).</p>
                </div>
                <div className="px-4 py-1.5 bg-gray-50 border border-border rounded-lg text-sm font-bold text-text-main shadow-sm">
                  {unitCount} Unit Tersedia
                </div>
              </div>
              <div className="flex-1 w-full h-full min-h-[300px]">
                <UnitDistributionChart data={unitDistribution} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB SISTEM -------------------- */}
      {activeTab === "sistem" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner border border-blue-100"><Users size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">Total Pengguna</h3>
              </div>
              <p className="text-3xl font-black text-text-main tracking-tight">{formatNumber(usersCount)}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Akun Sistem Terdaftar</p>
            </div>
            
            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -z-10"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-inner border border-primary/20"><Activity size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">Pengguna Aktif</h3>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-primary tracking-tight">{formatNumber(activeUsersToday)}</p>
              </div>
              <p className="text-xs text-primary/70 mt-1 font-medium">Akun yang Login Hari Ini</p>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 flex flex-col justify-center">
              <h3 className="font-bold text-text-main text-sm mb-3 px-1 border-b border-border pb-2 flex items-center gap-2"><Shield size={16} className="text-text-muted"/> Komposisi Role</h3>
              <div className="flex flex-col gap-2.5 px-1">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-text-muted">Administrator</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-text-main">{userRolesCount?.ADMIN || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-text-muted">Tata Usaha</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-text-main">{userRolesCount?.TATA_USAHA || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-text-muted">Kepala Sekolah</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-text-main">{userRolesCount?.KEPALA_SEKOLAH || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner border border-emerald-100"><Server size={20} /></div>
                <h3 className="font-bold text-text-main text-sm">System Health</h3>
              </div>
              <div className="flex items-center gap-3 mb-1 mt-1">
                <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-sm border border-white"></span>
                </div>
                <span className="text-base font-black text-emerald-600 tracking-tight">OPERATIONAL</span>
              </div>
              <p className="text-xs text-text-muted mt-2 font-medium">Database Connected • No Errors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Trend Chart */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col min-h-[300px]">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2"><Activity size={20} className="text-blue-600" /> Tren Aktivitas Sistem</h3>
                  <p className="text-sm text-text-muted mt-1 font-medium">Pemantauan lalu lintas interaksi (Login vs Perubahan Data) selama 7 hari terakhir.</p>
                </div>
              </div>
              <div className="flex-1 w-full h-full min-h-[250px]">
                <ActivityChart data={activityData} />
              </div>
            </div>

            {/* Log Aktivitas Terakhir */}
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col h-[400px]">
              <div className="mb-6 shrink-0 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2"><ShieldAlert size={20} className="text-amber-600" /> Jejak Audit (Log)</h3>
                  <p className="text-sm text-text-muted mt-1 font-medium">Rekaman sistem real-time.</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                      <div key={log.id} className="p-3 rounded-2xl border border-border/50 bg-gray-50/50 flex gap-3 hover:bg-white hover:shadow-sm transition-all hover:border-gray-200">
                        <div className="mt-1 shrink-0">
                          {isLogin ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100"><CheckCircle2 size={16} /></div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner border border-blue-100"><Activity size={16} /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1.5 gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor} shrink-0`}>
                              {log.aksi.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] font-bold text-text-muted/70 whitespace-nowrap">{timeAgo(log.createdAt)}</span>
                          </div>
                          <p className="text-sm font-semibold text-text-main line-clamp-2 leading-snug">{log.keterangan}</p>
                          <p className="text-[11px] font-medium text-text-muted mt-1.5">Oleh: <span className="font-bold text-text-main">{log.pengguna?.name}</span> <span className="text-gray-400">({log.pengguna?.role})</span></p>
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="text-center py-10 flex flex-col items-center">
                      <ShieldAlert size={32} className="text-gray-300 mb-3" />
                      <p className="text-sm font-bold text-text-main">Belum ada log aktivitas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
