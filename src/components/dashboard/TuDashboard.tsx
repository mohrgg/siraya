import { Wallet, ArrowUpRight, ArrowDownRight, Activity, Users, FileText, GraduationCap, Building } from "lucide-react"
import CashFlowChart from "./CashFlowChart"
import StudentDemographicChart from "./StudentDemographicChart"
import Link from "next/link"

export default function TuDashboard({ 
  activeUnit, activeYear, totalMurid, totalSubKelas, totalTingkat, chartData 
}: { 
  activeUnit: any, activeYear: any, totalMurid: number, totalSubKelas: number, totalTingkat: number, chartData: any[] 
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">Dashboard Operasional</h1>
        <p className="text-text-muted">Pantau transaksi harian, tagihan, dan master data unit sekolah Anda.</p>
      </div>

      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className="px-3 py-1.5 bg-primary/10 text-primary font-semibold rounded-lg">{activeUnit?.name || 'Semua Unit'}</span>
        <span className="text-text-muted">•</span>
        <span className="px-3 py-1.5 bg-surface border border-border font-semibold rounded-lg text-text-main">{activeYear?.name || 'Tahun Akademik'}</span>
      </div>

      {/* Top Level Metrics (Master Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
        <div className="bg-primary rounded-2xl shadow-sm border border-primary p-6 flex items-center justify-between text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <p className="text-white/90 text-sm font-medium mb-1">Murid Aktif</p>
            <h3 className="text-3xl font-bold mb-1">{totalMurid} <span className="text-base font-normal text-white/70">Siswa</span></h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center relative z-10"><Users size={24} className="text-white" /></div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-text-muted text-sm font-medium mb-1">Rombongan Belajar</p>
            <h3 className="text-3xl font-bold text-text-main mb-1">{totalSubKelas} <span className="text-base font-normal text-text-muted">Kelas</span></h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><GraduationCap size={24} /></div>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-text-muted text-sm font-medium mb-1">Tingkat Kelas</p>
            <h3 className="text-3xl font-bold text-text-main mb-1">{totalTingkat} <span className="text-base font-normal text-text-muted">Tingkat</span></h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><FileText size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <CashFlowChart />
        </div>

        <div className="flex flex-col gap-6">
          <StudentDemographicChart data={chartData} />
          
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-gray-50/50">
              <h3 className="text-lg font-bold text-text-main">Aksi Cepat</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <Link href="/transaksi" className="flex flex-col items-center justify-center p-4 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors shadow-sm gap-3">
                <Wallet size={24} />
                <span className="text-sm font-semibold text-center">Terima Kas</span>
              </Link>
              <Link href="/transaksi" className="flex flex-col items-center justify-center p-4 bg-surface text-text-main border border-border rounded-xl hover:bg-surface-hover transition-colors shadow-sm gap-3">
                <ArrowUpRight size={24} className="text-text-muted" />
                <span className="text-sm font-semibold text-center">Kas Keluar</span>
              </Link>
              <Link href="/kelas" className="flex flex-col items-center justify-center p-4 bg-surface text-text-main border border-border rounded-xl hover:bg-surface-hover transition-colors shadow-sm gap-3">
                <Users size={24} className="text-text-muted" />
                <span className="text-sm font-semibold text-center">Siswa & Kelas</span>
              </Link>
              <Link href="/tagihan" className="flex flex-col items-center justify-center p-4 bg-surface text-text-main border border-border rounded-xl hover:bg-surface-hover transition-colors shadow-sm gap-3">
                <FileText size={24} className="text-text-muted" />
                <span className="text-sm font-semibold text-center">Kelola Tagihan</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
