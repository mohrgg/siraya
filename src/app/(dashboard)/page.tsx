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
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Selamat Pagi, Admin!</h1>
        <p className="page-subtitle">Berikut ringkasan aktivitas akademik dan master data unit ini.</p>
      </div>

      {/* Top Level Metrics (Master Data) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Metrik Master Data 1 */}
        <div className="card stat-card main-stat" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--albas-green)' }}>
          <div>
            <p className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>Total Murid Aktif</p>
            <h3 className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{totalMurid} <span style={{fontSize: '1rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'normal'}}>Siswa</span></h3>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Di unit ini</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#fff" />
          </div>
        </div>

        {/* Metrik Master Data 2 */}
        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="stat-label" style={{ fontSize: '0.875rem' }}>Rombongan Belajar (Kelas)</p>
            <h3 className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{totalSubKelas} <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>Kelas</span></h3>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Tahun Ajaran Aktif</span>
          </div>
          <div className="stat-icon bg-emerald-100 text-emerald-600" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
        </div>

        {/* Metrik Master Data 3 */}
        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="stat-label" style={{ fontSize: '0.875rem' }}>Tingkat Kelas</p>
            <h3 className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{totalTingkat} <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>Tingkat</span></h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Di unit ini</span>
          </div>
          <div className="stat-icon bg-blue-100 text-blue-600" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
        </div>

        {/* Metrik Master Data 4 */}
        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="stat-label" style={{ fontSize: '0.875rem' }}>Tahun Akademik</p>
            <h3 className="stat-value" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{totalTahunAkademik} <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>Terdata</span></h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Yayasan</span>
          </div>
          <div className="stat-icon bg-purple-100 text-purple-600" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={24} />
          </div>
        </div>

      </div>

      <div className="dashboard-grid">
        {/* Kolom Kiri (Utama) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <CashFlowChart />
          
          {/* Tabel Transaksi Terakhir */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Transaksi Kas Terakhir</h3>
              <button className="btn btn-outline btn-sm">Lihat Semua</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <tbody>
                  {[
                    { id: 1, name: 'Pembayaran SPP Budi (X-RPL)', date: '15 Jul 2026', amount: '+ Rp 350.000', type: 'in' },
                    { id: 2, name: 'Bayar Listrik Sekolah', date: '14 Jul 2026', amount: '- Rp 1.200.000', type: 'out' },
                    { id: 3, name: 'Pembayaran Seragam (SD)', date: '14 Jul 2026', amount: '+ Rp 850.000', type: 'in' },
                  ].map((trx) => (
                    <tr key={trx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{trx.name}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{trx.date}</p>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: trx.type === 'in' ? '#059669' : '#e11d48'
                        }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <StudentDemographicChart data={chartData} />

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Aksi Cepat</h3>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flexDirection: 'column', padding: '1.5rem 1rem', height: 'auto', gap: '0.75rem' }}>
                <Wallet size={24} />
                <span>Terima Kas</span>
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '1.5rem 1rem', height: 'auto', gap: '0.75rem' }}>
                <ArrowUpRight size={24} />
                <span>Keluarkan Kas</span>
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '1.5rem 1rem', height: 'auto', gap: '0.75rem' }}>
                <Users size={24} />
                <span>Tambah Murid</span>
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '1.5rem 1rem', height: 'auto', gap: '0.75rem' }}>
                <FileText size={24} />
                <span>Cek Tagihan</span>
              </button>
            </div>
          </div>

          {/* Pending tasks / Alerts */}
          <div className="card" style={{ borderLeft: '4px solid var(--albas-yellow)' }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: 'var(--albas-yellow)', padding: '0.5rem', borderRadius: '12px', color: '#fff' }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Tunggakan SPP</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Ada 34 Siswa yang belum membayar SPP bulan ini (Total: Rp 12.450.000)
                  </p>
                  <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--albas-yellow)', color: '#854d0e' }}>
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
