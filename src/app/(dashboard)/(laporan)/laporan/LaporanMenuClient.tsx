"use client"

import Link from "next/link"
import { 
  BarChart3, 
  LineChart,
  ArrowRight,
  TrendingUp,
  CreditCard,
  PieChart
} from "lucide-react"

export default function LaporanMenuClient() {
  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          Pusat Laporan
        </h1>
        <p className="text-text-muted text-base max-w-2xl">
          Pantau dan analisis kesehatan finansial serta kepatuhan administrasi sekolah melalui berbagai modul laporan terpadu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Card 1: Pemasukan dan Pengeluaran */}
        <Link href="/laporan/pemasukan-pengeluaran" className="group relative bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0">
            <LineChart size={120} />
          </div>
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">
              Laporan Arus Kas
            </h3>
            <p className="text-sm text-text-muted">
              Pantau total pemasukan dan pengeluaran (Laba/Rugi) secara komprehensif berdasarkan rentang waktu tertentu.
            </p>
          </div>
          
          <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
            Buka Laporan <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Tunggakan Siswa */}
        <Link href="/laporan/tunggakan-siswa" className="group relative bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0">
            <BarChart3 size={120} />
          </div>
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">
              Laporan Tunggakan
            </h3>
            <p className="text-sm text-text-muted">
              Analisis sisa tagihan siswa yang belum lunas. Dapat difilter berdasarkan Tingkat dan Rombongan Belajar.
            </p>
          </div>
          
          <div className="mt-6 flex items-center text-sm font-semibold text-rose-600 group-hover:text-rose-700">
            Buka Laporan <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Coming Soon (Optional) */}
        <div className="relative bg-surface/50 rounded-2xl border border-border border-dashed p-6 flex flex-col justify-center items-center text-center min-h-[220px]">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
            <PieChart size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-400 mb-1">
            Laporan Kustom
          </h3>
          <p className="text-sm text-gray-400 max-w-[200px]">
            Modul laporan tambahan akan segera hadir di sini.
          </p>
        </div>

      </div>
    </div>
  )
}
