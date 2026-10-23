"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  UserPlus, Search, Plus, Printer, FileText, CheckCircle2, 
  XCircle, Clock, Building2, Phone, Calendar, ArrowRight, Ban, Eye
} from "lucide-react"
import toast from "react-hot-toast"
import { beliFormulirPSB, batalPendaftarPSB } from "@/actions/psb"

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

export default function PendaftaranClient({
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
  const [activeTab, setActiveTab] = useState<"daftar" | "loket">("daftar")
  const [items, setItems] = useState<any[]>(initialPendaftarData.items)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("ALL")
  const [filterUnit, setFilterUnit] = useState(isGlobal ? "ALL" : (userUnitId || "ALL"))
  const [filterGelombang, setFilterGelombang] = useState("ALL")

  // State Loket Form
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unitId, setUnitId] = useState(userUnitId || (units[0]?.id || ""))
  const [tahunId, setTahunId] = useState(tahunAktif?.id || (tahunList[0]?.id || ""))
  
  // Ambil gelombang aktif untuk unit yang dipilih
  const availableGelombang = gelombangList.filter(g => 
    g.unitSekolahId === unitId && g.isActive
  )
  const [gelombangId, setGelombangId] = useState(availableGelombang[0]?.id || "")

  const selectedGelombangObj = gelombangList.find(g => g.id === gelombangId)
  const defaultBiayaFormulir = selectedGelombangObj?.biayaFormulir || 250000

  const [nomorFormulir, setNomorFormulir] = useState("")
  const [namaCalon, setNamaCalon] = useState("")
  const [jenisKelamin, setJenisKelamin] = useState("LAKI_LAKI")
  const [nisn, setNisn] = useState("")
  const [asalSekolah, setAsalSekolah] = useState("")
  const [namaOrangTua, setNamaOrangTua] = useState("")
  const [noWhatsapp, setNoWhatsapp] = useState("")
  const [alamat, setAlamat] = useState("")
  const [akunKasId, setAkunKasId] = useState(initialAkunKasList[0]?.id || "")
  const [tanggalBeli, setTanggalBeli] = useState(new Date().toISOString().split("T")[0])
  const [biayaFormulirInput, setBiayaFormulirInput] = useState<number>(defaultBiayaFormulir)

  // State Modal Kuitansi
  const [receiptData, setReceiptData] = useState<any | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // Filter Data di Tabel
  const filteredItems = items.filter(item => {
    const matchSearch = 
      item.namaCalon.toLowerCase().includes(search.toLowerCase()) ||
      item.nomorFormulir.toLowerCase().includes(search.toLowerCase()) ||
      item.namaOrangTua.toLowerCase().includes(search.toLowerCase()) ||
      item.noWhatsapp.includes(search)
    const matchStatus = filterStatus === "ALL" || item.status === filterStatus
    const matchUnit = filterUnit === "ALL" || item.unitSekolahId === filterUnit
    const matchGelombang = filterGelombang === "ALL" || item.gelombangId === filterGelombang
    return matchSearch && matchStatus && matchUnit && matchGelombang
  })

  // Submit Penjualan Formulir
  const handleSubmitFormulir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nomorFormulir.trim()) {
      toast.error("Nomor fisik formulir wajib diisi!")
      return
    }
    if (!gelombangId) {
      toast.error("Pilih gelombang pendaftaran yang aktif!")
      return
    }
    if (!akunKasId) {
      toast.error("Pilih akun Kas/Bank kasir penerima!")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await beliFormulirPSB({
        unitSekolahId: unitId,
        tahunAkademikId: tahunId,
        gelombangId,
        nomorFormulir: nomorFormulir.trim(),
        namaCalon: namaCalon.trim(),
        jenisKelamin,
        nisn: nisn.trim() || undefined,
        asalSekolah: asalSekolah.trim() || undefined,
        namaOrangTua: namaOrangTua.trim(),
        noWhatsapp: noWhatsapp.trim(),
        alamat: alamat.trim() || undefined,
        akunKasId,
        tanggal: tanggalBeli,
        biayaFormulir: Number(biayaFormulirInput)
      })

      toast.success("Formulir berhasil diterbitkan & Kas Masuk tercatat!")
      
      // Tampilkan kuitansi
      setReceiptData({
        nomorFormulir: res.pendaftar.nomorFormulir,
        namaCalon: res.pendaftar.namaCalon,
        namaOrangTua: res.pendaftar.namaOrangTua,
        noWhatsapp: res.pendaftar.noWhatsapp,
        noReferensi: res.transaksi.noReferensi,
        tanggal: res.transaksi.tanggal,
        totalNilai: res.transaksi.totalNilai,
        unitSekolahName: units.find(u => u.id === unitId)?.name || "Al-Basyariah",
        namaGelombang: selectedGelombangObj?.namaGelombang || "PSB"
      })
      setShowReceipt(true)

      // Reset form
      setNomorFormulir("")
      setNamaCalon("")
      setNisn("")
      setAsalSekolah("")
      setNamaOrangTua("")
      setNoWhatsapp("")
      setAlamat("")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menerbitkan formulir")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatal = async (id: string, nama: string) => {
    const alasan = prompt(`Batalkan formulir untuk calon "${nama}"? Uang formulir hangus. Masukkan alasan pembatalan:`)
    if (alasan === null) return

    try {
      await batalPendaftarPSB(id, alasan)
      toast.success("Status pendaftar diubah menjadi BATAL.")
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: "BATAL" } : item))
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan pendaftar")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FORMULIR_DIBELI":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={12} /> Formulir Dibeli</span>
      case "BERKAS_KEMBALI":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><FileText size={12} /> Berkas Kembali</span>
      case "SISWA_AKTIF":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Siswa Aktif</span>
      case "BATAL":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={12} /> Batal</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>
    }
  }

  return (
    <div className="w-full">
      {/* 1. Header Halaman */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          Loket & Pendaftaran Formulir PSB
        </h1>
        <p className="text-text-muted text-sm">
          Pencatatan penjualan formulir fisik, penerimaan kas kasir TU, dan pendataan calon peserta didik baru.
        </p>
      </div>

      {/* 2. Main Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Tab Header Wajib Siraya */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button 
            onClick={() => setActiveTab("daftar")}
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "daftar" 
                ? "border-primary text-primary" 
                : "border-transparent text-text-muted hover:text-text-main"
            }`}
          >
            <FileText size={16} />
            Daftar Pembeli Formulir ({filteredItems.length})
          </button>
          {userRole !== "KEPALA_SEKOLAH" && (
            <button 
              onClick={() => setActiveTab("loket")}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "loket" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              <UserPlus size={16} />
              + Loket Penjualan Formulir
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DAFTAR PEMBELI FORMULIR */}
        {/* ========================================================= */}
        {activeTab === "daftar" && (
          <div>
            {/* Toolbar Filter */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-6">
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Cari No. Formulir, Nama Calon, atau No. WA..."
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
                  <option value="FORMULIR_DIBELI">Formulir Dibeli</option>
                  <option value="BERKAS_KEMBALI">Berkas Kembali</option>
                  <option value="SISWA_AKTIF">Siswa Aktif</option>
                  <option value="BATAL">Batal</option>
                </select>
              </div>

              {userRole !== "KEPALA_SEKOLAH" && (
                <button
                  onClick={() => setActiveTab("loket")}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Plus size={16} />
                  Input Pembeli Baru
                </button>
              )}
            </div>

            {/* Tabel Pendaftar */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">No. Formulir</th>
                    <th className="py-3 px-4">Nama Calon Murid</th>
                    <th className="py-3 px-4">Orang Tua / Kontak</th>
                    <th className="py-3 px-4">Unit & Gelombang</th>
                    <th className="py-3 px-4">Transaksi Kas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-text-muted">
                          <UserPlus size={40} className="text-gray-300 mb-3" />
                          <p className="font-medium text-sm">Belum ada data pendaftar...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                            {item.nomorFormulir}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-text-main">{item.namaCalon}</div>
                          <div className="text-xs text-text-muted">
                            {item.jenisKelamin === "LAKI_LAKI" ? "Laki-laki" : (item.jenisKelamin === "PEREMPUAN" ? "Perempuan" : "-")}
                            {item.asalSekolah ? ` • Asal: ${item.asalSekolah}` : ""}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-text-main">{item.namaOrangTua}</div>
                          <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                            <Phone size={12} /> {item.noWhatsapp}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-text-main">{item.unitSekolah.name}</div>
                          <div className="text-xs text-emerald-600 font-medium">{item.gelombang.namaGelombang}</div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {item.transaksiFormulir ? (
                            <div>
                              <div className="font-mono text-text-main font-semibold">{item.transaksiFormulir.noReferensi}</div>
                              <div className="text-emerald-700 font-medium">Rp {item.transaksiFormulir.totalNilai.toLocaleString("id-ID")} (Lunas)</div>
                            </div>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.transaksiFormulir && (
                              <button
                                onClick={() => {
                                  setReceiptData({
                                    nomorFormulir: item.nomorFormulir,
                                    namaCalon: item.namaCalon,
                                    namaOrangTua: item.namaOrangTua,
                                    noWhatsapp: item.noWhatsapp,
                                    noReferensi: item.transaksiFormulir.noReferensi,
                                    tanggal: item.transaksiFormulir.tanggal,
                                    totalNilai: item.transaksiFormulir.totalNilai,
                                    unitSekolahName: item.unitSekolah.name,
                                    namaGelombang: item.gelombang.namaGelombang
                                  })
                                  setShowReceipt(true)
                                }}
                                title="Cetak Kuitansi Pembelian Formulir"
                                className="p-1.5 rounded-lg border border-border text-text-main hover:bg-bg transition-colors cursor-pointer"
                              >
                                <Printer size={14} />
                              </button>
                            )}

                            {item.status === "FORMULIR_DIBELI" && userRole !== "KEPALA_SEKOLAH" && (
                              <button
                                onClick={() => handleBatal(item.id, item.namaCalon)}
                                title="Batalkan Formulir (Uang Hangus)"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LOKET PENJUALAN FORMULIR BARU */}
        {/* ========================================================= */}
        {activeTab === "loket" && (
          <form onSubmit={handleSubmitFormulir} className="max-w-3xl space-y-6">
            <div className="bg-bg/40 p-4 rounded-xl border border-border">
              <h3 className="font-extrabold text-sm text-text-main uppercase tracking-wider mb-4">
                1. Data Gelombang & Formulir Fisik
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Unit Sekolah</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    disabled={!isGlobal && !!userUnitId}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Pilihan Gelombang</label>
                  <select
                    value={gelombangId}
                    onChange={(e) => {
                      setGelombangId(e.target.value)
                      const g = gelombangList.find(item => item.id === e.target.value)
                      if (g) setBiayaFormulirInput(g.biayaFormulir)
                    }}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {availableGelombang.length === 0 ? (
                      <option value="">Tidak ada gelombang aktif</option>
                    ) : (
                      availableGelombang.map(g => (
                        <option key={g.id} value={g.id}>{g.namaGelombang}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                    No. Formulir Fisik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SD-26-001"
                    value={nomorFormulir}
                    onChange={(e) => setNomorFormulir(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-bg/40 p-4 rounded-xl border border-border">
              <h3 className="font-extrabold text-sm text-text-main uppercase tracking-wider mb-4">
                2. Identitas Calon Murid
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                    Nama Lengkap Calon Murid <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama calon murid sesuai akta/KK"
                    value={namaCalon}
                    onChange={(e) => setNamaCalon(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Jenis Kelamin</label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">NISN (Opsional)</label>
                  <input
                    type="text"
                    placeholder="NISN sebelumnya jika ada"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Asal Sekolah (TK / SMP)</label>
                  <input
                    type="text"
                    placeholder="Contoh: TK Al-Basyariah / SDN 01 Pabuaran"
                    value={asalSekolah}
                    onChange={(e) => setAsalSekolah(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-bg/40 p-4 rounded-xl border border-border">
              <h3 className="font-extrabold text-sm text-text-main uppercase tracking-wider mb-4">
                3. Kontak Orang Tua / Wali
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                    Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama orang tua/wali pembeli formulir"
                    value={namaOrangTua}
                    onChange={(e) => setNamaOrangTua(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 08123456789"
                    value={noWhatsapp}
                    onChange={(e) => setNoWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Alamat Domisili</label>
                  <input
                    type="text"
                    placeholder="Alamat singkat calon murid"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-bg/40 p-4 rounded-xl border border-border">
              <h3 className="font-extrabold text-sm text-text-main uppercase tracking-wider mb-4">
                4. Pembayaran Kas Masuk Formulir
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Akun Kas Penerima</label>
                  <select
                    value={akunKasId}
                    onChange={(e) => setAkunKasId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {initialAkunKasList.map(a => (
                      <option key={a.id} value={a.id}>{a.kode} - {a.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={tanggalBeli}
                    onChange={(e) => setTanggalBeli(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Biaya Formulir (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={biayaFormulirInput}
                    onChange={(e) => setBiayaFormulirInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab("daftar")}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-muted hover:bg-bg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || availableGelombang.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <Printer size={16} />
                {isSubmitting ? "Menerbitkan..." : "Terbitkan Formulir & Cetak Kuitansi"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal Kuitansi Pembelian Formulir */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Kuitansi */}
            <div className="p-6 bg-primary text-white text-center relative">
              <button
                onClick={() => setShowReceipt(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-lg text-lg"
              >
                ✕
              </button>
              <div className="font-extrabold text-xl tracking-tight">YAYASAN AL-BASYARIAH</div>
              <div className="text-xs text-white/80 uppercase tracking-wider mt-0.5">{receiptData.unitSekolahName}</div>
              <div className="mt-4 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                TANDA TERIMA FORMULIR PSB
              </div>
            </div>

            {/* Isi Kuitansi */}
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2 text-xs">
                <span className="text-text-muted">No. Referensi:</span>
                <span className="font-mono font-bold text-text-main">{receiptData.noReferensi}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 text-xs">
                <span className="text-text-muted">Tanggal:</span>
                <span className="text-text-main font-medium">
                  {new Date(receiptData.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Nomor Formulir:</span>
                <span className="font-mono font-extrabold text-primary text-base">{receiptData.nomorFormulir}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Nama Calon:</span>
                <span className="font-bold text-text-main">{receiptData.namaCalon}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Orang Tua / Wali:</span>
                <span className="text-text-main font-medium">{receiptData.namaOrangTua}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Gelombang:</span>
                <span className="text-emerald-600 font-semibold">{receiptData.namaGelombang}</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-emerald-800">
                <span className="font-semibold text-xs uppercase">Total Pembayaran:</span>
                <span className="font-extrabold text-lg">Rp {receiptData.totalNilai.toLocaleString("id-ID")}</span>
              </div>

              <p className="text-[11px] text-text-muted italic text-center">
                * Simpan tanda terima ini saat mengembalikan berkas pendaftaran ke loket Tata Usaha.
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="p-4 bg-bg/50 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-muted hover:bg-bg transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover shadow-xs transition-all"
              >
                <Printer size={15} /> Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
