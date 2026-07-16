import prisma from "@/lib/prisma"
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p className="page-subtitle">Kelola akses admin dan tata usaha.</p>
        </div>
        <Button leftIcon={<Plus size={18} />}>Tambah User</Button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Nama</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{user.name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.email}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: user.role === 'ADMIN' ? '#e0e7ff' : '#f3e8ff',
                        color: user.role === 'ADMIN' ? '#4f46e5' : '#9333ea'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {user.isActive ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#059669', fontSize: '0.875rem', fontWeight: 500 }}>
                          <CheckCircle2 size={16} /> Aktif
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#e11d48', fontSize: '0.875rem', fontWeight: 500 }}>
                          <XCircle size={16} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="icon-btn" title="Edit">
                          <Edit2 size={18} />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button className="icon-btn text-error" title="Hapus">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
