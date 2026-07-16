import { Wallet, ArrowUpRight, ArrowDownRight, Activity, Users, FileText, GraduationCap, Building } from "lucide-react"
import prisma from "@/lib/prisma"
import CashFlowChart from "@/components/dashboard/CashFlowChart"
import StudentDemographicChart from "@/components/dashboard/StudentDemographicChart"

import { cookies } from "next/headers"

export default async function DashboardPage() {
  const schoolUnits = await prisma.unitSekolah.findMany()
  const cookieStore = await cookies()
  const activeUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id

  // Fetch Live Master Data
  const totalMurid = await prisma.murid.count({
    where: { 
      isActive: true,
      ...(activeUnitId ? { unitSekolahId: activeUnitId } : {})
    }
  })
  
  const totalSubKelas = await prisma.subKelas.count({
    where: activeUnitId ? { unitSekolahId: activeUnitId } : {}
  })
  
  const totalTingkat = await prisma.tingkat.count({
    where: activeUnitId ? { unitSekolahId: activeUnitId } : {}
  })

  const totalTahunAkademik = await prisma.tahunAkademik.count()

  // Data Sebaran Murid (Gender)
  const genderDistribution = await prisma.murid.groupBy({
    by: ['gender'],
    where: { 
      isActive: true,
      ...(activeUnitId ? { unitSekolahId: activeUnitId } : {})
    },
    _count: {
      _all: true
    }
  })

  // Format data untuk Recharts
  const chartData = genderDistribution.map(g => ({
    name: g.gender === 'L' ? 'Laki-laki' : g.gender === 'P' ? 'Perempuan' : 'Tidak Diketahui',
    value: g._count._all
  }))

  // Data Keuangan (Dummy Statis sementara menunggu Fase 3)
  const totalSaldoKas = "Rp 145.280.500"
  const totalPemasukan = "Rp 32.500.000"

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-main mb-2 tracking-tight">Selamat Pagi, Admin!</h1>
        <p className="text-text-muted">Berikut ringkasan aktivitas akademik dan master data unit ini.</p>
      </div>

      {/* Top Level Metrics (Master Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Metrik Master Data 1 */}
        <div className="bg-primary rounded-2xl shadow-sm border border-primary p-6 flex items-center justify-between text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <p className="text-white/90 text-sm font-medium mb-1">Total Murid Aktif</p>
            <h3 className="text-3xl font-bold mb-1">{totalMurid} <span className="text-base font-normal text-white/70">Siswa</span></h3>
            <span className="text-xs text-white/70 font-medium">Di unit ini</span>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center relative z-10">
            <Users size={24} className="text-white" />
          </div>
        </div>

        {/* Metrik Master Data 2 */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-text-muted text-sm font-medium mb-1">Rombongan Belajar</p>
            <h3 className="text-3xl font-bold text-text-main mb-1">{totalSubKelas} <span className="text-base font-normal text-text-muted">Kelas</span></h3>
            <span className="text-xs font-semibold text-emerald-600">Tahun Ajaran Aktif</span>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
        </div>

        {/* Metrik Master Data 3 */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-text-muted text-sm font-medium mb-1">Tingkat Kelas</p>
            <h3 className="text-3xl font-bold text-text-main mb-1">{totalTingkat} <span className="text-base font-normal text-text-muted">Tingkat</span></h3>
            <span className="text-xs font-medium text-text-muted">Di unit ini</span>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>

        {/* Metrik Master Data 4 */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-text-muted text-sm font-medium mb-1">Tahun Akademik</p>
            <h3 className="text-3xl font-bold text-text-main mb-1">{totalTahunAkademik} <span className="text-base font-normal text-text-muted">Terdata</span></h3>
            <span className="text-xs font-medium text-text-muted">Total Yayasan</span>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Building size={24} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri (Utama) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <CashFlowChart />
          
          {/* Tabel Transaksi Terakhir */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-text-main">Transaksi Kas Terakhir</h3>
              <button className="px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">Lihat Semua</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {[
                    { id: 1, name: 'Pembayaran SPP Budi (X-RPL)', date: '15 Jul 2026', amount: '+ Rp 350.000', type: 'in' },
                    { id: 2, name: 'Bayar Listrik Sekolah', date: '14 Jul 2026', amount: '- Rp 1.200.000', type: 'out' },
                    { id: 3, name: 'Pembayaran Seragam (SD)', date: '14 Jul 2026', amount: '+ Rp 850.000', type: 'in' },
                  ].map((trx) => (
                    <tr key={trx.id} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 md:p-5">
                        <p className="font-semibold text-text-main mb-1">{trx.name}</p>
                        <p className="text-sm text-text-muted">{trx.date}</p>
                      </td>
                      <td className="p-4 md:p-5 text-right">
                        <span className={`font-bold ${trx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {trx.amount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (Side widgets) */}
        <div className="flex flex-col gap-6">
          
          <StudentDemographicChart data={chartData} />

          {/* Quick Actions */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-gray-50/50">
              <h3 className="text-lg font-bold text-text-main">Aksi Cepat</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-4 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors shadow-sm gap-3">
                <Wallet size={24} />
                <span className="text-sm font-semibold">Terima Kas</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-surface text-text-main border border-border rounded-xl hover:bg-surface-hover transition-colors shadow-sm gap-3">
                <ArrowUpRight size={24} className="text-text-muted" />
                <span className="text-sm font-semibold">Keluarkan Kas</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-surface text-text-main border border-border rounded-xl hover:bg-surface-hover transition-colors shadow-sm gap-3">
                <Users size={24} className="text-text-muted" />
                <span className="text-sm font-semibold">Tambah Murid</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-surface text-text-main border border-border rounded-xl hover:bg-surface-hover transition-colors shadow-sm gap-3">
                <FileText size={24} className="text-text-muted" />
                <span className="text-sm font-semibold">Cek Tagihan</span>
              </button>
            </div>
          </div>

          {/* Pending tasks / Alerts */}
          <div className="bg-surface rounded-2xl shadow-sm border-l-4 border-l-albas-yellow border-y border-r border-border overflow-hidden">
            <div className="p-5">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-albas-yellow text-white rounded-xl shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-text-main mb-1">Tunggakan SPP</h4>
                  <p className="text-sm text-text-muted mb-4 leading-relaxed">
                    Ada 34 Siswa yang belum membayar SPP bulan ini (Total: Rp 12.450.000)
                  </p>
                  <button className="px-3 py-1.5 text-sm font-medium text-yellow-800 border border-albas-yellow rounded-lg hover:bg-yellow-50 transition-colors">
                    Lihat Rincian
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
