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
import { Plus, Search, Filter, Loader2, Save, MoreVertical, Edit2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import ModalTambahTagihan from "./ModalTambahTagihan"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

type GridRow = {
  id: string
  name: string
  nisn: string
  formNo: string
  tagihanMap: Record<string, number> // akunId -> jumlah
  isDirty: boolean
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
  const [akunColumns, setAkunColumns] = useState<{id: string, nama: string, kode: string}[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)

  // Header Menu States
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null)
  
  // Edit Massal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCol, setEditingCol] = useState<{id: string, nama: string} | null>(null)
  const [editNominal, setEditNominal] = useState("0")
  const [isEditingMassal, setIsEditingMassal] = useState(false)

  // Delete Massal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingCol, setDeletingCol] = useState<{id: string, nama: string} | null>(null)
  const [isDeletingMassal, setIsDeletingMassal] = useState(false)

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

  // 2. Fetch SubKelas when Kelas or Jurusan changes
  useEffect(() => {
    if (!kelasId || (jurusanList.length > 0 && !jurusanId)) {
      setSubKelasList([])
      setSubKelasId("")
      return
    }
    
    getSubKelasByKelas(kelasId, jurusanList.length > 0 ? jurusanId : undefined).then(res => {
      setSubKelasList(res)
      if (res.length > 0) setSubKelasId(res[0].id)
      else setSubKelasId("")
    })
  }, [kelasId, jurusanId, jurusanList])

  // Process data to build Grid and Columns
  const processData = (muridList: any[]) => {
    const columnsMap = new Map<string, {id: string, nama: string, kode: string}>()
    
    // Pass 1: Gather all unique akun columns from tagihan
    muridList.forEach(murid => {
      murid.tagihan?.forEach((t: any) => {
        if (!columnsMap.has(t.akunId)) {
          columnsMap.set(t.akunId, {
            id: t.akun.id,
            nama: t.akun.nama,
            kode: t.akun.kode
          })
        }
      })
    })
    
    const columns = Array.from(columnsMap.values()).sort((a, b) => a.kode.localeCompare(b.kode))
    setAkunColumns(columns)

    // Pass 2: Build grid rows
    const rows: GridRow[] = muridList.map(murid => {
      const tMap: Record<string, number> = {}
      murid.tagihan?.forEach((t: any) => {
        tMap[t.akunId] = t.jumlah
      })
      return {
        id: murid.id,
        name: murid.name,
        nisn: murid.nisn || "-",
        formNo: murid.formNo || "-",
        tagihanMap: tMap,
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

  const handleModalSubmit = async (data: { akunId: string, jumlah: number }) => {
    setIsSubmittingModal(true)
    try {
      await tambahTagihanMassal({
        subKelasId,
        tahunAkademikId: activeTahunAkademikId,
        akunId: data.akunId,
        jumlah: data.jumlah
      })
      toast.success("Berhasil membuat tagihan massal!")
      setIsModalOpen(false)
      // Refresh data
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
      // Build array of updates based on current columns
      const updates = akunColumns.map(col => ({
        akunId: col.id,
        jumlah: row.tagihanMap[col.id] || 0
      }))

      await updateTagihanSiswa(row.id, activeTahunAkademikId, updates)
      toast.success("Perubahan disimpan")
      
      // Mark as not dirty
      setGridData(prev => prev.map(r => r.id === row.id ? { ...r, isDirty: false } : r))
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message)
    } finally {
      setSavingRowId(null)
    }
  }

  const handleInputChange = (rowId: string, akunId: string, val: string) => {
    const num = parseFloat(val.replace(/[^0-9]/g, '')) || 0
    setGridData(prev => prev.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          isDirty: true,
          tagihanMap: {
            ...r.tagihanMap,
            [akunId]: num
          }
        }
      }
      return r
    }))
  }

  const handleEditMassalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subKelasId || !editingCol) return

    const num = parseFloat(editNominal.replace(/[^0-9]/g, '')) || 0
    setIsEditingMassal(true)
    try {
      await editTagihanMassal(subKelasId, activeTahunAkademikId, editingCol.id, num)
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
    if (!subKelasId || !deletingCol) return
    setIsDeletingMassal(true)
    try {
      await hapusTagihanMassal(subKelasId, activeTahunAkademikId, deletingCol.id)
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Pembuatan Tagihan Siswa</h1>
          <p className="text-text-muted">Kelola tagihan massal untuk siswa berdasarkan komponen biaya</p>
        </div>
        
        {gridData.length > 0 && (
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm whitespace-nowrap"
          >
            <Plus size={16} className="mr-1.5" /> Tambah Tagihan Siswa
          </Button>
        )}
      </div>

      {/* FILTER PANEL */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
          <Filter size={18} className="text-primary" /> Filter Subkelas
        </h2>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 ${jurusanList.length > 0 ? 'xl:grid-cols-3' : ''} gap-4 bg-bg/50 p-4 rounded-xl border border-border/50`}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Kelas</label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium disabled:opacity-60"
              value={kelasId}
              onChange={e => setKelasId(e.target.value)}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(kelas => (
                <option key={kelas.id} value={kelas.id}>{kelas.name}</option>
              ))}
            </select>
          </div>

          {jurusanList.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Jurusan</label>
              <select 
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium disabled:opacity-60"
                value={jurusanId}
                onChange={e => setJurusanId(e.target.value)}
              >
                <option value="">-- Pilih Jurusan --</option>
                {jurusanList.map(jurusan => (
                  <option key={jurusan.id} value={jurusan.id}>{jurusan.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Subkelas</label>
            <div className="flex gap-2">
              <select 
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium disabled:opacity-60"
                value={subKelasId}
                onChange={e => setSubKelasId(e.target.value)}
                disabled={!kelasId}
              >
                <option value="">-- Pilih Subkelas --</option>
                {subKelasList.map(sk => (
                  <option key={sk.id} value={sk.id}>{sk.name}</option>
                ))}
              </select>
              <Button 
                onClick={handleTampilkan} 
                disabled={!subKelasId || isLoading}
                className="px-6 whitespace-nowrap bg-albas-green hover:bg-albas-green/90"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Tampilkan"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX TABLE */}
      {gridData.length > 0 && (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col relative min-h-[400px]">
          
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-main">Daftar Tagihan Siswa</h2>
              <p className="text-sm text-text-muted mt-0.5">Subkelas {activeSubKelasName} - Tahun Akademik {activeTahunAkademikName}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Pencarian nama siswa..." 
                  className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 rounded-xl border border-border">
            <table className="w-full text-left text-sm border-collapse min-w-max">
              <thead>
                <tr className="bg-bg/80 border-b border-border text-xs uppercase tracking-wider text-text-muted sticky top-0 z-10 backdrop-blur-sm">
                  <th className="p-3 font-semibold text-center w-12 sticky left-0 bg-bg/95 z-20 shadow-[1px_0_0_0_#e2e8f0]">No.</th>
                  <th className="p-3 font-semibold min-w-[200px] sticky left-12 bg-bg/95 z-20 shadow-[1px_0_0_0_#e2e8f0]">Siswa/i</th>
                  
                  {akunColumns.map(col => (
                    <th key={col.id} className="p-3 font-semibold text-center min-w-[150px] relative group">
                      <div className="flex items-center justify-center gap-2">
                        <div>
                          {col.nama} <br/><span className="text-[10px] opacity-70">[{col.kode}]</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuColId(activeMenuColId === col.id ? null : col.id)
                          }}
                          className="p-1 rounded text-text-muted hover:bg-black/5 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {activeMenuColId === col.id && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-36 bg-white rounded-lg shadow-lg border border-border py-1.5 z-[99] animate-in fade-in zoom-in-95">
                          <button 
                            className="w-full px-3 py-2 text-left text-xs font-medium text-text-main hover:bg-bg flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuColId(null)
                              setEditingCol({ id: col.id, nama: col.nama })
                              setEditNominal("0")
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit2 size={14} className="text-blue-500" />
                            Ubah Nominal
                          </button>
                          <button 
                            className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuColId(null)
                              setDeletingCol({ id: col.id, nama: col.nama })
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
                  
                  <th className="p-3 font-semibold text-right min-w-[150px]">Total Tagihan</th>
                  <th className="p-3 font-semibold text-center w-24 sticky right-0 bg-bg/95 z-20 shadow-[-1px_0_0_0_#e2e8f0]">Aksi</th>
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
                    const rowTotal = akunColumns.reduce((acc, col) => acc + (row.tagihanMap[col.id] || 0), 0)
                    
                    return (
                      <tr key={row.id} className={`border-b border-border/50 hover:bg-gray-50/50 transition-colors ${row.isDirty ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-3 text-center text-text-muted font-medium sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                          {idx + 1}.
                        </td>
                        <td className="p-3 sticky left-12 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                          <p className="font-semibold text-text-main leading-tight truncate max-w-[200px]" title={row.name}>{row.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">{row.nisn} • {row.formNo}</p>
                        </td>
                        
                        {akunColumns.map(col => (
                          <td key={col.id} className="p-3">
                            <div className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 text-xs font-semibold">Rp.</span>
                              <input 
                                type="text"
                                className="w-full min-w-[130px] pl-9 pr-3 py-1.5 bg-bg border border-border/60 hover:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white text-sm font-semibold text-right transition-all"
                                value={row.tagihanMap[col.id] === undefined ? "" : formatRupiah(row.tagihanMap[col.id])}
                                onChange={(e) => handleInputChange(row.id, col.id, e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </td>
                        ))}
                        
                        <td className="p-3 text-right font-bold text-text-main whitespace-nowrap bg-bg/30">
                          Rp. {formatRupiah(rowTotal)}
                        </td>
                        <td className="p-3 text-center sticky right-0 bg-white z-10 shadow-[-1px_0_0_0_#e2e8f0]">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!row.isDirty || savingRowId === row.id}
                            onClick={() => handleSimpanBaris(row)}
                            className={`px-3 py-1.5 h-auto font-semibold rounded-lg text-xs ${row.isDirty ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-text-muted/50'}`}
                          >
                            {savingRowId === row.id ? "Menyimpan..." : "Simpan"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && gridData.length === 0 && (
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-4">
            <Filter className="text-text-muted" size={24} />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">Pilih Filter Terlebih Dahulu</h3>
          <p className="text-text-muted max-w-sm">
            Silakan pilih Kelas dan Subkelas pada panel di atas, lalu klik Tampilkan untuk melihat atau membuat tagihan.
          </p>
        </div>
      )}

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
        kelasName={activeKelasName}
        subKelasName={activeSubKelasName}
        isSubmitting={isSubmittingModal}
      />
    </div>
  )
}
