import { useRouter } from "next/navigation"
import { Info, Edit2, Trash2, User, X, UserPlus, Users } from "lucide-react"
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
  setReactivateMurid,
  getStatusBadge,
  // Bulk promote props
  classrooms,
  targetSubKelasId,
  setTargetSubKelasId,
  handleBulkPromote,
  isPromoting,
  isReadOnly
}: any) {
  const router = useRouter()
  return (
    <>
      <thead className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
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
            <td colSpan={isReadOnly ? 7 : 8} className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center text-text-muted">
                <Users size={40} className="text-gray-300 mb-3 stroke-[1.5]" />
                <p className="font-bold text-text-main text-base mb-1">Belum Ada Data Siswa</p>
                <p className="text-xs text-text-muted max-w-sm">Data siswa akan muncul di sini setelah ditambahkan.</p>
              </div>
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
          <tr key={s.id} className="border-b border-border hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('input')) return;
            router.push(`/murid/${s.id}`)
          }}>
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
                <div className={`w-10 h-10 rounded-full flex-shrink-0 border flex items-center justify-center overflow-hidden ${
                  s.photoUrl 
                    ? "bg-gray-100 border-border" 
                    : s.gender === "Perempuan" 
                      ? "bg-rose-50 border-rose-100 text-rose-500" 
                      : "bg-blue-50 border-blue-100 text-blue-500"
                }`}>
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} />
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
                  {activeTab === "alumni" && (
                    <button onClick={(e) => { e.stopPropagation(); setReactivateMurid({ id: s.id, name: s.name }) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors" title="Aktifkan Kembali (Reaktivasi)">
                      <UserPlus size={16} />
                    </button>
                  )}
                  <button onClick={() => router.push(`/murid/${s.id}`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors" title="Lihat Profil 360° Murid"><Info size={16} /></button>
                  <button onClick={() => { 
                    setFormMurid({ ...s, subKelasId: s.riwayatKelas?.[0]?.subKelasId || "" }); 
                    setShowModalMurid(true); 
                  }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors" title="Edit Murid">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteData({ id: s.id, type: "murid" })} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors" title="Hapus Murid"><Trash2 size={16} /></button>
                </div>
              </td>
            )}
            {isReadOnly && (
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => router.push(`/murid/${s.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors font-bold text-xs">
                    <Info size={16} /> Profil 360°
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
