"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { 
  getKelasByUnit, 
  getSubKelasByKelas,
  getJurusanByUnit,
  getMuridWithTagihan, 
  tambahTagihanMassal, 
  updateTagihanSiswa,
  editTagihanMassal,
  hapusTagihanMassal,
  getColumnOrder,
  saveColumnOrder,
  updateTagihanKolomMassal
} from "@/actions/pembuatan-tagihan"
import { Plus, Search, Filter, Loader2, Save, MoreVertical, Edit2, Trash2, X, GripHorizontal } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import ModalTambahTagihan from "./ModalTambahTagihan"
import ModalEditTagihanKolom from "./ModalEditTagihanKolom"
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
  hasMovedClass: boolean
  latestClassName: string | null
}

type TagihanColumn = {
  id: string
  akunId: string
  namaTagihan: string
  nama: string
  kode: string
  jumlah: number
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
  const [targetList, setTargetList] = useState<string[]>([])

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)

  // Auto Scroll Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Header Menu States
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null)
  
  // Edit Massal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCol, setEditingCol] = useState<TagihanColumn | null>(null)
  
  // Drag and Drop Global State
  const [globalColumnOrder, setGlobalColumnOrder] = useState<string[]>([])
  const [isEditingMassal, setIsEditingMassal] = useState(false)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
      setJurusanId("") // Do not auto-select to prevent filtering out classes with null jurusan
    })
  }, [activeUnitId])

  useEffect(() => {
    if (!kelasId || !activeTahunAkademikId) {
      setSubKelasList([])
      setSubKelasId("")
      return
    }
    
    const selectedJurusan = jurusanId ? jurusanId : undefined;
    getSubKelasByKelas(kelasId, selectedJurusan, activeTahunAkademikId).then(res => {
      setSubKelasList(res)
      if (res.length > 0) setSubKelasId(res[0].id)
      else setSubKelasId("")
    })
  }, [kelasId, jurusanId, jurusanList, activeTahunAkademikId])

  const processData = (muridList: any[], order?: string[]) => {
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
            kode: t.akun.kode,
            jumlah: t.jumlah || 0
          })
        }
      })
    })
    
    const columns = Array.from(columnsMap.values()).sort((a, b) => a.kode.localeCompare(b.kode))
    
    // Sort based on globalColumnOrder
    if (order && order.length > 0) {
      columns.sort((a, b) => {
        const idxA = order.indexOf(a.id)
        const idxB = order.indexOf(b.id)
        if (idxA === -1 && idxB === -1) return 0
        if (idxA === -1) return 1
        if (idxB === -1) return -1
        return idxA - idxB
      })
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

      const latestRiwayat = murid.riwayatKelas?.[0]
      const hasMoved = latestRiwayat && latestRiwayat.subKelasId !== subKelasId

      return {
        id: murid.id,
        name: murid.name,
        nisn: murid.nisn || "-",
        formNo: murid.formNo || "-",
        tagihanMap: tMap,
        lockedMap: lMap,
        isDirty: false,
        hasMovedClass: !!hasMoved,
        latestClassName: latestRiwayat?.subKelas?.name || null
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
      const [data, order] = await Promise.all([
        getMuridWithTagihan(subKelasId, activeTahunAkademikId),
        getColumnOrder(activeUnitId)
      ])
      setGlobalColumnOrder(order)
      processData(data, order)
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
    muridIds?: string[],
    isSPP?: boolean,
    sppMonths?: string[],
    sppYear?: string
  }) => {
    setIsSubmittingModal(true)
    try {
      const isSPP = data.isSPP
      const baseName = data.namaTagihan || "SPP"
      const tagihans = isSPP && data.sppMonths ? data.sppMonths.map(m => `${baseName} ${m} ${data.sppYear}`) : undefined

      await tambahTagihanMassal({
        tahunAkademikId: activeTahunAkademikId,
        akunId: data.akunId,
        namaTagihan: isSPP ? undefined : data.namaTagihan,
        namaTagihans: tagihans,
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

  const handleModalEditKolomSubmit = async (data: { akunId: string, namaTagihan: string, jumlah: number }) => {
    if (!editingCol || !subKelasId || !activeTahunAkademikId) return
    setIsSubmittingModal(true)
    try {
      await updateTagihanKolomMassal(
        subKelasId, 
        activeTahunAkademikId, 
        editingCol.akunId, 
        editingCol.namaTagihan, 
        data.akunId, 
        data.namaTagihan, 
        data.jumlah
      )
      
      // Auto replace in global order if ID changed
      const oldId = editingCol.id
      const newId = `${data.akunId}::${data.namaTagihan}`
      let newOrder = [...globalColumnOrder]
      if (oldId !== newId) {
        if (newOrder.includes(oldId)) {
          newOrder = newOrder.map(id => id === oldId ? newId : id)
        } else {
          // If neither existed, just add to the end of currently rendered columns with replacement
          newOrder = akunColumns.map(c => c.id === oldId ? newId : c.id)
        }
        await saveColumnOrder(activeUnitId, newOrder)
      }
      
      toast.success("Kolom tagihan berhasil diubah")
      setIsEditModalOpen(false)
      handleTampilkan() // Reload to get fresh column names and amounts
    } catch (error: any) {
      toast.error("Gagal: " + error.message)
    } finally {
      setIsSubmittingModal(false)
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
    const res = gridData.filter(row => 
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.formNo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return res
  }, [gridData, searchTerm])

  // Pagination Logic
  const computedTotalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, subKelasId, kelasId, pageSize])

  // Drag Auto-Scroll Logic
  const handleDragOverContainer = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedColumnId || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const rect = container.getBoundingClientRect()
    
    // Threshold 30% dari lebar layar agar lebih mudah memicu scroll tanpa harus ke ujung banget
    const scrollThreshold = rect.width * 0.30
    const maxScrollSpeed = 25 // Max scroll pixels per frame

    const x = e.clientX - rect.left

    if (x < scrollThreshold) {
      // Scroll left
      const speed = maxScrollSpeed * (1 - x / scrollThreshold)
      container.scrollLeft -= speed
    } else if (x > rect.width - scrollThreshold) {
      // Scroll right
      const speed = maxScrollSpeed * (1 - (rect.width - x) / scrollThreshold)
      container.scrollLeft += speed
    }
  }

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
            <div 
              ref={scrollContainerRef}
              className="overflow-x-auto min-h-[400px]"
              onDragOver={handleDragOverContainer}
            >
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
                            
                            const finalOrder = newCols.map(c => c.id)
                            setAkunColumns(newCols)
                            setGlobalColumnOrder(finalOrder)
                            saveColumnOrder(activeUnitId, finalOrder).catch(e => {
                              console.error("Failed to save column order", e)
                              toast.error("Gagal menyimpan urutan kolom")
                            })
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
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit2 size={14} className="text-blue-500" />
                              Edit Tagihan
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
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={4 + akunColumns.length} className="p-8 text-center text-text-muted">
                        Tidak ada data murid yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => {
                      const rowTotal = akunColumns.reduce((acc, col) => {
                        const isLocked = row.lockedMap && row.lockedMap[col.id]
                        return acc + (isLocked ? 0 : (row.tagihanMap[col.id] || 0))
                      }, 0)
                      
                      return (
                        <tr key={row.id} className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-4 text-center text-text-muted font-medium sticky left-0 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                            {(currentPage - 1) * pageSize + idx + 1}.
                          </td>
                          <td className="p-4 sticky left-12 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-bg/50">
                            <div>
                              <p className={`font-semibold leading-tight truncate max-w-[200px] ${row.hasMovedClass ? 'text-red-500' : 'text-text-main'}`} title={row.name}>
                                {row.name}
                              </p>
                              {row.hasMovedClass && (
                                <p className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-red-100">
                                  Sudah di {row.latestClassName || "Kelas Lain"}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">{row.nisn} • {row.formNo}</p>
                          </td>
                          
                          {akunColumns.map(col => {
                            const isLocked = row.lockedMap && row.lockedMap[col.id]
                            return (
                              <td key={col.id} className="p-4 relative">
                                {isLocked ? (
                                  <div className="relative flex items-center p-1.5 w-[140px] mx-auto rounded-lg bg-emerald-100/50 border border-emerald-200 text-emerald-700 font-bold select-none transition-all">
                                    <span className="absolute left-3 text-emerald-700/70 text-xs font-semibold">Rp.</span>
                                    <span className="text-sm w-full text-right pr-2">{formatRupiah(row.tagihanMap[col.id] || 0)}</span>
                                  </div>
                                ) : (
                                  <div className="relative group/input flex items-center w-[140px] mx-auto">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/60 text-xs font-semibold z-10">Rp.</span>
                                    <input 
                                      type="text"
                                      disabled={isReadOnly}
                                      className="w-full pl-8 pr-3 py-1.5 bg-bg border border-border/60 hover:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white text-sm font-semibold text-right transition-all text-text-main disabled:opacity-70 disabled:bg-gray-50 placeholder:text-text-muted/40"
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

            {/* Pagination Controls */}
            {computedTotalPages > 0 && (
              <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                    }}
                    className="px-3 py-1.5 bg-bg border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  >
                    {[5, 10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-4 py-1.5 text-sm font-medium text-text-main">
                    Hal {currentPage} dari {computedTotalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(computedTotalPages, p + 1))}
                    disabled={currentPage === computedTotalPages}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
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
      {/* Modal Edit Tagihan Kolom */}
      <ModalEditTagihanKolom
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleModalEditKolomSubmit}
        akunPendapatanList={akunPendapatanList}
        editingCol={editingCol}
        isSubmitting={isSubmittingModal}
        hasPayments={editingCol ? gridData.some(row => {
          const compId = `${editingCol.akunId}::${editingCol.namaTagihan}`
          return row.lockedMap[compId] // true if sisaTagihan < jumlah
        }) : false}
      />
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
