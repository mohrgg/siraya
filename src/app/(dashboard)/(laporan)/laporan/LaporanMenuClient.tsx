"use client"

import Link from "next/link"
import { 
  BarChart3, 
  LineChart,
  PieChart
} from "lucide-react"

export default function LaporanMenuClient() {
  return (
    <div className="min-h-screen bg-gray-50/30 p-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Laporan Keuangan
        </h1>
        <p className="text-gray-500 text-sm mt-1">Pilih jenis laporan yang ingin Anda lihat</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Pemasukan dan Pengeluaran */}
        <Link href="/laporan/pemasukan-pengeluaran" className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">
              LAPORAN
            </div>
            <h3 className="text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
              Pemasukan dan Pengeluaran
            </h3>
          </div>
          <div className="mt-6 flex justify-start">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
              <LineChart size={20} />
            </div>
          </div>
        </Link>

        {/* Card 2: Tunggakan Siswa */}
        <Link href="/laporan/tunggakan-siswa" className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-1">
              LAPORAN
            </div>
            <h3 className="text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
              Tunggakan Siswa
            </h3>
          </div>
          <div className="mt-6 flex justify-start">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
              <BarChart3 size={20} />
            </div>
          </div>
        </Link>

      </div>
    </div>
  )
}
