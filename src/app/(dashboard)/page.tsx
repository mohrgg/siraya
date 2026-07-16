import { Wallet, ArrowUpRight, ArrowDownRight, Activity, Users, FileText, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Selamat Pagi, Admin!</h1>
          <p className="page-subtitle">Berikut ringkasan aktivitas keuangan Yayasan Al Basyariah hari ini.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Kolom Kiri (Utama) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Stat Card */}
          <div className="card stat-card main-stat" style={{ padding: '2rem' }}>
            <div className="stat-info" style={{ flex: 1 }}>
              <p className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Saldo Kas Aktif</p>
              <h3 className="stat-value" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Rp 145.280.500</h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                <span>Kas SD: Rp 45jt</span>
                <span>•</span>
                <span>Kas SMP: Rp 55jt</span>
                <span>•</span>
                <span>Kas SMK: Rp 45jt</span>
              </div>
            </div>
            <div className="stat-icon" style={{ width: '80px', height: '80px', borderRadius: '24px' }}>
              <Wallet size={40} />
            </div>
          </div>

          {/* Sub Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card stat-card" style={{ padding: '1.5rem' }}>
              <div className="stat-icon bg-emerald-100 text-emerald-600">
                <ArrowDownRight size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Pemasukan Bulan Ini</p>
                <h3 className="stat-value" style={{ fontSize: '1.5rem' }}>Rp 32.500.000</h3>
                <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>+12% dari bulan lalu</span>
              </div>
            </div>
            
            <div className="card stat-card" style={{ padding: '1.5rem' }}>
              <div className="stat-icon bg-rose-100 text-rose-600">
                <ArrowUpRight size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Pengeluaran Bulan Ini</p>
                <h3 className="stat-value" style={{ fontSize: '1.5rem' }}>Rp 12.450.000</h3>
                <span style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 600, marginTop: '0.25rem' }}>Operasional & Gaji</span>
              </div>
            </div>
          </div>

          {/* Tabel Transaksi Terakhir */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Transaksi Terakhir</h3>
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
                <FileText size={24} />
                <span>Keluarkan Kas</span>
              </button>
              <button className="btn btn-secondary" style={{ flexDirection: 'column', padding: '1.5rem 1rem', height: 'auto', gap: '0.75rem', gridColumn: 'span 2' }}>
                <Users size={24} />
                <span>Cek Tagihan Siswa</span>
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
