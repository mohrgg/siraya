import { Trash2, Edit2, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SortableHeader } from "@/components/ui/SortableHeader"

export default function TabSubKelas({
  paginatedClassrooms,
  sortClassrooms,
  requestSortClassrooms,
  currentPage,
  pageSize,
  setDeleteData,
  setViewDetailSubKelas,
  setFormSubKelas,
  setShowModalSubKelas,
  isReadOnly
}: any) {
  return (
    <>
      <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
        <tr>
          <th className="p-4 font-semibold">No</th>
          <SortableHeader label="Nama Sekolah" sortKey="unitSekolah.name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
          <SortableHeader label="Tingkat" sortKey="tingkat.name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
          <SortableHeader label="Sub Kelas (Rombel)" sortKey="name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
          <th className="p-4 font-semibold">Jumlah Siswa</th>
          {!isReadOnly && <th className="p-4 font-semibold text-right">Aksi</th>}
        </tr>
      </thead>
      <tbody>
        {paginatedClassrooms.length === 0 && (
          <tr><td colSpan={isReadOnly ? 5 : 6} className="px-4 py-8 text-center text-text-muted">Belum ada data sub kelas.</td></tr>
        )}
        {paginatedClassrooms.map((c: any, i: number) => (
          <tr key={c.id} className="border-b border-border hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button')) return;
            setViewDetailSubKelas(c)
          }}>
            <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
            <td className="p-4 text-text-main font-medium">{c.unitSekolah?.name}</td>
            <td className="p-4 text-text-main">{c.tingkat?.name}</td>
            <td className="p-4 font-bold text-text-main">{c.name}</td>
            <td className="p-4 text-text-muted">{c._count?.riwayatKelas || c._count?.murid || 0}</td>
            {!isReadOnly && (
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewDetailSubKelas(c)}><Info size={16} /></Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormSubKelas({ id: c.id, name: c.name, tingkatId: c.tingkatId, jurusanId: c.jurusanId || "", tahunAkademikId: c.tahunAkademikId, unitSekolahId: c.unitSekolahId })
                    setShowModalSubKelas(true)
                  }}><Edit2 size={16} /></Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: c.id, type: "subkelas" })}><Trash2 size={16} /></Button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  )
}
