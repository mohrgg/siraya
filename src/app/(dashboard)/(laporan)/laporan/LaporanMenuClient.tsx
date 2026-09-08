"use client"

import Link from "next/link"
import { 
  BarChart3, 
  LineChart,
  ArrowRight,
  TrendingUp,
  CreditCard,
  PieChart,
  Wallet
} from "lucide-react"

export default function LaporanMenuClient({ userRole }: { userRole?: string }) {
  const isKepsek = userRole === "KEPALA_SEKOLAH"

  return (
    <div className="max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          {isKepsek ? "Pusat Pengesahan & Laporan Resmi Unit" : "Pusat Laporan"}
        </h1>
        <p className="text-text-muted text-base max-w-2xl">
          {isKepsek
            ? "Verifikasi, audit, dan cetak dokumen pertanggungjawaban keuangan resmi yang telah dilengkapi format tanda tangan Mengetahui Kepala Sekolah."
            : "Pantau dan analisis kesehatan finansial serta kepatuhan administrasi sekolah melalui berbagai modul laporan terpadu."}
        </p>
      </div>

      {isKepsek && (
        <div className="mb-8 p-5 bg-gradient-to-r from-[#065f32] via-[#08733e] to-[#044e28] rounded-2xl text-white shadow-sm border border-emerald-600/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/20">
                Pusat Dokumen Resmi Unit
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">Standarisasi Pengesahan Berkas Yayasan</h2>
              <p className="text-xs text-white/70 mt-1 max-w-2xl">
                Seluruh format ekspor PDF pada modul di bawah ini telah secara otomatis memuat blok pengesahan resmi: <strong className="text-emerald-200">&quot;Mengetahui, Kepala Sekolah&quot;</strong> dan <strong className="text-emerald-200">&quot;Dibuat oleh, Tata Usaha&quot;</strong> sesuai profil unit sekolah Anda.
              </p>
            </div>
            <span className="text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl text-emerald-100 font-medium border border-white/10 shrink-0">
              Format Siap Tanda Tangan
            </span>
          </div>
        </div>
      )}

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
              {isKepsek ? "LPJ Arus Kas & Realisasi Anggaran" : "Laporan Arus Kas"}
            </h3>
            <p className="text-sm text-text-muted">
              {isKepsek
                ? "Audit total pemasukan dan pengeluaran operasional unit beserta selisih surplus/defisit anggaran berjalan."
                : "Pantau total pemasukan dan pengeluaran (Laba/Rugi) secara komprehensif berdasarkan rentang waktu tertentu."}
            </p>
          </div>
          
          <div className="mt-6 flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
            {isKepsek ? "Audit Dokumen" : "Buka Laporan"} <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
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
              {isKepsek ? "Audit Piutang & Kolektibilitas SPP" : "Laporan Tunggakan"}
            </h3>
            <p className="text-sm text-text-muted">
              {isKepsek
                ? "Daftar resmi piutang SPP per kelas untuk koordinasi rapat wali kelas dan kebijakan dispensasi pimpinan."
                : "Analisis sisa tagihan siswa yang belum lunas. Dapat difilter berdasarkan Tingkat dan Rombongan Belajar."}
            </p>
          </div>
          
          <div className="mt-6 flex items-center text-sm font-semibold text-rose-600 group-hover:text-rose-700">
            {isKepsek ? "Audit Dokumen" : "Buka Laporan"} <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Mutasi Bank */}
        <Link href="/laporan/mutasi-bank" className="group relative bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0">
            <Wallet size={120} />
          </div>
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <Wallet size={24} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">
              {isKepsek ? "Buku Kas & Rekonsiliasi Bank" : "Buku Mutasi Kas / Bank"}
            </h3>
            <p className="text-sm text-text-muted">
              {isKepsek
                ? "Rekonsiliasi mutasi rekening bank dan brankas kas fisik unit untuk audit saldo riil berkala."
                : "Pantau rincian mutasi (pemasukan & pengeluaran) beserta akumulasi Saldo Akhir pada setiap akun Kas/Bank Yayasan."}
            </p>
          </div>
          
          <div className="mt-6 flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
            {isKepsek ? "Audit Dokumen" : "Buka Mutasi"} <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

      </div>
    </div>
  )
}
