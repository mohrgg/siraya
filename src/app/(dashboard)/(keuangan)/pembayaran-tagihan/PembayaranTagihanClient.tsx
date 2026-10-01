"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  getKelasByUnit, 
  getSubKelasByKelas,
  getJurusanByUnit,
  getColumnOrder
} from "@/actions/pembuatan-tagihan"
import { 
  getMuridWithTagihanUnpaid,
  prosesPembayaranTagihan,
  getRiwayatTransaksiByTagihan
} from "@/actions/pembayaran-tagihan"
import { Search, Filter, Loader2, CheckSquare, History, RotateCcw, Users } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { TableScrollHint } from "@/components/ui/TableScrollHint"
import toast from "react-hot-toast"
import ModalPembayaranTagihan, { TagihanItem } from "./ModalPembayaranTagihan"
import ModalResiPembayaran, { ReceiptData } from "./ModalResiPembayaran"
import ModalPilihRiwayatTransaksi from "./ModalPilihRiwayatTransaksi"
import { 
  Toolbar, 
  ToolbarSearch, 
  ToolbarFilter,
  ToolbarActions,
  ToolbarRefreshButton
} from "@/components/ui/DataTableToolbar"
import { PageHeader } from "@/components/ui/PageHeader"

type TagihanData = {
  id: string
  jumlah: number
  sisaTagihan: number
  status: string
  akunId: string
  namaTagihan: string
  akun: { id: string, nama: string, kode: string }
}

type GridRow = {
  id: string
  name: string
  nisn: string
  formNo: string
  subKelasName?: string
  tingkatName?: string
  tagihanList: TagihanData[]
  // State for checkboxes: Map<tagihanId, boolean>
  selectedItems: Record<string, boolean>
  hasOldDebts: boolean
}

const ACADEMIC_MONTH_ORDER: Record<string, number> = {
  "JULI": 1,
  "AGUSTUS": 2,
  "SEPTEMBER": 3,
  "OKTOBER": 4,
  "NOVEMBER": 5,
  "DESEMBER": 6,
  "JANUARI": 7,
  "FEBRUARI": 8,
  "MARET": 9,
  "APRIL": 10,
  "MEI": 11,
  "JUNI": 12
}

export function getNormalizedTagihanInfo(akunId: string, rawNamaTagihan: string) {
  const cleaned = (rawNamaTagihan || "").replace(/\s+/g, ' ').trim()
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  const upper = cleaned.toUpperCase()
  const foundMonth = months.find(m => upper.includes(m.toUpperCase()))
  
  // Hapus tahun 4-digit (misal: 2025, 2026, 2025/2026) agar tidak mengaburkan deteksi tingkatan
  const textWithoutYears = cleaned.replace(/\b20\d{2}(\/20\d{2})?\b/g, ' ')
  
  let level = ""
  
  // 1. Cek pola eksplisit "KELAS X", "KELAS 7", "KELAS 71", "KELAS 1", dll
  const matchKelas = textWithoutYears.match(/\bKELAS\s+([A-Z0-9]+)\b/i)
  if (matchKelas) {
    const rawLvl = matchKelas[1].toUpperCase()
    // Cek apakah rawLvl 2 digit SMP (71-79 -> 7, 81-89 -> 8, 91-99 -> 9)
    if (/^[7-9]\d$/.test(rawLvl)) {
      level = rawLvl[0]
    } else {
      level = rawLvl
    }
  } else {
    // 2. Cek Romawi mandiri (XII turun ke I)
    const romanMap = ["XII", "XI", "X", "IX", "VIII", "VII", "VI", "IV", "V", "III", "II", "I"]
    for (const r of romanMap) {
      if (new RegExp(`\\b${r}\\b`, 'i').test(textWithoutYears)) {
        level = r
        break
      }
    }
    
    // 3. Cek format 2 digit SMP mandiri (71-79, 81-89, 91-99)
    if (!level) {
      const smpMatch = textWithoutYears.match(/\b([7-9])\d\b/)
      if (smpMatch) {
        level = smpMatch[1]
      }
    }
    
    // 4. Cek angka Arab 1-12 mandiri
    if (!level) {
      const arabMatch = textWithoutYears.match(/\b([1-9]|1[0-2])\b/)
      if (arabMatch) {
        level = arabMatch[1]
      }
    }
  }

  // Jika terdeteksi bulan kalender
  if (foundMonth) {
    const monthUpper = foundMonth.toUpperCase()
    const monthOrder = ACADEMIC_MONTH_ORDER[monthUpper] || 99

    if (level) {
      const key = `${akunId}::SPP_KELAS_${level}_${monthUpper}`
      const displayName = `SPP KELAS ${level} ${monthUpper}`
      return { key, displayName, monthOrder }
    } else if (upper.includes("SPP")) {
      const key = `${akunId}::SPP_${monthUpper}`
      const displayName = `SPP ${monthUpper}`
      return { key, displayName, monthOrder }
    }
  }

  return { key: `${akunId}::${cleaned}`, displayName: cleaned, monthOrder: 99 }
}

