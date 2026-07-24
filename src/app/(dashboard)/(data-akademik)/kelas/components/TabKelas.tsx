import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SortableHeader } from "@/components/ui/SortableHeader"

export default function TabKelas({
  paginatedGrades,
  sortGrades,
  requestSortGrades,
  currentPage,
  pageSize,
  setDeleteData
}: any) {
  return (
    <>
      <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
        <tr>
          <th className="p-4 font-semibold">No</th>
          <SortableHeader label="Nama Sekolah" sortKey="unitSekolah.name" currentSortKey={sortGrades?.key as string} currentDirection={sortGrades?.direction} onSort={requestSortGrades as any} />
          <SortableHeader label="Tingkat" sortKey="name" currentSortKey={sortGrades?.key as string} currentDirection={sortGrades?.direction} onSort={requestSortGrades as any} />
          <th className="p-4 font-semibold text-right">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {paginatedGrades.length === 0 && (
          <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Belum ada data tingkat kelas.</td></tr>
        )}
        {paginatedGrades.map((g: any, i: number) => (
          <tr key={g.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
            <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
            <td className="p-4 text-text-main font-medium">{g.unitSekolah?.name}</td>
            <td className="p-4 font-bold text-text-main">{g.name}</td>
            <td className="p-4">
              <div className="flex items-center justify-end gap-2">
                <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: g.id, type: "tingkat" })}><Trash2 size={16} /></Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  )
}
