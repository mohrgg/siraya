"use client"

import { useState, useRef } from "react"
import { Plus, Search, Edit2, Trash2, Printer, X, Zap, Receipt, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import {
  tambahJenisTagihan, editJenisTagihan, hapusJenisTagihan,
  generateTagihanBatch, getTagihanPerMurid, getTagihanUntukCetak
} from "@/actions/tagihan"

type JenisTagihanType = {
  id: string, name: string, amount: number, totalTagihan: number, totalLunas: number,
  totalNominal: number, totalTerbayar: number, totalTunggakan: number,
  tahunAkademikId: string, unitSekolahId: string,
}
type TagihanItemType = {
  id: string, muridId: string, muridName: string, nisn: string | null, kelasName: string,
  jenisTagihan: string, amount: number, terbayar: number, sisa: number,
  status: string, dueDate: Date | null, createdAt: Date,
}

export default function TagihanClient({
  initialJenisTagihan, initialDaftarTagihan, unitId, tahunId, tahunAkademik, kelasList
}: {
  initialJenisTagihan: JenisTagihanType[], initialDaftarTagihan: TagihanItemType[],
  unitId: string, tahunId: string, tahunAkademik: any[], kelasList: any[]
}) {
  const [activeTab, setActiveTab] = useState<"jenis" | "daftar">("jenis")
  const [jenisTagihan, setJenisTagihan] = useState(initialJenisTagihan)
  const [daftarTagihan, setDaftarTagihan] = useState(initialDaftarTagihan)

  // Jenis Tagihan modal
  const [showJenisModal, setShowJenisModal] = useState(false)
  const [formJenis, setFormJenis] = useState({ id: "", name: "", amount: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteJenisId, setDeleteJenisId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Generate batch modal
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateJenisId, setGenerateJenisId] = useState("")
  const [generateDueDate, setGenerateDueDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Daftar Tagihan filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterJenis, setFilterJenis] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterKelas, setFilterKelas] = useState("")
  const [isFiltering, setIsFiltering] = useState(false)

  // Cetak modal
  const [cetakData, setCetakData] = useState<any | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  // ========== JENIS TAGIHAN HANDLERS ==========
  const openAddJenis = () => {
    setFormJenis({ id: "", name: "", amount: "" })
    setShowJenisModal(true)
  }
  const openEditJenis = (j: JenisTagihanType) => {
    setFormJenis({ id: j.id, name: j.name, amount: String(j.amount) })
    setShowJenisModal(true)
  }
  const handleSubmitJenis = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formJenis.id) {
        const res = await editJenisTagihan(formJenis.id, { name: formJenis.name, amount: Number(formJenis.amount) })
        setJenisTagihan(jenisTagihan.map(j => j.id === formJenis.id ? { ...j, name: res.name, amount: res.amount } : j))
      } else {
        const res = await tambahJenisTagihan({ name: formJenis.name, amount: Number(formJenis.amount), tahunAkademikId: tahunId, unitSekolahId: unitId })
        setJenisTagihan([...jenisTagihan, { ...res, totalTagihan: 0, totalLunas: 0, totalNominal: 0, totalTerbayar: 0, totalTunggakan: 0, tahunAkademikId: tahunId, unitSekolahId: unitId }])
      }
      setShowJenisModal(false)
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }
  const handleDeleteJenis = async () => {
    if (!deleteJenisId) return
    setIsDeleting(true)
    try {
      await hapusJenisTagihan(deleteJenisId)
      setJenisTagihan(jenisTagihan.filter(j => j.id !== deleteJenisId))
      setDeleteJenisId(null)
    } catch (err: any) { alert(err.message) }
    finally { setIsDeleting(false) }
  }

  // ========== GENERATE BATCH HANDLERS ==========
  const openGenerateModal = (jenisId?: string) => {
    setGenerateJenisId(jenisId || "")
    setGenerateDueDate("")
    setShowGenerateModal(true)
  }
  const handleGenerate = async () => {
    if (!generateJenisId) return
    setIsGenerating(true)
    try {
      const result = await generateTagihanBatch(generateJenisId, generateDueDate ? new Date(generateDueDate) : undefined)
      alert(`Berhasil generate ${result.count} tagihan!`)
      setShowGenerateModal(false)
      // Refresh data
      const newDaftar = await getTagihanPerMurid(unitId, tahunId)
      setDaftarTagihan(newDaftar)
      // Refresh jenis for counts
      window.location.reload()
    } catch (err: any) { alert(err.message) }
    finally { setIsGenerating(false) }
  }

  // ========== FILTER HANDLERS ==========
  const handleApplyFilter = async () => {
    setIsFiltering(true)
    try {
      const result = await getTagihanPerMurid(unitId, tahunId, {
        jenisTagihanId: filterJenis || undefined,
        status: filterStatus || undefined,
        search: searchTerm || undefined,
        kelasId: filterKelas || undefined,
      })
      setDaftarTagihan(result)
    } catch (err: any) { alert(err.message) }
    finally { setIsFiltering(false) }
  }

  // ========== CETAK TAGIHAN ==========
  const handleCetak = async (muridId: string) => {
    try {
      const data = await getTagihanUntukCetak(muridId, tahunId)
      setCetakData(data)
      setTimeout(() => window.print(), 300)
    } catch (err: any) { alert(err.message) }
  }

  // Summary stats
  const totalNominal = daftarTagihan.reduce((sum, t) => sum + t.amount, 0)
  const totalTerbayar = daftarTagihan.reduce((sum, t) => sum + t.terbayar, 0)
  const totalTunggakan = totalNominal - totalTerbayar
  const totalLunas = daftarTagihan.filter(t => t.status === "PAID").length
  const totalBelum = daftarTagihan.filter(t => t.status === "UNPAID").length
  const totalSebagian = daftarTagihan.filter(t => t.status === "PARTIAL").length

  const statusBadge = (status: string) => {
    switch (status) {
      case "PAID": return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">LUNAS</span>
      case "PARTIAL": return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700">SEBAGIAN</span>
      case "UNPAID": return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600">BELUM BAYAR</span>
      default: return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500">{status}</span>
    }
  }

  return (
    <div>
      {/* Delete Confirm */}
      <ConfirmModal isOpen={!!deleteJenisId} title="Hapus Jenis Tagihan" message="Hapus jenis tagihan ini? Semua tagihan murid terkait akan ikut terhapus." onCancel={() => setDeleteJenisId(null)} onConfirm={handleDeleteJenis} isLoading={isDeleting} />

      {/* Cetak Modal */}
      {cetakData && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center print:hidden">
              <h3 className="text-xl font-bold text-text-main">Surat Tagihan Siswa</h3>
              <button onClick={() => setCetakData(null)} className="p-2 rounded-lg hover:bg-bg transition-colors"><X size={20} className="text-text-muted" /></button>
            </div>
            <div className="p-6 overflow-y-auto" ref={printRef}>
              <div className="print-content">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{cetakData.murid.unitSekolah}</h2>
                  <p className="text-sm text-text-muted">SURAT TAGIHAN PEMBAYARAN</p>
                  <hr className="my-3 border-text-main" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-text-muted">Nama Siswa</p>
                    <p className="font-bold text-text-main text-lg">{cetakData.murid.name}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">NISN</p>
                    <p className="font-bold text-text-main">{cetakData.murid.nisn || "-"}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Kelas</p>
                    <p className="font-bold text-text-main">{cetakData.murid.kelas}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Tanggal Cetak</p>
                    <p className="font-bold text-text-main">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <table className="w-full border-collapse text-sm mb-6">
                  <thead>
                    <tr className="border-y-2 border-text-main">
                      <th className="py-2 text-left">No</th>
                      <th className="py-2 text-left">Jenis Tagihan</th>
                      <th className="py-2 text-right">Nominal</th>
                      <th className="py-2 text-right">Terbayar</th>
                      <th className="py-2 text-right">Sisa</th>
                      <th className="py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cetakData.tagihan.map((t: any, i: number) => (
                      <tr key={t.id} className="border-b border-gray-200">
                        <td className="py-2">{i + 1}</td>
                        <td className="py-2">{t.jenisTagihan}</td>
                        <td className="py-2 text-right">{formatRp(t.amount)}</td>
                        <td className="py-2 text-right">{formatRp(t.terbayar)}</td>
                        <td className="py-2 text-right font-bold">{formatRp(t.sisa)}</td>
                        <td className="py-2 text-center">{t.status === "PAID" ? "Lunas" : t.status === "PARTIAL" ? "Sebagian" : "Belum"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-text-main font-bold">
                      <td colSpan={2} className="py-2">TOTAL</td>
                      <td className="py-2 text-right">{formatRp(cetakData.tagihan.reduce((s: number, t: any) => s + t.amount, 0))}</td>
                      <td className="py-2 text-right">{formatRp(cetakData.tagihan.reduce((s: number, t: any) => s + t.terbayar, 0))}</td>
                      <td className="py-2 text-right text-red-600">{formatRp(cetakData.tagihan.reduce((s: number, t: any) => s + t.sisa, 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                <div className="hidden print:grid grid-cols-2 gap-8 mt-8 text-center text-sm">
                  <div>
                    <p className="font-semibold mb-16">Orang Tua / Wali,</p>
                    <p className="border-t border-text-main pt-1">(............................)</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-16">Bendahara,</p>
                    <p className="border-t border-text-main pt-1">(............................)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3 justify-end print:hidden">
              <Button variant="outline" onClick={() => setCetakData(null)}>Tutup</Button>
              <Button onClick={() => window.print()}><Printer size={16} className="mr-2" /> Cetak</Button>
            </div>
          </div>
        </div>
      )}

      {/* Jenis Tagihan Modal */}
      {showJenisModal && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-main m-0">{formJenis.id ? "Edit" : "Tambah"} Jenis Tagihan</h3>
              <button onClick={() => setShowJenisModal(false)} className="p-2 rounded-lg hover:bg-bg transition-colors"><X size={18} className="text-text-muted" /></button>
            </div>
            <form onSubmit={handleSubmitJenis} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Nama Tagihan <span className="text-red-500">*</span></label>
                <Input placeholder="Cth: SPP Bulanan, Uang Gedung" value={formJenis.name} onChange={e => setFormJenis({ ...formJenis, name: e.target.value })} required autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Nominal Default (Rp) <span className="text-red-500">*</span></label>
                <Input type="number" min="0" placeholder="500000" value={formJenis.amount} onChange={e => setFormJenis({ ...formJenis, amount: e.target.value })} required />
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" variant="outline" onClick={() => setShowJenisModal(false)}>Batal</Button>
                <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-xl border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-text-main m-0">Generate Tagihan ke Semua Murid</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 rounded-lg hover:bg-bg transition-colors"><X size={18} className="text-text-muted" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Jenis Tagihan <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={generateJenisId} onChange={e => setGenerateJenisId(e.target.value)} required>
                  <option value="">-- Pilih Jenis Tagihan --</option>
                  {jenisTagihan.map(j => <option key={j.id} value={j.id}>{j.name} — {formatRp(j.amount)}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-main">Tanggal Jatuh Tempo (Opsional)</label>
                <Input type="date" value={generateDueDate} onChange={e => setGenerateDueDate(e.target.value)} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <p className="font-semibold mb-1">⚡ Perhatian</p>
                <p>Tagihan akan di-generate untuk semua murid aktif yang belum memiliki tagihan ini. Murid yang sudah punya tidak akan terduplikasi.</p>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>Batal</Button>
                <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!generateJenisId}>
                  <Zap size={16} className="mr-2" /> Generate Tagihan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">Total Tagihan</p>
          <p className="text-2xl font-bold text-blue-700">{formatRp(totalNominal)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700 font-medium mb-1">Terbayar</p>
          <p className="text-2xl font-bold text-emerald-700">{formatRp(totalTerbayar)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-medium mb-1">Tunggakan</p>
          <p className="text-2xl font-bold text-red-700">{formatRp(totalTunggakan)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-medium mb-1">Status Siswa</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg">{totalLunas} Lunas</span>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">{totalSebagian} Sebagian</span>
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-lg">{totalBelum} Belum</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-bg rounded-xl p-1.5">
        <button onClick={() => setActiveTab("jenis")} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "jenis" ? "bg-surface shadow-sm text-albas-green" : "text-text-muted hover:text-text-main"}`}>
          <Receipt size={16} className="inline mr-2" />Jenis Tagihan ({jenisTagihan.length})
        </button>
        <button onClick={() => setActiveTab("daftar")} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "daftar" ? "bg-surface shadow-sm text-albas-green" : "text-text-muted hover:text-text-main"}`}>
          <Filter size={16} className="inline mr-2" />Daftar Tagihan Siswa ({daftarTagihan.length})
        </button>
      </div>

      {/* ========== TAB 1: JENIS TAGIHAN ========== */}
      {activeTab === "jenis" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openGenerateModal()}>
                <Zap size={16} className="mr-2" /> Generate Batch
              </Button>
              <Button onClick={openAddJenis}>
                <Plus size={16} className="mr-2" /> Tambah Jenis
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jenisTagihan.map(j => (
              <div key={j.id} className="bg-surface rounded-2xl border border-border p-5 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-text-main text-lg">{j.name}</h3>
                    <p className="text-2xl font-extrabold text-albas-green mt-1">{formatRp(j.amount)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditJenis(j)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteJenisId(j.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex gap-4 text-sm mb-3">
                  <div>
                    <span className="text-text-muted">Total Siswa: </span>
                    <span className="font-bold text-text-main">{j.totalTagihan}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Lunas: </span>
                    <span className="font-bold text-emerald-600">{j.totalLunas}</span>
                  </div>
                </div>
                {j.totalTagihan > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1">
                      <span>Terbayar</span>
                      <span>{j.totalNominal > 0 ? Math.round(j.totalTerbayar / j.totalNominal * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-albas-green to-emerald-400 rounded-full transition-all"
                        style={{ width: `${j.totalNominal > 0 ? Math.min(100, j.totalTerbayar / j.totalNominal * 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-emerald-600 font-semibold">{formatRp(j.totalTerbayar)}</span>
                      <span className="text-red-500 font-semibold">Sisa: {formatRp(j.totalTunggakan)}</span>
                    </div>
                  </div>
                )}
                {j.totalTagihan === 0 && (
                  <button onClick={() => openGenerateModal(j.id)} className="w-full py-2 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors mt-2">
                    <Zap size={14} className="inline mr-1" /> Generate ke Semua Murid
                  </button>
                )}
              </div>
            ))}
            {jenisTagihan.length === 0 && (
              <div className="col-span-full p-12 text-center bg-surface rounded-2xl border border-border">
                <Receipt size={48} className="mx-auto text-text-muted/30 mb-4" />
                <p className="text-text-muted font-medium">Belum ada jenis tagihan.</p>
                <p className="text-sm text-text-muted mt-1">Buat jenis tagihan seperti SPP, Uang Gedung, Ujian, dll.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== TAB 2: DAFTAR TAGIHAN SISWA ========== */}
      {activeTab === "daftar" && (
        <div>
          {/* Filters */}
          <div className="bg-surface rounded-2xl border border-border p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative lg:col-span-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" placeholder="Cari nama / NISN..." className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-text-main" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
                <option value="">Semua Jenis</option>
                {jenisTagihan.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
              <select className="px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text-main font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Semua Status</option>
                <option value="UNPAID">Belum Bayar</option>
                <option value="PARTIAL">Sebagian</option>
                <option value="PAID">Lunas</option>
              </select>
              <Button onClick={handleApplyFilter} isLoading={isFiltering} className="text-sm">
                <Filter size={14} className="mr-1.5" /> Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[1000px]">
                <thead>
                  <tr className="border-b-2 border-border text-text-muted text-xs uppercase tracking-wider bg-gray-50/50">
                    <th className="p-4">Nama Murid</th>
                    <th className="p-4">NISN</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Jenis Tagihan</th>
                    <th className="p-4 text-right">Nominal</th>
                    <th className="p-4 text-right">Terbayar</th>
                    <th className="p-4 text-right">Sisa</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarTagihan.map(t => (
                    <tr key={t.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-text-main">{t.muridName}</td>
                      <td className="p-4 text-text-muted text-sm">{t.nisn || "-"}</td>
                      <td className="p-4 text-text-main text-sm">{t.kelasName}</td>
                      <td className="p-4 text-text-main text-sm">{t.jenisTagihan}</td>
                      <td className="p-4 text-right font-semibold text-text-main">{formatRp(t.amount)}</td>
                      <td className="p-4 text-right text-emerald-600 font-semibold">{formatRp(t.terbayar)}</td>
                      <td className="p-4 text-right font-bold text-red-500">{formatRp(t.sisa)}</td>
                      <td className="p-4 text-center">{statusBadge(t.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleCetak(t.muridId)} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="Cetak Surat Tagihan">
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {daftarTagihan.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-text-muted">
                        <Receipt size={40} className="mx-auto text-text-muted/30 mb-3" />
                        <p className="font-medium">Belum ada tagihan siswa.</p>
                        <p className="text-sm mt-1">Generate tagihan dari tab "Jenis Tagihan" terlebih dahulu.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
