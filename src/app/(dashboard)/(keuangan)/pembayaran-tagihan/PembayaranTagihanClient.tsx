"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  getKelasByUnit, 
  getSubKelasByKelas,
  getJurusanByUnit
} from "@/actions/pembuatan-tagihan"
import { 
  getMuridWithTagihanUnpaid,
  prosesPembayaranTagihan,
  getRiwayatTransaksiByTagihan
} from "@/actions/pembayaran-tagihan"
import { Search, Filter, Loader2, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import ModalPembayaranTagihan, { TagihanItem } from "./ModalPembayaranTagihan"
import ModalResiPembayaran, { ReceiptData } from "./ModalResiPembayaran"
import ModalPilihRiwayatTransaksi from "./ModalPilihRiwayatTransaksi"

type TagihanData = {
  id: string
  jumlah: number
  sisaTagihan: number
  status: string
  akunId: string
  akun: { id: string, nama: string, kode: string }
}

type GridRow = {
  id: string
  name: string
  nisn: string
  formNo: string
  tagihanList: TagihanData[]
  // State for checkboxes: Map<tagihanId, boolean>
  selectedItems: Record<string, boolean>
}

export default function PembayaranTagihanClient({
  activeUnitId,
  activeTahunAkademikId,
  activeTahunAkademikName,
  akunKasBankList,
  user
}: {
  activeUnitId: string
  activeTahunAkademikId: string
  activeTahunAkademikName: string
  akunKasBankList: any[]
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
  const [akunColumns, setAkunColumns] = useState<{id: string, nama: string, kode: string}[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeMurid, setActiveMurid] = useState<{id: string, name: string} | null>(null)
  const [modalItems, setModalItems] = useState<TagihanItem[]>([])
  
  // Receipt State
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  
  // Riwayat State
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([])
  const [isModalRiwayatOpen, setIsModalRiwayatOpen] = useState(false)
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState<string | null>(null)

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

  // Process data
  const processData = (muridList: any[]) => {
    const columnsMap = new Map<string, {id: string, nama: string, kode: string}>()
    
    muridList.forEach(murid => {
      murid.tagihan?.forEach((t: TagihanData) => {
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

    const rows: GridRow[] = muridList.map(murid => ({
      id: murid.id,
      name: murid.name,
      nisn: murid.nisn || "-",
      formNo: murid.formNo || "-",
      tagihanList: murid.tagihan || [],
      selectedItems: {}
    }))
    
    setGridData(rows)
    setCurrentPage(1)
  }

  const handleTampilkan = async () => {
    if (!subKelasId || !activeTahunAkademikId) {
      toast.error("Pilih Subkelas dan Tahun Akademik terlebih dahulu")
      return
    }
    setIsLoading(true)
    try {
      const res = await getMuridWithTagihanUnpaid({
        unitSekolahId: activeUnitId,
        tahunAkademikId: activeTahunAkademikId,
        kelasId: kelasId,
        subKelasId: subKelasId
      })
      processData(res)
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil data")
    } finally {
      setIsLoading(false)
    }
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val)
  }

  const filteredData = useMemo(() => {
    return gridData.filter(row => 
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.formNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.nisn.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [gridData, searchTerm])

  const handleCheckboxChange = (muridId: string, tagihanId: string, checked: boolean) => {
    setGridData(prev => prev.map(row => {
      if (row.id === muridId) {
        return {
          ...row,
          selectedItems: {
            ...row.selectedItems,
            [tagihanId]: checked
          }
        }
      }
      return row
    }))
  }

  const handleBayarClick = (row: GridRow) => {
    // Get all checked items for this row
    const itemsToPay: TagihanItem[] = []
    
    row.tagihanList.forEach(t => {
      if (row.selectedItems[t.id]) {
        itemsToPay.push({
          tagihanId: t.id,
          namaAkun: t.akun.nama,
          kodeAkun: t.akun.kode,
          akunPendapatanId: t.akun.id,
          jumlahBayar: t.sisaTagihan // Full payment for now
        })
      }
    })

    if (itemsToPay.length === 0) {
      toast.error("Pilih minimal 1 tagihan untuk dibayar")
      return
    }

    setModalItems(itemsToPay)
    setActiveMurid({ id: row.id, name: row.name })
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (data: any) => {
    if (!activeMurid) return
    setIsSubmitting(true)
    
    const payload = {
      ...data,
      muridId: activeMurid.id,
      muridName: activeMurid.name,
      unitSekolahId: activeUnitId,
      pembuatId: user.id
    }
    
    const res = await prosesPembayaranTagihan(payload)
    if (res.success) {
      toast.success("Pembayaran berhasil diproses")
      setIsModalOpen(false)
      
      // Calculate total
      const totalBayar = payload.items.reduce((sum: number, item: any) => sum + item.jumlahBayar, 0)
      
      // Open receipt
      setReceiptData({
        noReferensi: res.data?.noReferensi || payload.noReferensi || `INV-${new Date().getTime()}`,
        tanggal: payload.tanggal,
        muridName: payload.muridName,
        items: payload.items,
        total: totalBayar
      })
      
      handleTampilkan() // refresh data
    } else {
      toast.error(res.message || "Gagal memproses pembayaran")
    }
    setIsSubmitting(false)
  }

  const handlePrintTagihan = async (tagihanId: string) => {
    setIsLoadingRiwayat(tagihanId)
    try {
      const riwayat = await getRiwayatTransaksiByTagihan(tagihanId)
      if (riwayat.length === 0) {
        toast.error("Riwayat pembayaran tidak ditemukan")
      } else if (riwayat.length === 1) {
        setReceiptData(riwayat[0])
      } else {
        setRiwayatTransaksi(riwayat)
        setIsModalRiwayatOpen(true)
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil riwayat pembayaran")
    } finally {
      setIsLoadingRiwayat(null)
    }
  }

  const handlePilihRiwayat = (data: ReceiptData) => {
    setIsModalRiwayatOpen(false)
    setReceiptData(data)
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Pembayaran Tagihan Siswa</h1>
        <p className="text-text-muted">Proses pembayaran tagihan komponen biaya secara matriks per siswa</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary">
            Daftar Tagihan Siswa
          </button>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:flex-1">
            <div className="relative w-full flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Cari siswa atau NISN..." 
                className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                disabled={gridData.length === 0}
              />
            </div>

            <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-2 py-1">
              <Filter size={14} className="text-text-muted ml-2" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-1"
                value={kelasId}
                onChange={e => setKelasId(e.target.value)}
              >
                <option value="">Kelas...</option>
                {kelasList.map(kelas => (
                  <option key={kelas.id} value={kelas.id}>{kelas.name}</option>
                ))}
              </select>
            </div>

            {jurusanList.length > 0 && (
              <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-2 py-1">
                <select 
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-1 px-2"
                  value={jurusanId}
                  onChange={e => setJurusanId(e.target.value)}
                >
                  <option value="">Jurusan...</option>
                  {jurusanList.map(jurusan => (
                    <option key={jurusan.id} value={jurusan.id}>{jurusan.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-2 py-1">
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-text-main py-1 px-2"
                value={subKelasId}
                onChange={e => setSubKelasId(e.target.value)}
                disabled={!kelasId}
              >
                <option value="">Subkelas...</option>
                {subKelasList.map(sk => (
                  <option key={sk.id} value={sk.id}>{sk.name}</option>
                ))}
              </select>
            </div>

            <Button 
              size="sm"
              onClick={handleTampilkan} 
              disabled={!subKelasId || isLoading}
              className="px-4 py-1.5 h-auto whitespace-nowrap bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Tampilkan"}
            </Button>
          </div>
        </div>

        {/* Table Container */}
        {gridData.length > 0 ? (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-emerald-500 text-white text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold text-center w-12 sticky left-0 bg-emerald-500 z-20 shadow-[1px_0_0_0_#10b981]">NO</th>
                  <th className="p-4 font-bold min-w-[200px] sticky left-12 bg-emerald-500 z-20 shadow-[1px_0_0_0_#10b981]">SISWA/I</th>
                  
                  {akunColumns.map(col => (
                    <th key={col.id} className="p-4 font-bold text-center min-w-[150px]">
                      <div>
                        {col.nama} <br/><span className="text-[10px] opacity-80 font-medium">[{col.kode}]</span>
                      </div>
                    </th>
                  ))}
                  
                  <th className="p-4 font-bold text-right min-w-[150px]">TOTAL BERJALAN</th>
                  {!isReadOnly && <th className="p-4 font-bold text-center w-24 sticky right-0 bg-emerald-500 z-20 shadow-[-1px_0_0_0_#10b981]">PROSES</th>}
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
                    // Calculate total of checked items
                    let totalBerjalan = 0;
                    let totalTagihanSiswa = 0;

                    row.tagihanList.forEach(t => {
                      totalTagihanSiswa += t.sisaTagihan
                      if (row.selectedItems[t.id]) {
                        totalBerjalan += t.sisaTagihan
                      }
                    })
                    
                    return (
                      <tr key={row.id} className="border-b border-border hover:bg-gray-50 transition-colors group">
                        <td className="p-4 text-center text-text-muted font-medium sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-gray-50">
                          {idx + 1}.
                        </td>
                        <td className="p-4 sticky left-12 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-gray-50">
                          <p className="font-bold text-text-main leading-tight truncate max-w-[200px]" title={row.name}>{row.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">{row.nisn} • {row.formNo}</p>
                        </td>
                        
                        {akunColumns.map(col => {
                          const tagihan = row.tagihanList.find(t => t.akunId === col.id)
                          
                          return (
                            <td key={col.id} className="p-4">
                              {tagihan ? (
                                tagihan.sisaTagihan <= 0 ? (
                                  <button 
                                    onClick={() => handlePrintTagihan(tagihan.id)}
                                    disabled={isLoadingRiwayat === tagihan.id}
                                    className="flex w-full items-center justify-center p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:shadow-sm group/btn"
                                    title="Cetak Ulang Resi"
                                  >
                                    {isLoadingRiwayat === tagihan.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <>
                                        <span className="text-sm font-bold opacity-70 group-hover/btn:hidden">Rp 0</span>
                                        <span className="text-sm font-bold hidden group-hover/btn:inline-flex items-center gap-1">
                                          Cetak Resi
                                        </span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <label className={`
                                    flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer border select-none transition-all
                                    ${row.selectedItems[tagihan.id] 
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                      : 'border-border bg-white hover:bg-gray-50 text-text-main'}
                                  `}>
                                    <input 
                                      type="checkbox"
                                      disabled={isReadOnly}
                                      className={`w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      checked={row.selectedItems[tagihan.id] || false}
                                      onChange={(e) => handleCheckboxChange(row.id, tagihan.id, e.target.checked)}
                                    />
                                    <span className="text-sm font-bold">
                                      Rp {formatRupiah(tagihan.sisaTagihan)}
                                    </span>
                                  </label>
                                )
                              ) : (
                                <div className="text-center text-xs text-text-muted/50 p-2 bg-gray-50 rounded-lg">
                                  -
                                </div>
                              )}
                            </td>
                          )
                        })}
                        
                        <td className="p-4 text-right bg-gray-50 group-hover:bg-gray-100">
                          <div className="font-bold text-emerald-600 text-base">
                            Rp {formatRupiah(totalBerjalan)}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5 font-medium">
                            Total Seluruh: Rp {formatRupiah(totalTagihanSiswa)}
                          </div>
                        </td>
                        {!isReadOnly && (
                          <td className="p-4 text-center sticky right-0 bg-white z-10 shadow-[-1px_0_0_0_#e2e8f0] group-hover:bg-gray-50">
                            <Button 
                              size="sm"
                              disabled={totalBerjalan === 0}
                              onClick={() => handleBayarClick(row)}
                              className="px-4 py-2 font-bold rounded-lg text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                            >
                              Bayar
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="bg-gray-50 font-bold border-t-2 border-border/60">
                  <tr>
                    <td colSpan={2} className="p-4 text-right text-text-main sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      TOTAL SISA TAGIHAN
                    </td>
                    {akunColumns.map(col => {
                      const colTotal = filteredData.reduce((acc, row) => {
                        const t = row.tagihanList.find(tag => tag.akunId === col.id)
                        return acc + (t ? Math.max(0, t.sisaTagihan) : 0)
                      }, 0)
                      return (
                        <td key={col.id} className="p-4 text-center text-emerald-700">
                          Rp {formatRupiah(colTotal)}
                        </td>
                      )
                    })}
                    <td className="p-4 text-right bg-emerald-50 text-emerald-700 shadow-[-1px_0_0_0_#e2e8f0]">
                      Rp {formatRupiah(filteredData.reduce((acc, row) => {
                        return acc + row.tagihanList.reduce((sum, tag) => sum + Math.max(0, tag.sisaTagihan), 0)
                      }, 0))}
                    </td>
                    <td className="p-4 sticky right-0 bg-gray-50 z-20 shadow-[-1px_0_0_0_#e2e8f0]"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
              <Filter className="mb-4 text-text-muted/50" size={48} strokeWidth={1} />
              <h3 className="text-lg font-bold text-text-main mb-2">Pilih Filter Terlebih Dahulu</h3>
              <p className="max-w-md">
                Silakan pilih <strong>Kelas</strong> pada kolom filter di atas untuk melihat tagihan siswa.
              </p>
            </div>
          )
        )}
      </div>

      <ModalPembayaranTagihan 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
        muridName={activeMurid?.name || ""}
        items={modalItems}
        akunKasBankList={akunKasBankList}
      />
      
      <ModalResiPembayaran
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />
      
      <ModalPilihRiwayatTransaksi
        isOpen={isModalRiwayatOpen}
        onClose={() => setIsModalRiwayatOpen(false)}
        riwayat={riwayatTransaksi}
        onSelect={handlePilihRiwayat}
      />
    </div>
  )
}
