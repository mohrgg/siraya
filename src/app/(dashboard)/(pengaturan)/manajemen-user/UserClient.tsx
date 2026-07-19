"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"

type User = any

export default function UserClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const { items: sortedUsers, requestSort, sortConfig } = useSortableData(users)

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Manajemen User</h1>
          <p className="text-text-muted">Kelola akses admin dan tata usaha.</p>
        </div>
        <Button>
          <Plus size={16} className="mr-2" /> Tambah User
        </Button>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-border bg-surface text-text-muted text-sm uppercase tracking-wider">
                <SortableHeader label="Nama" sortKey="name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Email" sortKey="email" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Role" sortKey="role" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Status" sortKey="isActive" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-text-main">{user.name}</td>
                  <td className="p-4 text-text-muted">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isActive ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                        <CheckCircle2 size={16} /> Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-600 text-sm font-medium">
                        <XCircle size={16} /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" title="Edit">
                        <Edit2 size={16} />
                      </Button>
                      {user.role !== 'ADMIN' && (
                        <Button variant="danger" size="sm" title="Hapus">
                          <Trash2 size={16} />
                        </Button>
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
  )
}
