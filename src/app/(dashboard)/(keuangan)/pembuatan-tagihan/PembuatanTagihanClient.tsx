"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  getKelasByUnit, 
  getSubKelasByKelas, 
  getMuridWithTagihan, 
  tambahTagihanMassal, 
  updateTagihanSiswa 
} from "@/actions/pembuatan-tagihan"
import { Plus, Search, Filter, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import ModalTambahTagihan from "./ModalTambahTagihan"

type GridRow = {
  id: string
  name: string
  nisn: string
  formNo: string
  tagihanMap: Record<string, number> // akunId -> jumlah
  isDirty: boolean
}

export default function PembuatanTagihanClient({
  tahunAkademikAktif,
  tahunAkademikList,
  unitSekolahList,
  akunPendapatanList,
  user
}: {
  tahunAkademikAktif: any
  tahunAkademikList: any[]
  unitSekolahList: any[]
  akunPendapatanList: any[]
  user: any
}) {
  // Filter States
  const [unitId, setUnitId] = useState(unitSekolahList.length === 1 ? unitSekolahList[0].id : "")
  const [kelasList, setKelasList] = useState<any[]>([])
  const [kelasId, setKelasId] = useState("")
  const [subKelasList, setSubKelasList] = useState<any[]>([])
  const [subKelasId, setSubKelasId] = useState("")
  const [tahunAkademikId, setTahunAkademikId] = useState(tahunAkademikAktif?.id || "")

  // Data States
  const [isLoading, setIsLoading] = useState(false)
  const [gridData, setGridData] = useState<GridRow[]>([])
  const [akunColumns, setAkunColumns] = useState<{id: string, nama: string, kode: string}[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)

  // 1. Fetch Kelas when Unit changes
  useEffect(() => {
    if (!unitId) {
      setKelasList([])
      setKelasId("")
      return
    }
    getKelasByUnit(unitId).then(res => {
      setKelasList(res)
      if (res.length > 0) setKelasId(res[0].id)
      else setKelasId("")
    })
  }, [unitId])

  // 2. Fetch SubKelas when Kelas changes
  useEffect(() => {
    if (!kelasId) {
      setSubKelasList([])
      setSubKelasId("")
      return
    }
    getSubKelasByKelas(kelasId).then(res => {
      setSubKelasList(res)
      if (res.length > 0) setSubKelasId(res[0].id)
      else setSubKelasId("")
    })
  }, [kelasId])

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
    if (!subKelasId || !tahunAkademikId) {
      toast.error("Pilih Subkelas dan Tahun Akademik terlebih dahulu")
      return
    }

    setIsLoading(true)
    try {
      const data = await getMuridWithTagihan(subKelasId, tahunAkademikId)
      processData(data)
    } catch (error: any) {
      toast.error("Gagal mengambil data: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTambahMassalSubmit = async (data: { tahunAkademikId: string, akunId: string, jumlah: number }) => {
    if (!subKelasId) return
    setIsSubmittingModal(true)
    try {
      await tambahTagihanMassal({
        ...data,
        subKelasId
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

      await updateTagihanSiswa(row.id, tahunAkademikId, updates)
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
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tahun Akademik</label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
              value={tahunAkademikId}
              onChange={e => setTahunAkademikId(e.target.value)}
            >
              <option value="">-- Pilih --</option>
              {tahunAkademikList.map(ta => (
                <option key={ta.id} value={ta.id}>{ta.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tingkat (Unit)</label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
              value={unitId}
              onChange={e => setUnitId(e.target.value)}
              disabled={user.role === "TATA_USAHA" && !!user.unitSekolahId}
            >
              <option value="">-- Pilih --</option>
              {unitSekolahList.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Kelas</label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium disabled:opacity-60"
              value={kelasId}
              onChange={e => setKelasId(e.target.value)}
              disabled={!unitId}
            >
              <option value="">-- Pilih --</option>
              {kelasList.map(kelas => (
                <option key={kelas.id} value={kelas.id}>{kelas.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Subkelas</label>
            <div className="flex gap-2">
              <select 
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium disabled:opacity-60"
                value={subKelasId}
                onChange={e => setSubKelasId(e.target.value)}
                disabled={!kelasId}
              >
                <option value="">-- Pilih --</option>
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
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 overflow-hidden flex flex-col relative">
          
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-main">Daftar Tagihan Siswa</h2>
              <p className="text-sm text-text-muted mt-0.5">Subkelas {activeSubKelasName} - Tahun Akademik {tahunAkademikList.find(t=>t.id===tahunAkademikId)?.name}</p>
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
                    <th key={col.id} className="p-3 font-semibold text-center min-w-[150px]">
                      {col.nama} <br/><span className="text-[10px] opacity-70">[{col.kode}]</span>
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
            Silakan pilih Tahun Akademik dan Subkelas pada panel di atas, lalu klik Tampilkan untuk melihat atau membuat tagihan.
          </p>
        </div>
      )}

      <ModalTambahTagihan 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTambahMassalSubmit}
        tahunAkademikList={tahunAkademikList}
        akunPendapatanList={akunPendapatanList}
        kelasName={activeKelasName}
        subKelasName={activeSubKelasName}
        isSubmitting={isSubmittingModal}
      />
    </div>
  )
}
