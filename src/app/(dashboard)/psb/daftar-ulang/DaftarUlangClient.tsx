"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ClipboardCheck, Search, CheckCircle2, Clock, 
  ArrowRight, UserCheck, ShieldCheck, FileText, 
  ChevronLeft, ChevronRight, X, Building2, Phone, 
  CreditCard, Sparkles, AlertCircle
} from "lucide-react"
import toast from "react-hot-toast"
import { 
  verifikasiBerkasPSB, 
  prosesAktivasiMuridDanBayarPSB 
} from "@/actions/psb"

interface Props {
  initialPendaftarData: {
    items: any[]
    pagination: { page: number, limit: number, total: number, totalPages: number }
  }
  gelombangList: any[]
  units: any[]
  tahunList: any[]
  tahunAktif: any
  initialAkunKasList: any[]
  userRole: string
  userUnitId: string | null
  isGlobal: boolean
}

export default function DaftarUlangClient({
  initialPendaftarData,
  gelombangList,
  units,
  tahunList,
  tahunAktif,
  initialAkunKasList,
  userRole,
  userUnitId,
  isGlobal
}: Props) {
  const router = useRouter()
  const [items, setItems] = useState<any[]>(initialPendaftarData.items)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterUnit, setFilterUnit] = useState(isGlobal ? "ALL" : (userUnitId || "ALL"))

  // Side Drawer State
  const [selectedPendaftar, setSelectedPendaftar] = useState<any | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Drawer Form State
  const [diskonKustom, setDiskonKustom] = useState<number>(0)
  const [keteranganDiskon, setKeteranganDiskon] = useState("")
  const [jumlahBayar, setJumlahBayar] = useState<number>(0)
  const [akunKasId, setAkunKasId] = useState(initialAkunKasList[0]?.id || "")
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0])

  // Checklist Berkas Fisik
  const [berkasKK, setBerkasKK] = useState(true)
  const [berkasAkta, setBerkasAkta] = useState(true)
  const [berkasIjazah, setBerkasIjazah] = useState(true)
  const [berkasFoto, setBerkasFoto] = useState(true)

  // Filter List
  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.namaCalon.toLowerCase().includes(search.toLowerCase()) ||
      item.nomorFormulir.toLowerCase().includes(search.toLowerCase()) ||
      item.namaOrangTua.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "ALL" || item.status === filterStatus
    const matchUnit = filterUnit === "ALL" || item.unitSekolahId === filterUnit
    return matchSearch && matchStatus && matchUnit
  })

  // Open Drawer Detail
  const handleOpenDrawer = (item: any) => {
    setSelectedPendaftar(item)
    setDiskonKustom(item.diskonKustom || 0)
    setKeteranganDiskon(item.keteranganDiskon || "")
    
    // Hitung default pembayaran: bisa lunas atau cicilan 1
    const biayaKotor = item.gelombang?.biayaUangPangkal || 0
    const diskonGel = item.gelombang?.diskonUangPangkal || 0
    const tagihanBersih = Math.max(0, biayaKotor - diskonGel - (item.diskonKustom || 0))
    setJumlahBayar(tagihanBersih) // Default set ke lunas
    setShowDrawer(true)
  }

  // Linear Navigasi (Sebelumnya / Berikutnya) di Header Drawer
  const currentIndex = selectedPendaftar ? filteredItems.findIndex(i => i.id === selectedPendaftar.id) : -1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < filteredItems.length - 1

  const handlePrev = () => {
    if (hasPrev) handleOpenDrawer(filteredItems[currentIndex - 1])
  }

  const handleNext = () => {
    if (hasNext) handleOpenDrawer(filteredItems[currentIndex + 1])
  }

  // Aksi 1: Verifikasi Berkas Fisik
  const handleVerifikasiBerkas = async () => {
    if (!selectedPendaftar) return
    try {
      setIsProcessing(true)
      await verifikasiBerkasPSB(selectedPendaftar.id, {
        diskonKustom: Number(diskonKustom),
        keteranganDiskon: keteranganDiskon.trim() || undefined
      })
      toast.success("Berkas fisik berhasil diverifikasi!")
      setItems(prev => prev.map(item => item.id === selectedPendaftar.id ? {
        ...item,
        status: "BERKAS_KEMBALI",
        diskonKustom: Number(diskonKustom),
        keteranganDiskon: keteranganDiskon.trim()
      } : item))
      setSelectedPendaftar((prev: any) => ({
        ...prev,
        status: "BERKAS_KEMBALI",
        diskonKustom: Number(diskonKustom),
        keteranganDiskon: keteranganDiskon.trim()
      }))
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal verifikasi berkas")
    } finally {
      setIsProcessing(false)
    }
  }

  // Aksi 2: Proses Aktivasi ke Murid Akademik & Pembayaran Tagihan
  const handleAktivasiDanBayar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPendaftar) return

    if (jumlahBayar > 0 && !akunKasId) {
      toast.error("Pilih akun Kas/Bank penerima pembayaran!")
      return
    }

    try {
      setIsProcessing(true)
      const res = await prosesAktivasiMuridDanBayarPSB({
        pendaftarId: selectedPendaftar.id,
        jumlahBayar: Number(jumlahBayar),
        akunKasId,
        tanggalBayar,
        diskonKustom: Number(diskonKustom),
        keteranganDiskon: keteranganDiskon.trim() || undefined
      })

      toast.success("Calon siswa berhasil diaktifkan menjadi Murid resmi & tagihan diterbitkan!")
      setShowDrawer(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal mengaktifkan murid")
    } finally {
      setIsProcessing(false)
    }
  }

  // Perhitungan Biaya Real-time
  const biayaKotor = selectedPendaftar?.gelombang?.biayaUangPangkal || 0
  const diskonGelombang = selectedPendaftar?.gelombang?.diskonUangPangkal || 0
  const tagihanBersih = Math.max(0, biayaKotor - diskonGelombang - (Number(diskonKustom) || 0))
  const sisaTunggakan = Math.max(0, tagihanBersih - (Number(jumlahBayar) || 0))

  return (
    <div className="w-full">
      {/* 1. Header Halaman */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          Daftar Ulang & Tagihan PSB
        </h1>
        <p className="text-text-muted text-sm">
          Verifikasi kelengkapan berkas fisik, perhitungan diskon gelombang, dan migrasi calon siswa ke database akademik resmi.
        </p>
      </div>

      {/* 2. Main Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Tab Header Wajib Siraya */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary flex items-center gap-2">
            <ClipboardCheck size={16} />
            Daftar Ulang Calon Murid ({filteredItems.length})
          </button>
        </div>

        {/* Toolbar Interaksi */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-6">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Cari No. Formulir, Nama Calon Murid, atau Orang Tua..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
              />
            </div>

            {isGlobal && (
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Semua Unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="ALL">Semua Status</option>
              <option value="FORMULIR_DIBELI">Menunggu Berkas</option>
              <option value="BERKAS_KEMBALI">Berkas Terverifikasi</option>
              <option value="SISWA_AKTIF">Sudah Jadi Siswa Aktif</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Pendaftar */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="py-3 px-4">No. Formulir</th>
                <th className="py-3 px-4">Nama Calon Murid</th>
                <th className="py-3 px-4">Unit & Gelombang</th>
                <th className="py-3 px-4 text-right">Biaya Masuk</th>
                <th className="py-3 px-4 text-right">Potongan Diskon</th>
                <th className="py-3 px-4 text-center">Status Berkas</th>
                <th className="py-3 px-4 text-center">Status Siswa</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <ClipboardCheck size={40} className="text-gray-300 mb-3" />
                      <p className="font-medium text-sm">Belum ada data pendaftar...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const biayaKotorItem = item.gelombang?.biayaUangPangkal || 0
                  const totalDiskon = (item.gelombang?.diskonUangPangkal || 0) + (item.diskonKustom || 0)
                  const tagihanBersihItem = Math.max(0, biayaKotorItem - totalDiskon)
                  const isMuridAktif = item.status === "SISWA_AKTIF"

                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs">
                          {item.nomorFormulir}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-text-main">{item.namaCalon}</div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {item.noWhatsapp} ({item.namaOrangTua})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-main">{item.unitSekolah.name}</div>
                        <div className="text-xs text-emerald-600 font-medium">{item.gelombang.namaGelombang}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-text-main">
                        Rp {tagihanBersihItem.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right text-xs">
                        {totalDiskon > 0 ? (
                          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            - Rp {totalDiskon.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === "FORMULIR_DIBELI" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={12} /> Belum Kembali
                          </span>
                        )}
                        {(item.status === "BERKAS_KEMBALI" || item.status === "SISWA_AKTIF") && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Lengkap
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isMuridAktif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <UserCheck size={12} /> Siswa Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Calon Siswa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isMuridAktif && item.murid ? (
                          <Link
                            href={`/murid/${item.murid.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-surface border border-border text-xs font-semibold text-primary rounded-lg hover:bg-bg transition-colors"
                          >
                            Lihat Profil 360°
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleOpenDrawer(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-xs transition-all cursor-pointer"
                          >
                            Daftar Ulang <ArrowRight size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIDE DRAWER: DETAIL DAFTAR ULANG & AKTIVASI MURID */}
      {/* ========================================================= */}
      {showDrawer && selectedPendaftar && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl h-full shadow-2xl border-l border-border flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header Drawer dengan Navigasi Linear (Prev/Next) */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-bg/50 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  title="Sebelumnya"
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  title="Berikutnya"
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="h-4 w-px bg-border mx-1" />
                <div>
                  <h3 className="font-extrabold text-base text-text-main leading-tight">
                    Daftar Ulang: {selectedPendaftar.namaCalon}
                  </h3>
                  <div className="text-xs text-text-muted">
                    No. Formulir: <span className="font-mono font-bold text-primary">{selectedPendaftar.nomorFormulir}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Drawer (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
              {/* 1. Ringkasan Identitas */}
              <div className="bg-bg/40 p-4 rounded-xl border border-border space-y-2">
                <div className="flex justify-between items-center text-xs text-text-muted uppercase font-semibold">
                  <span>Unit Sekolah: {selectedPendaftar.unitSekolah.name}</span>
                  <span className="text-emerald-700 font-bold">{selectedPendaftar.gelombang.namaGelombang}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-text-muted">Orang Tua / Wali:</span>
                    <div className="font-semibold text-text-main">{selectedPendaftar.namaOrangTua}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">No. WhatsApp:</span>
                    <div className="font-semibold text-text-main">{selectedPendaftar.noWhatsapp}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Asal Sekolah:</span>
                    <div className="font-semibold text-text-main">{selectedPendaftar.asalSekolah || "-"}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Status Saat Ini:</span>
                    <div className="font-semibold text-text-main">{selectedPendaftar.status}</div>
                  </div>
                </div>
              </div>

              {/* 2. Checklist Berkas Fisik */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <FileText size={14} /> Checklist Kelengkapan Berkas Fisik
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-bg/40 rounded-xl border border-border cursor-pointer hover:bg-bg">
                    <input type="checkbox" checked={berkasKK} onChange={e => setBerkasKK(e.target.checked)} className="rounded text-primary" />
                    <span>Kartu Keluarga (KK)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-bg/40 rounded-xl border border-border cursor-pointer hover:bg-bg">
                    <input type="checkbox" checked={berkasAkta} onChange={e => setBerkasAkta(e.target.checked)} className="rounded text-primary" />
                    <span>Akta Kelahiran</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-bg/40 rounded-xl border border-border cursor-pointer hover:bg-bg">
                    <input type="checkbox" checked={berkasIjazah} onChange={e => setBerkasIjazah(e.target.checked)} className="rounded text-primary" />
                    <span>Ijazah / SKL TK</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-bg/40 rounded-xl border border-border cursor-pointer hover:bg-bg">
                    <input type="checkbox" checked={berkasFoto} onChange={e => setBerkasFoto(e.target.checked)} className="rounded text-primary" />
                    <span>Pas Foto 3x4</span>
                  </label>
                </div>

                {selectedPendaftar.status === "FORMULIR_DIBELI" && (
                  <button
                    type="button"
                    onClick={handleVerifikasiBerkas}
                    disabled={isProcessing}
                    className="mt-3 w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Tandai Berkas Fisik Diterima Lengkap
                  </button>
                )}
              </div>

              {/* 3. Kalkulator Uang Pangkal & Diskon */}
              <div className="bg-bg/50 p-4 rounded-xl border border-border space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <CreditCard size={14} /> Kalkulator Biaya Uang Pangkal
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-text-main">
                    <span>Biaya Uang Pangkal Standar:</span>
                    <span className="font-semibold">Rp {biayaKotor.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Diskon Gelombang ({selectedPendaftar.gelombang.namaGelombang}):</span>
                    <span className="font-semibold">- Rp {diskonGelombang.toLocaleString("id-ID")}</span>
                  </div>

                  <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-text-muted mb-1">Diskon Tambahan Kustom (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        step="50000"
                        value={diskonKustom}
                        onChange={(e) => setDiskonKustom(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-text-muted mb-1">Keterangan Diskon</label>
                      <input
                        type="text"
                        placeholder="Contoh: Anak Guru / Saudara Kandung"
                        value={keteranganDiskon}
                        onChange={(e) => setKeteranganDiskon(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-extrabold text-text-main">
                    <span>Total Tagihan Bersih:</span>
                    <span className="text-primary text-base">Rp {tagihanBersih.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              {/* 4. Form Pembayaran Daftar Ulang & Aktivasi */}
              <form onSubmit={handleAktivasiDanBayar} className="space-y-4">
                <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles size={14} /> Pembayaran & Aktivasi Murid
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-emerald-900 mb-1">Jumlah Bayar Sekarang (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        max={tagihanBersih}
                        step="100000"
                        required
                        value={jumlahBayar}
                        onChange={(e) => setJumlahBayar(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-surface border border-emerald-300 rounded-xl text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="mt-1 text-[11px] text-text-muted flex justify-between">
                        <button type="button" onClick={() => setJumlahBayar(tagihanBersih)} className="text-primary hover:underline">
                          Set Lunas
                        </button>
                        <span>Sisa: Rp {sisaTunggakan.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-emerald-900 mb-1">Akun Kas Kasir</label>
                      <select
                        value={akunKasId}
                        onChange={(e) => setAkunKasId(e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-emerald-300 rounded-xl text-xs font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {initialAkunKasList.map(a => (
                          <option key={a.id} value={a.id}>{a.kode} - {a.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-800/80 bg-white/70 p-2.5 rounded-lg border border-emerald-200/50">
                    ℹ️ <strong>Otomatisasi Sistem:</strong> Setelah tombol ditekan, calon murid otomatis dimigrasikan ke database <strong>Murid</strong> akademik dan dimasukkan ke <strong>Kelas Sementara PSB</strong>. Tagihan uang pangkal otomatis diterbitkan di modul keuangan.
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck size={18} />
                    {isProcessing ? "Memproses Transisi Akademik..." : "Terbitkan Murid Resmi & Simpan Pembayaran"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
