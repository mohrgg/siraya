"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Layers, Plus, Search, Calendar, CheckCircle2, 
  XCircle, Edit2, Trash2, Power, AlertCircle, Building2
} from "lucide-react"
import toast from "react-hot-toast"
import { 
  simpanGelombangPSB, 
  toggleStatusGelombangPSB, 
  hapusGelombangPSB 
} from "@/actions/psb"

interface GelombangItem {
  id: string
  namaGelombang: string
  unitSekolahId: string
  tahunAkademikId: string
  tanggalMulai: Date | string
  tanggalSelesai: Date | string
  biayaFormulir: number
  biayaUangPangkal: number
  diskonUangPangkal: number
  kuota: number
  isActive: boolean
  unitSekolah: { id: string, name: string, level: string }
  tahunAkademik: { id: string, name: string }
  _count?: { pendaftar: number }
}

interface Props {
  initialGelombangList: any[]
  units: any[]
  tahunList: any[]
  tahunAktif: any
  userRole: string
  userUnitId: string | null
  isGlobal: boolean
}

export default function GelombangClient({
  initialGelombangList,
  units,
  tahunList,
  tahunAktif,
  userRole,
  userUnitId,
  isGlobal
}: Props) {
  const router = useRouter()
  const [gelombangList, setGelombangList] = useState<GelombangItem[]>(initialGelombangList)
  const [search, setSearch] = useState("")
  const [filterUnit, setFilterUnit] = useState(isGlobal ? "ALL" : (userUnitId || "ALL"))

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [formUnitId, setFormUnitId] = useState(userUnitId || (units[0]?.id || ""))
  const [formTahunId, setFormTahunId] = useState(tahunAktif?.id || (tahunList[0]?.id || ""))
  const [namaGelombang, setNamaGelombang] = useState("")
  const [tanggalMulai, setTanggalMulai] = useState("")
  const [tanggalSelesai, setTanggalSelesai] = useState("")
  const [biayaFormulir, setBiayaFormulir] = useState<number | "">("")
  const [biayaUangPangkal, setBiayaUangPangkal] = useState<number | "">("")
  const [diskonUangPangkal, setDiskonUangPangkal] = useState<number | "">("")
  const [kuota, setKuota] = useState<number | "">("")

  // Filter Data
  const filteredList = gelombangList.filter(g => {
    const matchSearch = g.namaGelombang.toLowerCase().includes(search.toLowerCase()) ||
      g.unitSekolah.name.toLowerCase().includes(search.toLowerCase())
    const matchUnit = filterUnit === "ALL" || g.unitSekolahId === filterUnit
    return matchSearch && matchUnit
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormUnitId(userUnitId || (units[0]?.id || ""))
    setFormTahunId(tahunAktif?.id || (tahunList[0]?.id || ""))
    setNamaGelombang("")
    setTanggalMulai("")
    setTanggalSelesai("")
    setBiayaFormulir("")
    setBiayaUangPangkal("")
    setDiskonUangPangkal("")
    setKuota("")
    setShowModal(true)
  }

  const handleOpenEdit = (item: GelombangItem) => {
    setEditingId(item.id)
    setFormUnitId(item.unitSekolahId)
    setFormTahunId(item.tahunAkademikId)
    setNamaGelombang(item.namaGelombang)
    setTanggalMulai(new Date(item.tanggalMulai).toISOString().split("T")[0])
    setTanggalSelesai(new Date(item.tanggalSelesai).toISOString().split("T")[0])
    setBiayaFormulir(item.biayaFormulir)
    setBiayaUangPangkal(item.biayaUangPangkal)
    setDiskonUangPangkal(item.diskonUangPangkal)
    setKuota(item.kuota)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaGelombang.trim()) {
      toast.error("Nama gelombang wajib diisi!")
      return
    }

    try {
      setIsSubmitting(true)
      await simpanGelombangPSB({
        id: editingId || undefined,
        unitSekolahId: formUnitId,
        tahunAkademikId: formTahunId,
        namaGelombang: namaGelombang.trim(),
        tanggalMulai,
        tanggalSelesai,
        biayaFormulir: Number(biayaFormulir),
        biayaUangPangkal: Number(biayaUangPangkal),
        diskonUangPangkal: Number(diskonUangPangkal),
        kuota: Number(kuota)
      })

      toast.success(editingId ? "Gelombang berhasil diperbarui!" : "Gelombang baru berhasil dibuat!")
      setShowModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan gelombang")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await toggleStatusGelombangPSB(id)
      toast.success(`Gelombang berhasil di${currentStatus ? "nonaktifkan" : "aktifkan"}!`)
      setGelombangList(prev => prev.map(g => g.id === id ? { ...g, isActive: !currentStatus } : g))
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status")
    }
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus gelombang "${nama}"?`)) return
    try {
      await hapusGelombangPSB(id)
      toast.success("Gelombang berhasil dihapus!")
      setGelombangList(prev => prev.filter(g => g.id !== id))
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus gelombang")
    }
  }

  return (
    <div className="w-full">
      {/* 1. Header Halaman */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
          Pengaturan Gelombang PSB
        </h1>
        <p className="text-text-muted text-sm">
          Kelola periode gelombang pendaftaran, kuota calon siswa, biaya formulir fisik, dan diskon uang pangkal per unit.
        </p>
      </div>

      {/* 2. Main Card */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Tab Header Wajib Siraya */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm transition-colors border-b-2 border-primary text-primary flex items-center gap-2">
            <Layers size={16} />
            Daftar Gelombang Pendaftaran
          </button>
        </div>

        {/* Toolbar Interaksi */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-6">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Cari nama gelombang atau unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
              />
            </div>

            {/* Filter Unit (Jika Global / Admin) */}
            {isGlobal && (
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Semua Unit Sekolah</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tombol Tambah Gelombang */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            Tambah Gelombang
          </button>
        </div>

        {/* 5. Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Unit & T.A</th>
                <th className="py-3 px-4">Nama Gelombang</th>
                <th className="py-3 px-4">Periode Aktif</th>
                <th className="py-3 px-4 text-right">Biaya Formulir</th>
                <th className="py-3 px-4 text-right">Uang Pangkal</th>
                <th className="py-3 px-4 text-right">Diskon Gelombang</th>
                <th className="py-3 px-4 text-center">Kuota / Terisi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <Layers size={40} className="text-gray-300 mb-3" />
                      <p className="font-medium text-sm">Belum ada data gelombang...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((g) => {
                  const pendaftarCount = g._count?.pendaftar || 0
                  return (
                    <tr key={g.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-main flex items-center gap-1.5">
                          <Building2 size={14} className="text-text-muted" />
                          {g.unitSekolah.name}
                        </div>
                        <div className="text-xs text-text-muted">T.A {g.tahunAkademik.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-text-main">{g.namaGelombang}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-text-muted">
                        <div className="flex items-center gap-1 text-text-main">
                          <Calendar size={13} className="text-text-muted" />
                          {new Date(g.tanggalMulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div>s.d. {new Date(g.tanggalSelesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-text-main">
                        Rp {g.biayaFormulir.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-text-main">
                        Rp {g.biayaUangPangkal.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {g.diskonUangPangkal > 0 ? (
                          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                            - Rp {g.diskonUangPangkal.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-text-main">{pendaftarCount}</span>
                        <span className="text-text-muted text-xs"> / {g.kuota > 0 ? g.kuota : "∞"}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {g.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Buka
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <XCircle size={12} /> Tutup
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggle(g.id, g.isActive)}
                            title={g.isActive ? "Nonaktifkan Gelombang" : "Aktifkan Gelombang"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              g.isActive 
                                ? "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100" 
                                : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(g)}
                            title="Edit Gelombang"
                            className="p-1.5 rounded-lg border border-border text-text-main hover:bg-bg transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(g.id, g.namaGelombang)}
                            title="Hapus Gelombang"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Gelombang */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-text-main">
                {editingId ? "Edit Gelombang PSB" : "Tambah Gelombang Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-main p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Unit Sekolah</label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    disabled={!isGlobal && !!userUnitId}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Tahun Akademik</label>
                  <select
                    value={formTahunId}
                    onChange={(e) => setFormTahunId(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {tahunList.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.isActive ? "(Aktif)" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Nama Gelombang</label>
                <input
                  type="text"
                  required
                  placeholder="Nama gelombang"
                  value={namaGelombang}
                  onChange={(e) => setNamaGelombang(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Harga Formulir</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={biayaFormulir}
                    onChange={(e) => setBiayaFormulir(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Uang Pangkal</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    value={biayaUangPangkal}
                    onChange={(e) => setBiayaUangPangkal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Diskon Gelombang</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={diskonUangPangkal}
                    onChange={(e) => setDiskonUangPangkal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1">Kuota Calon Siswa</label>
                <input
                  type="number"
                  min="0"
                  value={kuota}
                  onChange={(e) => setKuota(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-muted hover:bg-bg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Buat Gelombang")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
