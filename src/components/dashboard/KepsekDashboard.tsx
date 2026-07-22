import { Building, Users, GraduationCap, FileText, PieChart } from "lucide-react"
import CashFlowChart from "./CashFlowChart"
import StudentDemographicChart from "./StudentDemographicChart"
import Link from "next/link"

export default function KepsekDashboard({ 
  activeUnit, activeYear, totalMurid, totalSubKelas, totalTingkat, chartData 
}: { 
  activeUnit: any, activeYear: any, totalMurid: number, totalSubKelas: number, totalTingkat: number, chartData: any[] 
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">Dashboard Kepala Sekolah</h1>
        <p className="text-text-muted">Ringkasan eksekutif laporan keuangan dan data akademik.</p>
      </div>

      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className="px-3 py-1.5 bg-primary/10 text-primary font-semibold rounded-lg">{activeUnit?.name || 'Semua Unit'}</span>
        <span className="text-text-muted">•</span>
        <span className="px-3 py-1.5 bg-surface border border-border font-semibold rounded-lg text-text-main">{activeYear?.name || 'Tahun Akademik'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
        <div className="bg-primary rounded-2xl shadow-sm border border-primary p-6 flex items-center justify-between text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <p className="text-white/90 text-sm font-medium mb-1">Total Siswa Aktif</p>
            <h3 className="text-3xl font-bold mb-1">{totalMurid} <span className="text-base font-normal text-white/70">Orang</span></h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center relative z-10"><Users size={24} className="text-white" /></div>
        </div>
        
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col justify-center hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><PieChart size={64}/></div>
          <p className="text-text-muted text-sm font-medium mb-1">Saldo Kas Saat Ini</p>
          <h3 className="text-3xl font-bold text-text-main mb-1">Rp 145.280.500</h3>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col justify-center hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><FileText size={64}/></div>
          <p className="text-text-muted text-sm font-medium mb-1">Total Tagihan Belum Dibayar</p>
          <h3 className="text-3xl font-bold text-rose-600 mb-1">Rp 12.450.000</h3>
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
              <h3 className="text-lg font-bold text-text-main">Laporan Cepat</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <Link href="/laporan" className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-bg transition-colors">
                <span className="font-semibold text-sm">Buku Besar</span>
                <span className="text-primary text-xs font-bold">Lihat &rarr;</span>
              </Link>
              <Link href="/laporan" className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-bg transition-colors">
                <span className="font-semibold text-sm">Arus Kas (Cashflow)</span>
                <span className="text-primary text-xs font-bold">Lihat &rarr;</span>
              </Link>
              <Link href="/laporan" className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-bg transition-colors">
                <span className="font-semibold text-sm">Rekapitulasi Tagihan</span>
                <span className="text-primary text-xs font-bold">Lihat &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