export default function PembayaranTagihanClient({
  activeUnitId,
  activeTahunAkademikId,
  activeTahunAkademikName,
  akunKasBankList,
  user,
  pengaturan,
  unitInfo
}: {
  activeUnitId: string
  activeTahunAkademikId: string
  activeTahunAkademikName: string
  akunKasBankList: any[]
  user: any
  pengaturan?: any
  unitInfo?: any
}) {
  const isReadOnly = user.role === "KEPALA_SEKOLAH"

  // Tabs: 'search' (Loket Kasir) vs 'class' (Rombel / Kelas)
  const [activeTab, setActiveTab] = useState<"search" | "class">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [lastSearchedQuery, setLastSearchedQuery] = useState("")
  const [filterQuery, setFilterQuery] = useState("")

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
  const [rawMuridList, setRawMuridList] = useState<any[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("ALL")
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Record<string, Record<string, boolean>>>({})

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
      setKelasId("")
    })
    getJurusanByUnit(activeUnitId).then(res => {
      setJurusanList(res)
      setJurusanId("")
    })
  }, [activeUnitId])

  useEffect(() => {
    if (!kelasId) {
      setSubKelasList([])
      setSubKelasId("")
      return
    }
    
    getSubKelasByKelas(
      kelasId, 
      jurusanList.length > 0 && jurusanId ? jurusanId : undefined,
      activeTahunAkademikId || undefined
    ).then(res => {
      setSubKelasList(res)
      setSubKelasId("")
    })
  }, [kelasId, jurusanId, jurusanList.length, activeTahunAkademikId])

  // Extract available levels for pills filter in search mode (grouped by unique level name)
  const availableLevels = useMemo(() => {
    if (rawMuridList.length === 0) return []
    const levelMap = new Map<string, { id: string, name: string, count: number }>()
    rawMuridList.forEach(m => {
      const tingkat = m.riwayatKelas?.[0]?.subKelas?.tingkat
      if (tingkat?.name) {
        const existing = levelMap.get(tingkat.name)
        if (existing) {
          existing.count += 1
        } else {
          levelMap.set(tingkat.name, { id: tingkat.name, name: tingkat.name, count: 1 })
        }
      }
    })
    return Array.from(levelMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [rawMuridList])

  // Process data
  const processData = (
    muridList: any[], 
    order: string[], 
    levelFilter: string = "ALL",
    currentCheckboxes: Record<string, Record<string, boolean>> = selectedCheckboxes
  ) => {
    const effectiveMuridList = levelFilter === "ALL"
      ? muridList
      : muridList.filter(m => {
          const t = m.riwayatKelas?.[0]?.subKelas?.tingkat
          return t?.id === levelFilter || t?.name === levelFilter
        })

    const columnsMap = new Map<string, {id: string, namaTagihan: string, nama: string, kode: string, monthOrder: number}>()
    
    effectiveMuridList.forEach(murid => {
      murid.tagihan?.forEach((t: TagihanData) => {
        const norm = getNormalizedTagihanInfo(t.akunId, t.namaTagihan)
        if (!columnsMap.has(norm.key)) {
          columnsMap.set(norm.key, {
            id: norm.key,
            namaTagihan: norm.displayName,
            nama: norm.displayName, // UI Display
            kode: t.akun.kode,
            monthOrder: norm.monthOrder
          })
        }
      })
    })
    
    const columns = Array.from(columnsMap.values()).sort((a, b) => {
      if (a.kode !== b.kode) return a.kode.localeCompare(b.kode)
      if (a.monthOrder !== b.monthOrder) return a.monthOrder - b.monthOrder
      return a.nama.localeCompare(b.nama)
    })
    
    if (order && order.length > 0) {
      columns.sort((a, b) => {
        const idxA = order.indexOf(a.id)
        const idxB = order.indexOf(b.id)
        if (idxA === -1 && idxB === -1) {
          if (a.kode !== b.kode) return a.kode.localeCompare(b.kode)
          if (a.monthOrder !== b.monthOrder) return a.monthOrder - b.monthOrder
          return a.nama.localeCompare(b.nama)
        }
        if (idxA === -1) return 1
        if (idxB === -1) return -1
        return idxA - idxB
      })
    }
    
    setAkunColumns(columns)

    const rows: GridRow[] = effectiveMuridList.map(murid => {
      const hasOldDebts = (murid._count?.tagihan || 0) > 0
      const subKelas = murid.riwayatKelas?.[0]?.subKelas
      const subKelasName = subKelas?.name || ""
      const tingkatName = subKelas?.tingkat?.name || ""
      
      return {
        id: murid.id,
        name: murid.name,
        nisn: murid.nisn || "-",
        formNo: murid.formNo || "-",
        subKelasName,
        tingkatName,
        tagihanList: murid.tagihan || [],
        selectedItems: currentCheckboxes[murid.id] || {},
        hasOldDebts: hasOldDebts
      }
    })
    
    setGridData(rows)
    setCurrentPage(1)
  }

  const handleSelectLevelFilter = (lvlId: string) => {
    setSelectedLevelFilter(lvlId)
    processData(rawMuridList, columnOrder, lvlId, selectedCheckboxes)
  }

  const handleResetFilter = () => {
    setSearchQuery("")
    setLastSearchedQuery("")
    setFilterQuery("")
    setKelasId("")
    setJurusanId("")
    setSubKelasId("")
    setSubKelasList([])
    setGridData([])
    setRawMuridList([])
    setSelectedLevelFilter("ALL")
    setSelectedCheckboxes({})
    setCurrentPage(1)
  }

  const handleCariSiswa = async (overrideSearch?: string) => {
    const querySearch = typeof overrideSearch === "string" ? overrideSearch : searchQuery
    const q = querySearch.trim()
    if (!q) {
      toast.error("Ketik nama siswa, NISN, atau no formulir")
      return
    }
    if (!activeTahunAkademikId) {
      toast.error("Tahun Akademik aktif tidak ditemukan")
      return
    }
    setIsLoading(true)
    setLastSearchedQuery(q)
    try {
      const [res, order] = await Promise.all([
        getMuridWithTagihanUnpaid({
          unitSekolahId: activeUnitId,
          tahunAkademikId: activeTahunAkademikId,
          searchName: q
        }),
        getColumnOrder(activeUnitId)
      ])
      setRawMuridList(res)
      setColumnOrder(order)
      setSelectedLevelFilter("ALL")
      setSelectedCheckboxes({})
      processData(res, order, "ALL", {})
      if (res.length === 0) {
        toast("Tidak ada data murid yang ditemukan", { icon: "ℹ️" })
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mencari siswa")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTampilkanKelas = async () => {
    if (!subKelasId) {
      toast.error("Pilih Subkelas terlebih dahulu")
      return
    }
    if (!activeTahunAkademikId) {
      toast.error("Tahun Akademik aktif tidak ditemukan")
      return
    }
    setIsLoading(true)
    setLastSearchedQuery("")
    try {
      const [res, order] = await Promise.all([
        getMuridWithTagihanUnpaid({
          unitSekolahId: activeUnitId,
          tahunAkademikId: activeTahunAkademikId,
          kelasId: kelasId || undefined,
          subKelasId: subKelasId
        }),
        getColumnOrder(activeUnitId)
      ])
      setRawMuridList(res)
      setColumnOrder(order)
      setSelectedLevelFilter("ALL")
      setSelectedCheckboxes({})
      processData(res, order, "ALL", {})
      if (res.length === 0) {
        toast("Tidak ada data murid di rombel ini", { icon: "ℹ️" })
      }
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
    if (!filterQuery.trim()) return gridData
    const q = filterQuery.toLowerCase()
    return gridData.filter(row => 
      row.name.toLowerCase().includes(q) || 
      row.formNo.toLowerCase().includes(q) ||
      row.nisn.toLowerCase().includes(q)
    )
  }, [gridData, filterQuery])

  const computedTotalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])
  
  // reset page if filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length, pageSize])

  const handleCheckboxChange = (muridId: string, tagihanId: string, checked: boolean) => {
    setSelectedCheckboxes(prev => {
      const muridSelected = { ...(prev[muridId] || {}) }
      if (checked) {
        muridSelected[tagihanId] = true
      } else {
        delete muridSelected[tagihanId]
      }
      return {
        ...prev,
        [muridId]: muridSelected
      }
    })

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
          namaAkun: t.namaTagihan,
          kodeAkun: t.akun.kode,
          akunPendapatanId: t.akun.id,
          sisaTagihan: t.sisaTagihan,
          jumlahBayar: t.sisaTagihan, // Defaults to full payment
          potongan: 0,
          kategoriPotongan: "-"
        })
      }
    })

    // Jika belum ada checkbox yang dicentang manual di tabel,
    // otomatis ambil seluruh tagihan siswa yang belum lunas (sisaTagihan > 0)
    if (itemsToPay.length === 0) {
      const unpaidItems = row.tagihanList.filter(t => t.sisaTagihan > 0)
      if (unpaidItems.length === 0) {
        toast.error("Tidak ada tagihan yang belum lunas untuk siswa ini")
        return
      }
      unpaidItems.forEach(t => {
        itemsToPay.push({
          tagihanId: t.id,
          namaAkun: t.namaTagihan,
          kodeAkun: t.akun.kode,
          akunPendapatanId: t.akun.id,
          sisaTagihan: t.sisaTagihan,
          jumlahBayar: t.sisaTagihan,
          potongan: 0,
          kategoriPotongan: "-"
        })
      })
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
      
      setReceiptData({
        noReferensi: res.data?.noReferensi || payload.noReferensi || `INV-${new Date().getTime()}`,
        tanggal: payload.tanggal,
        muridName: payload.muridName,
        items: payload.items.map((it: any) => ({
          namaAkun: it.namaAkun,
          jumlahBayar: it.jumlahBayar,
          sisaTagihanAwal: it.sisaTagihan,
          potongan: it.potongan || 0,
          kategoriPotongan: it.kategoriPotongan,
          sisaTagihan: it.sisaTagihan - it.jumlahBayar - (it.potongan || 0)
        })),
        total: totalBayar
      })
      
      // Refresh current data
      if (activeTab === "search" && lastSearchedQuery) {
        handleCariSiswa(lastSearchedQuery)
      } else if (subKelasId) {
        handleTampilkanKelas()
      }
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
    <div className="w-full">
      <PageHeader 
        title="Pembayaran Tagihan Siswa"
        subtitle={`Proses pembayaran tagihan komponen biaya secara matriks per siswa • Tahun Ajaran ${activeTahunAkademikName}`}
      />

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
        <TabNavigation
          tabs={[
            { id: "search", label: "Cari Siswa Langsung (Loket Kasir)", icon: Search },
            { id: "class", label: "Filter Berdasarkan Rombel / Kelas", icon: Users }
          ]}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id as "search" | "class")
            setGridData([])
            setFilterQuery("")
            if (id === "search") {
              setKelasId("")
              setJurusanId("")
              setSubKelasId("")
              setSubKelasList([])
            } else {
              setSearchQuery("")
              setLastSearchedQuery("")
            }
          }}
        />

        {/* Tab 1: Loket Kasir Direct Search */}
        {activeTab === "search" && (
          <div className="mb-6">
            <Toolbar>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <ToolbarSearch 
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleCariSiswa()
                    }
                  }}
                  onClear={() => {
                    setSearchQuery("")
                    setLastSearchedQuery("")
                    setGridData([])
                  }}
                  placeholder="Ketik Nama Siswa, NISN, atau No Formulir lalu tekan Enter..." 
                  containerClassName="w-full sm:w-80"
                />

                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCariSiswa()}
                    disabled={!searchQuery.trim() || isLoading}
                    className="min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-bold justify-center"
                  >
                    {isLoading ? <Loader2 size={15} className="animate-spin mr-1.5" /> : <Search size={15} className="mr-1.5" />}
                    Cari Siswa
                  </Button>

                  {(gridData.length > 0 || lastSearchedQuery) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setLastSearchedQuery("")
                        setGridData([])
                      }}
                      disabled={isLoading}
                      title="Reset filter dan pencarian"
                      className="min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-semibold justify-center border-border text-text-muted hover:text-text-main"
                    >
                      <RotateCcw size={14} className="mr-1.5" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <ToolbarActions>
                {lastSearchedQuery && (
                  <ToolbarRefreshButton
                    onClick={() => handleCariSiswa(lastSearchedQuery)}
                    isLoading={isLoading}
                    title="Segarkan Hasil Pencarian"
                  />
                )}
              </ToolbarActions>
            </Toolbar>

            {lastSearchedQuery && (
              <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl mt-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span>
                    Menampilkan hasil pencarian untuk: <strong className="font-semibold">&quot;{lastSearchedQuery}&quot;</strong> ({rawMuridList.length} siswa ditemukan{availableLevels.length > 1 ? " lintas jenjang kelas" : ""})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setLastSearchedQuery("")
                      setGridData([])
                      setRawMuridList([])
                      setSelectedLevelFilter("ALL")
                      setSelectedCheckboxes({})
                    }}
                    className="underline hover:text-emerald-950 font-medium"
                  >
                    Bersihkan Pencarian
                  </button>
                </div>

                {availableLevels.length > 1 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/70 flex-wrap">
                    <span className="font-semibold text-emerald-900 text-xs">
                      Saring Jenjang:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectLevelFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedLevelFilter === "ALL"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      Semua Jenjang ({rawMuridList.length})
                    </button>
                    {availableLevels.map(lvl => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => handleSelectLevelFilter(lvl.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          selectedLevelFilter === lvl.id
                            ? "bg-emerald-700 text-white shadow-sm"
                            : "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                        }`}
                      >
                        {lvl.name} ({lvl.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Filter by Class */}
        {activeTab === "class" && (
          <Toolbar className="mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap gap-2.5 w-full sm:w-auto">
              {gridData.length > 0 && (
                <ToolbarSearch 
                  value={filterQuery}
                  onChange={(e: any) => setFilterQuery(e.target.value)}
                  onClear={() => setFilterQuery("")}
                  placeholder="Filter nama di rombel..." 
                />
              )}

              <div className="grid grid-cols-2 sm:flex gap-2.5 w-full sm:w-auto">
                <ToolbarFilter
                  icon={<Filter size={14} />}
                  value={kelasId}
                  onChange={(val) => {
                    setKelasId(val as string)
                    setSubKelasId("")
                  }}
                  options={[
                    { label: "Pilih Kelas...", value: "" },
                    ...kelasList.map(kelas => ({ label: kelas.name, value: kelas.id }))
                  ]}
                />

                {jurusanList.length > 0 && (
                  <ToolbarFilter
                    value={jurusanId}
                    onChange={(val) => {
                      setJurusanId(val as string)
                      setSubKelasId("")
                    }}
                    options={[
                      { label: "Semua Jurusan", value: "" },
                      ...jurusanList.map(jurusan => ({ label: jurusan.name, value: jurusan.id }))
                    ]}
                  />
                )}

                <ToolbarFilter
                  value={subKelasId}
                  onChange={(val) => setSubKelasId(val as string)}
                  disabled={!kelasId}
                  className={jurusanList.length > 0 ? "col-span-2 sm:col-span-1" : ""}
                  options={[
                    { label: kelasId ? "Pilih Subkelas..." : "Pilih Kelas Dulu", value: "" },
                    ...subKelasList.map(sk => ({ label: sk.name, value: sk.id }))
                  ]}
                />
              </div>

              <div className={`grid ${kelasId || subKelasId || gridData.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} sm:flex items-center gap-2 w-full sm:w-auto`}>
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={handleTampilkanKelas} 
                  disabled={!subKelasId || isLoading}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-bold justify-center"
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  Tampilkan
                </Button>

                {(kelasId || subKelasId || gridData.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilter}
                    disabled={isLoading}
                    title="Reset filter dan pencarian"
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] short:min-h-[34px] font-semibold justify-center border-border text-text-muted hover:text-text-main"
                  >
                    <RotateCcw size={14} className="mr-1.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            <ToolbarActions>
              {subKelasId && (
                <ToolbarRefreshButton 
                  onClick={handleTampilkanKelas} 
                  disabled={isLoading}
                  isLoading={isLoading}
                  title="Segarkan Data Rombel" 
                />
              )}
            </ToolbarActions>
          </Toolbar>
        )}

        {/* Table Container */}
        {gridData.length > 0 ? (
          <>
            <TableScrollHint totalRows={gridData.length} />
            <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold text-center w-12 md:sticky md:left-0 bg-bg md:z-20 md:shadow-[1px_0_0_0_#e2e8f0]">NO</th>
                  <th className="p-4 font-semibold min-w-[200px] md:sticky md:left-12 bg-bg md:z-20 md:shadow-[1px_0_0_0_#e2e8f0]">SISWA/I</th>
                  
                  {akunColumns.map(col => (
                    <th key={col.id} className="p-4 font-semibold text-center min-w-[150px]">
                      <div>
                        {col.nama} <br/><span className="text-[10px] opacity-80 font-medium">[{col.kode}]</span>
                      </div>
                    </th>
                  ))}
                  
                  <th className="p-4 font-semibold text-right min-w-[150px]">TOTAL BERJALAN</th>
                  {!isReadOnly && <th className="p-4 font-semibold text-center w-24 md:sticky md:right-0 bg-bg md:z-20 md:shadow-[-1px_0_0_0_#e2e8f0]">PROSES</th>}
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
                        <td className="p-4 text-center text-text-muted font-medium md:sticky md:left-0 bg-white md:z-10 md:shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-gray-50">
                          {((currentPage - 1) * pageSize) + idx + 1}.
                        </td>
                        <td className="p-4 md:sticky md:left-12 bg-white md:z-10 md:shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-gray-50">
                          <div>
                            <p className={`font-bold leading-tight truncate max-w-[200px] ${row.hasOldDebts ? 'text-red-500' : 'text-text-main'}`} title={row.name}>
                              {row.name}
                            </p>
                            {row.hasOldDebts && (
                              <p className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-red-100">
                                Ada Tunggakan di Tahun Sebelumnya
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {row.tingkatName && (
                              <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                                {row.tingkatName}
                              </span>
                            )}
                            {row.subKelasName && (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                {row.subKelasName}
                              </span>
                            )}
                            <p className="text-xs text-text-muted">{row.nisn} • {row.formNo}</p>
                          </div>
                        </td>
                        
                        {akunColumns.map(col => {
                          // Match using normalized key
                          const tagihan = row.tagihanList.find(t => getNormalizedTagihanInfo(t.akunId, t.namaTagihan).key === col.id)
                          
                          return (
                            <td key={col.id} className="p-4">
                              {tagihan ? (
                                tagihan.sisaTagihan <= 0 ? (
                                  <button 
                                    onClick={() => handlePrintTagihan(tagihan.id)}
                                    disabled={isLoadingRiwayat === tagihan.id}
                                    className="flex w-[140px] mx-auto items-center justify-center p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:shadow-sm group/btn"
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
                                  <div className="relative flex items-center justify-center w-max mx-auto">
                                    <div className={`
                                      flex items-center justify-center p-2 rounded-lg border select-none transition-all w-[140px]
                                      ${row.selectedItems[tagihan.id] 
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                        : 'border-border bg-white hover:bg-gray-50 text-text-main'}
                                    `}>
                                      <label className="flex items-center justify-center gap-2 cursor-pointer w-full">
                                        <input 
                                          type="checkbox"
                                          disabled={isReadOnly}
                                          className={`w-4 h-4 text-emerald-500 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          checked={row.selectedItems[tagihan.id] || false}
                                          onChange={(e) => handleCheckboxChange(row.id, tagihan.id, e.target.checked)}
                                        />
                                        <span className="text-sm font-bold">
                                          Rp {formatRupiah(tagihan.sisaTagihan)}
                                        </span>
                                      </label>
                                    </div>
                                    
                                    {tagihan.sisaTagihan < tagihan.jumlah && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          handlePrintTagihan(tagihan.id)
                                        }}
                                        disabled={isLoadingRiwayat === tagihan.id}
                                        className="absolute -right-7 text-text-muted hover:text-emerald-600 transition-colors p-1 rounded-full hover:bg-emerald-100/50 group/icon flex items-center justify-center"
                                      >
                                        {isLoadingRiwayat === tagihan.id ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <History size={14} />
                                        )}
                                        {/* Tooltip */}
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none z-[100]">
                                          Lihat Riwayat
                                        </span>
                                      </button>
                                    )}
                                  </div>
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
                            Rp {formatRupiah(totalBerjalan > 0 ? totalBerjalan : totalTagihanSiswa)}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5 font-medium">
                            {totalBerjalan > 0 ? (
                              <span>Dipilih • Total: Rp {formatRupiah(totalTagihanSiswa)}</span>
                            ) : (
                              <span>Sisa Tagihan Belum Lunas</span>
                            )}
                          </div>
                        </td>
                        {!isReadOnly && (
                          <td className="p-4 text-center md:sticky md:right-0 bg-white md:z-10 md:shadow-[-1px_0_0_0_#e2e8f0] group-hover:bg-gray-50">
                            <Button 
                              size="sm"
                              variant={totalBerjalan > 0 ? "primary" : "outline"}
                              disabled={totalTagihanSiswa === 0}
                              onClick={() => handleBayarClick(row)}
                              className={totalBerjalan > 0 ? "font-bold" : "border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold"}
                              title={totalBerjalan > 0 ? `Bayar ${formatRupiah(totalBerjalan)} yang dicentang` : `Bayar tagihan siswa (Total Rp ${formatRupiah(totalTagihanSiswa)})`}
                            >
                              {totalBerjalan > 0 ? "Bayar" : "Bayar Langsung"}
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
                    <td colSpan={2} className="p-4 text-right text-text-main md:sticky md:left-0 bg-gray-50 md:z-10 md:shadow-[1px_0_0_0_#e2e8f0]">
                      TOTAL SISA TAGIHAN
                    </td>
                    {akunColumns.map(col => {
                      const colTotal = filteredData.reduce((acc, row) => {
                        const t = row.tagihanList.find(tag => getNormalizedTagihanInfo(tag.akunId, tag.namaTagihan).key === col.id)
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
                    <td className="p-4 md:sticky md:right-0 bg-gray-50 md:z-20 md:shadow-[-1px_0_0_0_#e2e8f0]"></td>
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
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <span className="font-medium text-text-muted">
                  Hal {currentPage} dari {computedTotalPages}
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(computedTotalPages, p + 1))}
                  disabled={currentPage === computedTotalPages || computedTotalPages === 0}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
          </>
        ) : (
          !isLoading && (
            activeTab === "search" ? (
              lastSearchedQuery ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
                  <Search className="mb-4 text-text-muted/40" size={44} strokeWidth={1.5} />
                  <h3 className="text-base font-bold text-text-main mb-1">Siswa Tidak Ditemukan</h3>
                  <p className="max-w-md text-sm text-text-muted">
                    Tidak ditemukan siswa dengan kata kunci &quot;{lastSearchedQuery}&quot; pada tahun ajaran ini. Pastikan ejaan nama, NISN, atau no formulir sudah benar.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600 border border-emerald-100 shadow-sm">
                    <Search size={28} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-text-main mb-1">Mode Loket Kasir: Cari Siswa Langsung</h3>
                  <p className="max-w-md text-sm text-text-muted">
                    Ketik <strong>Nama Siswa</strong>, <strong>NISN</strong>, atau <strong>No Formulir</strong> pada kolom pencarian di atas lalu tekan <strong>Enter</strong> untuk memeriksa tagihan dan memproses pembayaran tanpa perlu memilih rombel.
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-400 border border-gray-100 shadow-sm">
                  <Filter size={28} strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-bold text-text-main mb-1">Pilih Rombel / Kelas</h3>
                <p className="max-w-md text-sm text-text-muted">
                  Silakan pilih <strong>Kelas</strong> dan <strong>Subkelas</strong> pada filter di atas, lalu klik <strong>Tampilkan</strong> untuk memuat daftar tagihan seluruh siswa di rombel tersebut.
                </p>
              </div>
            )
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
        pengaturan={pengaturan}
        unitInfo={unitInfo}
        currentUser={user}
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
