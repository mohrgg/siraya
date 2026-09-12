import { Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SortableHeader } from "@/components/ui/SortableHeader"

export default function TabKelas({
  paginatedGrades,
  sortGrades,
  requestSortGrades,
  currentPage,
  pageSize,
  setDeleteData,
  onEditTingkat,
  isReadOnly
}: any) {
  return (
    <>
      <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
        <tr>
          <th className="p-4 font-semibold">No</th>
          <SortableHeader label="Nama Sekolah" sortKey="unitSekolah.name" currentSortKey={sortGrades?.key as string} currentDirection={sortGrades?.direction} onSort={requestSortGrades as any} />
          <SortableHeader label="Tingkat" sortKey="name" currentSortKey={sortGrades?.key as string} currentDirection={sortGrades?.direction} onSort={requestSortGrades as any} />
          {!isReadOnly && <th className="p-4 font-semibold text-right">Aksi</th>}
        </tr>
      </thead>
      <tbody>
        {paginatedGrades.length === 0 && (
          <tr><td colSpan={isReadOnly ? 3 : 4} className="px-4 py-8 text-center text-text-muted">Belum ada data tingkat kelas.</td></tr>
        )}
        {paginatedGrades.map((g: any, i: number) => (
          <tr key={g.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
            <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
            <td className="p-4 text-text-main font-medium">{g.unitSekolah?.name}</td>
            <td className="p-4">
              <span className="font-bold text-text-main whitespace-nowrap block">{g.name}</span>
              {(g._count?.subKelas || 0) > 0 && (
                <span className="text-xs font-normal text-text-muted block mt-0.5">
                  {g._count.subKelas} Rombel
                </span>
              )}
            </td>
            {!isReadOnly && (
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEditTingkat && onEditTingkat(g)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" title="Edit Tingkat">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteData({ id: g.id, type: "tingkat" })} 
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                    title={(g._count?.subKelas || 0) > 0 ? `Tingkatan masih memiliki ${g._count.subKelas} rombel aktif` : "Hapus Tingkat"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  )
}
