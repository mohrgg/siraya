"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  getKelasByUnit, 
  getSubKelasByKelas,
  getJurusanByUnit,
  getMuridWithTagihan, 
  tambahTagihanMassal, 
  updateTagihanSiswa,
  editTagihanMassal,
  hapusTagihanMassal
} from "@/actions/pembuatan-tagihan"
import { Plus, Search, Filter, Loader2, Save, MoreVertical, Edit2, Trash2, X, GripHorizontal } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import ModalTambahTagihan from "./ModalTambahTagihan"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter, 
  ToolbarActions
} from "@/components/ui/DataTableToolbar"

type GridRow = {
  id: string
  name: string
  nisn: string
  formNo: string
  tagihanMap: Record<string, number> // columnId -> jumlah
  lockedMap: Record<string, boolean> // columnId -> is locked
  isDirty: boolean
}

type TagihanColumn = {
  id: string
  akunId: string
  namaTagihan: string
  nama: string
  kode: string
}

export default function PembuatanTagihanClient({
  activeUnitId,
  activeTahunAkademikId,
  activeTahunAkademikName,
  akunPendapatanList,
  user
}: {
  activeUnitId: string
  activeTahunAkademikId: string
  activeTahunAkademikName: string
  akunPendapatanList: any[]
  user: any
}) {
  const isReadOnly = user.role === "KEPALA_SEKOLAH"

  // Filter States
  const [kelasList, setKelasList] = useState<any[]>([])
  const [kelasId, setKelasId] = useState("")
  const [jurusanList, setJurusanList] = useState<any[]>([])
  const [jurusanId, setJurusanId] = useState("")
  const [subKelasList, setSubKelasList] = useState<any[]>([])
  const [subKelasId, setSubKelasId] = useState("")

  // Data States
  const [isLoading, setIsLoading] = useState(false)
  const [gridData, setGridData] = useState<GridRow[]>([])
  const [akunColumns, setAkunColumns] = useState<TagihanColumn[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)

  // Header Menu States
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null)
  
  // Edit Massal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCol, setEditingCol] = useState<TagihanColumn | null>(null)
  const [editNominal, setEditNominal] = useState("0")
  const [isEditingMassal, setIsEditingMassal] = useState(false)

  // Delete Massal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingCol, setDeletingCol] = useState<TagihanColumn | null>(null)
  const [isDeletingMassal, setIsDeletingMassal] = useState(false)

  // Drag and Drop States
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeUnitId) {
      setKelasList([])
      setKelasId("")
      setJurusanList([])
      setJurusanId("")
      return
    }
    getKelasByUnit(activeUnitId).then(res => {
      setKelasList(res)
      if (res.length > 0) setKelasId(res[0].id)
      else setKelasId("")
    })
    getJurusanByUnit(activeUnitId).then(res => {
      setJurusanList(res)
      if (res.length > 0) setJurusanId(res[0].id)
      else setJurusanId("")
    })
  }, [activeUnitId])

  useEffect(() => {
    if (!kelasId || (jurusanList.length > 0 && !jurusanId) || !activeTahunAkademikId) {
      setSubKelasList([])
      setSubKelasId("")
      return
    }
    
    getSubKelasByKelas(kelasId, jurusanList.length > 0 ? jurusanId : undefined, activeTahunAkademikId).then(res => {
      setSubKelasList(res)
      if (res.length > 0) setSubKelasId(res[0].id)
      else setSubKelasId("")
    })
  }, [kelasId, jurusanId, jurusanList, activeTahunAkademikId])

  const processData = (muridList: any[]) => {
    const columnsMap = new Map<string, TagihanColumn>()
    
    muridList.forEach(murid => {
      murid.tagihan?.forEach((t: any) => {
        const compId = `${t.akunId}::${t.namaTagihan}`
        if (!columnsMap.has(compId)) {
          columnsMap.set(compId, {
            id: compId,
            akunId: t.akunId,
            namaTagihan: t.namaTagihan,
            nama: t.namaTagihan,
            kode: t.akun.kode
          })
        }
      })
    })
    
    const columns = Array.from(columnsMap.values()).sort((a, b) => a.kode.localeCompare(b.kode))
    
    try {
      const savedOrderStr = localStorage.getItem(`tagihanColumnOrder_${activeUnitId}`)
      if (savedOrderStr) {
        const savedOrder = JSON.parse(savedOrderStr) as string[]
        columns.sort((a, b) => {
          const idxA = savedOrder.indexOf(a.id)
          const idxB = savedOrder.indexOf(b.id)
          if (idxA === -1 && idxB === -1) return 0
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
      }
    } catch (e) {
      console.error("Failed to parse column order from localStorage", e)
    }

    setAkunColumns(columns)

    const rows: GridRow[] = muridList.map(murid => {
      const tMap: Record<string, number> = {}
      const lMap: Record<string, boolean> = {}
      murid.tagihan?.forEach((t: any) => {
        const compId = `${t.akunId}::${t.namaTagihan}`
        tMap[compId] = t.jumlah
        lMap[compId] = t.sisaTagihan < t.jumlah 
      })
      return {
        id: murid.id,
        name: murid.name,
        nisn: murid.nisn || "-",
        formNo: murid.formNo || "-",
        tagihanMap: tMap,
        lockedMap: lMap,
        isDirty: false
      }
    })
    setGridData(rows)
  }

  const handleTampilkan = async () => {
    if (!subKelasId || !activeTahunAkademikId) {
      toast.error("Pilih Subkelas dan Tahun Akademik terlebih dahulu")
      return
    }

    setIsLoading(true)
    try {
      const data = await getMuridWithTagihan(subKelasId, activeTahunAkademikId)
      processData(data)
    } catch (error: any) {
      toast.error("Gagal mengambil data: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalSubmit = async (data: { 
    akunId: string, 
    namaTagihan: string,
    jumlah: number,
    targetType: "tingkat" | "kelas" | "murid",
    tingkatId?: string,
    subKelasId?: string,
    muridIds?: string[]
  }) => {
    setIsSubmittingModal(true)
    try {
      await tambahTagihanMassal({
        tahunAkademikId: activeTahunAkademikId,
        akunId: data.akunId,
        namaTagihan: data.namaTagihan,
        jumlah: data.jumlah,
        targetType: data.targetType,
        tingkatId: data.tingkatId,
        subKelasId: data.subKelasId,
        muridIds: data.muridIds
      })
      toast.success("Berhasil membuat tagihan massal!")
      setIsModalOpen(false)
      await handleTampilkan()
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat tagihan")
    } finally {
      setIsSubmittingModal(false)
    }
  }

  const handleSimpanBaris = async (row: GridRow) => {
    setSavingRowId(row.id)
    try {
      const updates = akunColumns.map(col => ({
        akunId: col.akunId,
        namaTagihan: col.namaTagihan,
        jumlah: row.tagihanMap[col.id] || 0
      }))

      await updateTagihanSiswa(row.id, activeTahunAkademikId, updates)
      toast.success("Perubahan disimpan")
      
      setGridData(prev => prev.map(r => r.id === row.id ? { ...r, isDirty: false } : r))
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message)
    } finally {
      setSavingRowId(null)
    }
  }

  const handleInputChange = (rowId: string, colId: string, val: string) => {
    const num = parseFloat(val.replace(/[^0-9]/g, '')) || 0
    setGridData(prev => prev.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          isDirty: true,
          tagihanMap: {
            ...r.tagihanMap,
            [colId]: num
          }
        }
      }
      return r
    }))
  }

  const handleEditMassalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCol || !subKelasId || !activeTahunAkademikId) return
    setIsEditingMassal(true)
    try {
      const numVal = parseInt(editNominal.replace(/[^0-9]/g, '')) || 0
      await editTagihanMassal(subKelasId, activeTahunAkademikId, editingCol.akunId, editingCol.namaTagihan, numVal)
      toast.success("Berhasil mengubah nominal tagihan massal")
      setIsEditModalOpen(false)
      await handleTampilkan()
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah tagihan")
    } finally {
      setIsEditingMassal(false)
    }
  }

  const handleHapusMassal = async () => {
    if (!deletingCol || !subKelasId || !activeTahunAkademikId) return
    setIsDeletingMassal(true)
    try {
      await hapusTagihanMassal(subKelasId, activeTahunAkademikId, deletingCol.akunId, deletingCol.namaTagihan)
      toast.success("Berhasil menghapus komponen tagihan")
      setIsDeleteModalOpen(false)
      await handleTampilkan()
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus tagihan")
    } finally {
      setIsDeletingMassal(false)
    }
  }

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val)
  }

  const filteredData = useMemo(() => {
    return gridData.filter(row => 
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.formNo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [gridData, searchTerm])

  const activeSubKelasName = subKelasList.find(s => s.id === subKelasId)?.name || ""
  const activeKelasName = kelasList.find(k => k.id === kelasId)?.name || ""

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Pembuatan Tagihan Siswa</h1>
        <p className="text-text-muted">Kelola tagihan massal untuk siswa berdasarkan komponen biaya</p>
      </div>

      {/* Main Content Card (Match KasKeluar Layout) */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary">
            Daftar Tagihan Siswa
          </button>
        </div>

        {/* Filters and Actions Row */}
        <Toolbar>
          <ToolbarSearch 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Cari Siswa / No Pendaftaran..." 
            disabled={gridData.length === 0}
          />

          <ToolbarFilter
            icon={<Filter size={14} />}
            value={kelasId}
            onChange={(val) => setKelasId(val as string)}
            options={[
              { label: "Kelas...", value: "" },
              ...kelasList.map(kelas => ({ label: kelas.name, value: kelas.id }))
            ]}
          />

          {jurusanList.length > 0 && (
            <ToolbarFilter
              value={jurusanId}
              onChange={(val) => setJurusanId(val as string)}
              options={[
                { label: "Jurusan...", value: "" },
                ...jurusanList.map(jurusan => ({ label: jurusan.name, value: jurusan.id }))
              ]}
            />
          )}

          <ToolbarFilter
            value={subKelasId}
            onChange={(val) => setSubKelasId(val as string)}
            disabled={!kelasId}
            options={[
              { label: "Subkelas...", value: "" },
              ...subKelasList.map(sk => ({ label: sk.name, value: sk.id }))
            ]}
          />

          <Button 
            size="sm"
            onClick={handleTampilkan} 
            disabled={!subKelasId || isLoading}
            className="px-4 py-1.5 h-auto whitespace-nowrap bg-albas-green hover:bg-albas-green/90"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Tampilkan"}
          </Button>

          <ToolbarActions>
            {!isReadOnly && gridData.length > 0 && (
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm whitespace-nowrap"
              >
                <Plus size={16} className="mr-1.5" /> Tambah Tagihan
              </Button>
            )}
          </ToolbarActions>
        </Toolbar>

        {/* Table / Empty State Container */}
        {gridData.length > 0 ? (
          <>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold text-center w-12 sticky left-0 bg-bg z-30 shadow-[1px_0_0_0_#e2e8f0]">NO</th>
                    <th className="p-4 font-semibold min-w-[200px] sticky left-12 bg-bg z-30 shadow-[1px_0_0_0_#e2e8f0]">SISWA/I</th>
                    
                    {akunColumns.map(col => (
                      <th 
                        key={col.id} 
                        className={`p-4 font-semibold text-center min-w-[150px] relative group transition-colors ${!isReadOnly ? 'bg-emerald-50/50 text-emerald-700 border-x border-emerald-100/50 cursor-grab active:cursor-grabbing hover:bg-emerald-50' : ''} ${draggedColumnId === col.id ? 'opacity-50' : ''}`}
                        draggable={!isReadOnly}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move"
                          setDraggedColumnId(col.id)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (!draggedColumnId || draggedColumnId === col.id) return
                          
                          const newCols = [...akunColumns]
                          const draggedIdx = newCols.findIndex(c => c.id === draggedColumnId)
                          const targetIdx = newCols.findIndex(c => c.id === col.id)
                          
                          if (draggedIdx > -1 && targetIdx > -1) {
                            const [draggedItem] = newCols.splice(draggedIdx, 1)
                            newCols.splice(targetIdx, 0, draggedItem)
                            
                            setAkunColumns(newCols)
                            localStorage.setItem(`tagihanColumnOrder_${activeUnitId}`, JSON.stringify(newCols.map(c => c.id)))
                          }
                          setDraggedColumnId(null)
                        }}
                        onDragEnd={() => setDraggedColumnId(null)}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {!isReadOnly && (
                            <div className="opacity-0 group-hover:opacity-40 transition-opacity text-emerald-600 cursor-grab active:cursor-grabbing mr-1 flex-shrink-0" title="Geser kolom">
                              <GripHorizontal size={14} />
                            </div>
                          )}
                          <div className="flex-1 text-center truncate">
                            <span className="flex items-center justify-center gap-1.5 truncate">
                              {col.nama}
                            </span>
                            <span className={`text-[10px] ${!isReadOnly ? 'opacity-80 text-emerald-600/80' : 'opacity-70'}`}>[{col.kode}]</span>
                          </div>
                          {!isReadOnly && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuColId(activeMenuColId === col.id ? null : col.id)
                              }}
                              className="p-1 rounded text-emerald-600/60 hover:bg-emerald-100 transition-colors flex-shrink-0"
                            >
                              <MoreVertical size={16} />
                            </button>
                          )}
                        </div>

                        {/* Dropdown Menu */}
                        {activeMenuColId === col.id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-36 bg-white rounded-lg shadow-lg border border-border py-1.5 z-[99] animate-in fade-in zoom-in-95 font-normal">
                            <button 
                              className="w-full px-3 py-2 text-left text-xs text-text-main hover:bg-bg flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuColId(null)
                                setEditingCol(col)
                                setEditNominal("0")
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit2 size={14} className="text-blue-500" />
                              Ubah Nominal
                            </button>
                            <button 
                              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuColId(null)
                                setDeletingCol(col)
                                setIsDeleteModalOpen(true)
                              }}
                            >
                              <Trash2 size={14} />
                              Hapus Kolom
                            </button>
                          </div>
                        )}
                      </th>
                    ))}
                    
                    <th className="p-4 font-semibold text-right min-w-[150px]">TAGIHAN BERJALAN (TOTAL)</th>
                    {!isReadOnly && <th className="p-4 font-semibold text-center w-24 sticky right-0 bg-bg z-30 shadow-[-1px_0_0_0_#e2e8f0]">AKSI</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4 + akunColumns.length} className="p-8 text-center text-text-muted">
                        Tidak ada data murid yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => {
                      const rowTotal = akunColumns.reduce((acc, col) => {
                        const isLocked = row.lockedMap && row.lockedMap[col.id]
                        return acc + (isLocked ? 0 : (row.tagihanMap[col.id] || 0))
                      }, 0)
                      
                      return (
                        <tr key={row.id} className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-4 text-center text-text-muted font-medium sticky left-0 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                            {idx + 1}.
                          </td>
                          <td className="p-4 sticky left-12 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                            <p className="font-semibold text-text-main leading-tight truncate max-w-[200px]" title={row.name}>{row.name}</p>
                            <p className="text-xs text-text-muted mt-0.5">{row.nisn} • {row.formNo}</p>
                          </td>
                          
                          {akunColumns.map(col => {
                            const isLocked = row.lockedMap && row.lockedMap[col.id]
                            return (
                              <td key={col.id} className="p-4 relative">
                                {isLocked ? (
                                  <div className="flex items-center justify-between px-3 py-1.5 w-full min-w-[130px] rounded-lg bg-emerald-100/50 border border-emerald-200 text-emerald-700 font-bold select-none">
                                    <span className="text-xs opacity-70">Rp.</span>
                                    <span className="text-sm">0</span>
                                  </div>
                                ) : (
                                  <div className="relative group/input">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 text-xs font-semibold z-10">Rp.</span>
                                    <input 
                                      type="text"
                                      disabled={isReadOnly}
                                      className="w-full min-w-[130px] pl-9 pr-3 py-1.5 bg-bg border border-border/60 hover:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white text-sm font-semibold text-right transition-all text-text-main disabled:opacity-70 disabled:bg-gray-50"
                                      value={row.tagihanMap[col.id] === undefined ? "" : formatRupiah(row.tagihanMap[col.id])}
                                      onChange={(e) => handleInputChange(row.id, col.id, e.target.value)}
                                      placeholder="0"
                                    />
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          
                          <td className="p-4 text-right font-bold text-text-main whitespace-nowrap bg-bg/30 group-hover:bg-bg/50">
                            Rp. {formatRupiah(rowTotal)}
                          </td>
                          {!isReadOnly && (
                            <td className="p-4 text-center sticky right-0 bg-white z-20 shadow-[-1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                              <Button 
                                size="sm"
                                variant={row.isDirty ? "primary" : "outline"}
                                onClick={() => handleSimpanBaris(row)}
                                disabled={!row.isDirty || savingRowId === row.id}
                                className="px-3 py-1.5 h-auto text-xs font-semibold transition-all shadow-sm"
                              >
                                {savingRowId === row.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <><Save size={14} className="mr-1" /> Simpan</>
                                )}
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {filteredData.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={2} className="p-4 text-right text-text-main sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                        TOTAL KESELURUHAN
                      </td>
                      {akunColumns.map(col => {
                        const colTotal = filteredData.reduce((acc, row) => {
                          const isLocked = row.lockedMap && row.lockedMap[col.id]
                          return acc + (isLocked ? 0 : (row.tagihanMap[col.id] || 0))
                        }, 0)
                        return (
                          <td key={col.id} className="p-4 text-right text-emerald-700">
                            Rp. {formatRupiah(colTotal)}
                          </td>
                        )
                      })}
                      <td className="p-4 text-right text-emerald-700 bg-emerald-50">
                        Rp. {formatRupiah(filteredData.reduce((acc, row) => acc + akunColumns.reduce((sum, col) => {
                          const isLocked = row.lockedMap && row.lockedMap[col.id]
                          return sum + (isLocked ? 0 : (row.tagihanMap[col.id] || 0))
                        }, 0), 0))}
                      </td>
                      <td className="p-4 sticky right-0 bg-gray-50 z-20 shadow-[-1px_0_0_0_#e2e8f0]"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
              <Filter className="mb-4 text-text-muted/50" size={48} strokeWidth={1} />
              <h3 className="text-lg font-bold text-text-main mb-2">Pilih Filter Terlebih Dahulu</h3>
              <p className="max-w-md">
                Silakan pilih <strong>Kelas</strong> dan <strong>Subkelas</strong> pada kolom filter di atas, lalu klik tombol <strong>Tampilkan</strong> untuk melihat atau membuat tagihan siswa.
              </p>
            </div>
          )
        )}
      </div>

      {/* Overlay to close menu */}
      {activeMenuColId && (
        <div className="fixed inset-0 z-[90]" onClick={() => setActiveMenuColId(null)} />
      )}

      {/* Modal Edit Massal */}
      {isEditModalOpen && editingCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-text-main">Ubah Nominal Massal</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-text-muted hover:bg-bg rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditMassalSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-text-muted mb-4">
                  Anda akan mengubah tagihan <strong>{editingCol.nama}</strong> untuk seluruh siswa di <strong>Subkelas {activeSubKelasName}</strong>.
                </p>
                <label className="text-sm font-semibold text-text-main block mb-2">Nominal Baru</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium text-sm">Rp.</span>
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                    value={editNominal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setEditNominal(val ? formatRupiah(parseInt(val)) : "")
                    }}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={isEditingMassal}>
                  {isEditingMassal ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Massal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleHapusMassal}
        title="Hapus Kolom Tagihan"
        message={`Apakah Anda yakin ingin menghapus tagihan ${deletingCol?.nama} dari seluruh siswa di subkelas ini? Aksi ini akan menghapus semua riwayat tagihan tersebut yang belum dibayar.`}
        confirmText="Hapus Tagihan"
        cancelText="Batal"
        isLoading={isDeletingMassal}
      />

      <ModalTambahTagihan
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        akunPendapatanList={akunPendapatanList}
        kelasList={kelasList}
        subKelasList={subKelasList}
        gridData={gridData}
        activeKelasId={kelasId}
        activeSubKelasId={subKelasId}
        isSubmitting={isSubmittingModal}
      />
    </div>
  )
}
