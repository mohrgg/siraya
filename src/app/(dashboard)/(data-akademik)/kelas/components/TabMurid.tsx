import { Info, Edit2, Trash2, User, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SortableHeader } from "@/components/ui/SortableHeader"

export default function TabMurid({
  activeTab,
  students,
  isLoadingStudents,
  pageSize,
  currentPage,
  muridSort,
  handleMuridSort,
  selectedStudents,
  setSelectedStudents,
  setDeleteData,
  setViewDetailMurid,
  setFormMurid,
  setShowModalMurid,
  getStatusBadge,
  // Bulk promote props
  classrooms,
  targetSubKelasId,
  setTargetSubKelasId,
  handleBulkPromote,
  isPromoting,
  isReadOnly
}: any) {
  return (
    <>
      <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
        <tr>
          {!isReadOnly && (
            <th className="p-4 font-semibold text-center w-12">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={students.length > 0 && selectedStudents.length === students.length}
                onChange={(e) => {
                  if (e.target.checked) setSelectedStudents(students.map((s: any) => s.id))
                  else setSelectedStudents([])
                }}
              />
            </th>
          )}
          <th className="p-4 font-semibold text-left w-12">No</th>
          <SortableHeader label="Nama Murid" sortKey="name" currentSortKey={muridSort.key} currentDirection={muridSort.direction} onSort={handleMuridSort} />
          <SortableHeader label="NISN / NIS" sortKey="nisn" currentSortKey={muridSort.key} currentDirection={muridSort.direction} onSort={handleMuridSort} />
          <th className="p-4 font-semibold text-left">Jenis Kelamin</th>
          <th className="p-4 font-semibold text-left">Kelas / Rombel</th>
          <SortableHeader label="Status" sortKey="status" currentSortKey={muridSort.key} currentDirection={muridSort.direction} onSort={handleMuridSort} />
          {isReadOnly ? (
            <th className="p-4 font-semibold text-right">Detail</th>
          ) : (
            <th className="p-4 font-semibold text-right">Aksi</th>
          )}
        </tr>
      </thead>
      <tbody>
        {(!isLoadingStudents && students.length === 0) && (
          <tr>
            <td colSpan={isReadOnly ? 7 : 8} className="p-8 text-center text-text-muted">
              Belum ada data siswa
            </td>
          </tr>
        )}
        
        {isLoadingStudents && (
          <>
            {[...Array(pageSize)].map((_, idx) => (
              <tr key={idx} className="border-b border-border animate-pulse">
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-6"></div></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </>
        )}
        
        {!isLoadingStudents && students.map((s: any, i: number) => (
          <tr key={s.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
            {!isReadOnly && (
              <td className="p-4 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedStudents.includes(s.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedStudents([...selectedStudents, s.id])
                    else setSelectedStudents(selectedStudents.filter((id: string) => id !== s.id))
                  }}
                />
              </td>
            )}
            <td className="p-4">{(currentPage - 1) * pageSize + i + 1}</td>
            <td className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 border border-border overflow-hidden flex items-center justify-center">
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-text-main">{s.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{s.unitSekolah?.name}</div>
                </div>
              </div>
            </td>
            <td className="p-4">
              <div className="font-mono text-sm text-text-main font-semibold">{s.nisn || "-"}</div>
              <div className="text-xs text-text-muted mt-0.5">{s.nis}</div>
            </td>
            <td className="p-4 text-text-main">{s.gender}</td>
            <td className="p-4 font-medium text-text-main">
              {s.riwayatKelas?.[0]?.subKelas?.name ? (
                <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-sm font-semibold">{s.riwayatKelas[0].subKelas.name}</span>
              ) : (
                <span className="text-xs italic text-text-muted">Belum ada kelas</span>
              )}
            </td>
            <td className="p-4">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadge(s.status)}`}>
                {s.status?.toUpperCase() || "AKTIF"}
              </span>
            </td>
            {!isReadOnly && (
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewDetailMurid(s)}><Info size={16} /></Button>
                  <Button variant="outline" size="sm" onClick={() => { 
                    setFormMurid({ ...s, subKelasId: s.riwayatKelas?.[0]?.subKelasId || "" }); 
                    setShowModalMurid(true); 
                  }}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteData({ id: s.id, type: "murid" })}><Trash2 size={16} /></Button>
                </div>
              </td>
            )}
            {isReadOnly && (
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewDetailMurid(s)}><Info size={16} /></Button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  )
}
