import { Trash2, Edit2, Info, Layers } from "lucide-react"
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
      <thead className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
        <tr>
          <th className="p-4 font-semibold text-center w-12">No</th>
          <SortableHeader label="Nama Sekolah" sortKey="unitSekolah.name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
          <SortableHeader label="Tingkat" sortKey="tingkat.name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
          <SortableHeader label="Sub Kelas (Rombel)" sortKey="name" currentSortKey={sortClassrooms?.key as string} currentDirection={sortClassrooms?.direction} onSort={requestSortClassrooms as any} />
          <th className="p-4 font-semibold">Wali Kelas</th>
          <th className="p-4 font-semibold text-center">Jumlah Siswa</th>
          {isReadOnly ? (
            <th className="p-4 font-semibold text-right">Detail</th>
          ) : (
            <th className="p-4 font-semibold text-right">Aksi</th>
          )}
        </tr>
      </thead>
      <tbody>
        {paginatedClassrooms.length === 0 && (
          <tr>
            <td colSpan={isReadOnly ? 6 : 7} className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center text-text-muted">
                <Layers size={40} className="text-gray-300 mb-3 stroke-[1.5]" />
                <p className="font-bold text-text-main text-base mb-1">Belum Ada Data Sub Kelas</p>
                <p className="text-xs text-text-muted max-w-sm">Data rombel / subkelas akan muncul di sini setelah ditambahkan.</p>
              </div>
            </td>
          </tr>
        )}
        {paginatedClassrooms.map((c: any, i: number) => {
          const studentCount = c._count?.riwayatKelas || c._count?.murid || 0
          return (
            <tr key={c.id} className="border-b border-border hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('button')) return;
              setViewDetailSubKelas(c)
            }}>
              <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
              <td className="p-4 text-text-main font-medium">{c.unitSekolah?.name}</td>
              <td className="p-4 text-text-main">{c.tingkat?.name}</td>
              <td className="p-4 font-bold text-text-main">{c.name}</td>
              <td className="p-4">
                {c.waliKelasGuru?.name || c.waliKelas ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    {c.waliKelasGuru?.name || c.waliKelas}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted/60 italic">Belum dipilih</span>
                )}
              </td>
              <td className="p-4">
                {(() => {
                  if (!isReadOnly) return <span className="text-text-muted font-medium">{studentCount}</span>
                  let badge = "bg-emerald-50 text-emerald-700 border-emerald-200"
                  let label = "Ideal"
                  if (studentCount > 36) {
                    badge = "bg-rose-50 text-rose-700 border-rose-200"
                    label = "Padat (>36)"
                  } else if (studentCount < 20) {
                    badge = "bg-amber-50 text-amber-700 border-amber-200"
                    label = "Minim (<20)"
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-main">{studentCount} Siswa</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${badge}`}>
                        {label}
                      </span>
                    </div>
                  )
                })()}
              </td>
              {isReadOnly ? (
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setViewDetailSubKelas(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors font-bold text-xs">
                      <Info size={16} /> Audit Siswa
                    </button>
                  </div>
                </td>
              ) : (
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setViewDetailSubKelas(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors" title="Lihat Detail Rombel & Daftar Siswa"><Info size={16} /></button>
                    <button onClick={() => {
                      setFormSubKelas({ 
                        id: c.id, 
                        name: c.name, 
                        tingkatId: c.tingkatId, 
                        jurusanId: c.jurusanId || "", 
                        tahunAkademikId: c.tahunAkademikId, 
                        unitSekolahId: c.unitSekolahId,
                        waliKelasGuruId: c.waliKelasGuruId || "",
                        waliKelas: c.waliKelas || "",
                        waliKelasPhone: c.waliKelasPhone || ""
                      })
                      setShowModalSubKelas(true)
                    }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" title="Edit Rombel"><Edit2 size={16} /></button>
                    <button 
                      onClick={() => setDeleteData({ id: c.id, type: "subkelas" })} 
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" 
                      title={studentCount > 0 ? `Rombel masih memiliki ${studentCount} siswa aktif` : "Hapus Rombel"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </>
  )
}
