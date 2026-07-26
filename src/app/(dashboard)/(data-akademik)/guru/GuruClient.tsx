"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { 
  Edit2, 
  Plus, 
  Trash2, 
  GraduationCap, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Phone, 
  MessageCircle,
  Building2,
  BadgeCheck
} from "lucide-react"
import { tambahGuru, editGuru, hapusGuru } from "@/actions/guru"
import toast from "react-hot-toast"
import GuruFormModal from "@/components/modals/GuruFormModal"

type Guru = {
  id: string
  nip: string | null
  name: string
  gender: string
  phone: string | null
  email: string | null
  statusKepegawaian: string
  pendidikan: string | null
  bidangStudi: string | null
  bankName: string | null
  bankAccount: string | null
  bankAccountName: string | null
  isActive: boolean
  unitSekolahId: string
  unitSekolah?: { id: string, name: string, level?: string }
}

type UnitSekolah = {
  id: string
  name: string
  level?: string
}

export default function GuruClient({
  initialData,
  schoolUnits,
  userRole
}: {
  initialData: Guru[]
  schoolUnits: UnitSekolah[]
  userRole?: string
}) {
  const router = useRouter()
  const isReadOnly = userRole === "KEPALA_SEKOLAH"

  const [data, setData] = useState<Guru[]>(initialData)
  const [activeUnitId, setActiveUnitId] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const defaultForm = {
    id: "",
    name: "",
    nip: "",
    gender: "Laki-laki",
    phone: "",
    email: "",
    statusKepegawaian: "GTY",
    pendidikan: "S1",
    bidangStudi: "Guru Kelas / Mata Pelajaran",
    bankName: "",
    bankAccount: "",
    bankAccountName: "",
    unitSekolahId: schoolUnits[0]?.id || "",
    isActive: true
  }

  const [formData, setFormData] = useState(defaultForm)

  const handleOpenAdd = () => {
    setFormData({
      ...defaultForm,
      unitSekolahId: activeUnitId || schoolUnits[0]?.id || ""
    })
    setIsAdding(true)
  }

  const handleEdit = (item: Guru) => {
    setFormData({
      id: item.id,
      name: item.name,
      nip: item.nip || "",
      gender: item.gender || "Laki-laki",
      phone: item.phone || "",
      email: item.email || "",
      statusKepegawaian: item.statusKepegawaian || "GTY",
      pendidikan: item.pendidikan || "S1",
      bidangStudi: item.bidangStudi || "",
      bankName: item.bankName || "",
      bankAccount: item.bankAccount || "",
      bankAccountName: item.bankAccountName || "",
      unitSekolahId: item.unitSekolahId,
      isActive: item.isActive
    })
    setIsAdding(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusGuru(deleteId)
      setData(data.filter(d => d.id !== deleteId))
      toast.success("Data guru berhasil dihapus")
      setDeleteId(null)
    } catch (err: any) {
      toast.error("Gagal menghapus data: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveModal = async (modalData: any) => {
    if (!modalData.name?.trim()) {
      toast.error("Nama lengkap guru wajib diisi")
      throw new Error("Validation error")
    }
    if (!modalData.unitSekolahId) {
      toast.error("Unit sekolah wajib dipilih")
      throw new Error("Validation error")
    }

    setIsSubmitting(true)
    try {
      if (modalData.id) {
        const res = await editGuru(modalData.id, modalData)
        const updatedUnit = schoolUnits.find(u => u.id === modalData.unitSekolahId)
        setData(data.map(d => d.id === modalData.id ? { ...res, unitSekolah: updatedUnit } : d))
        toast.success("Data guru berhasil diperbarui")
      } else {
        const res = await tambahGuru(modalData)
        const updatedUnit = schoolUnits.find(u => u.id === modalData.unitSekolahId)
        setData([...data, { ...res, unitSekolah: updatedUnit }])
        toast.success("Guru baru berhasil ditambahkan")
      }
      setIsAdding(false)
      setFormData(defaultForm)
    } catch (err: any) {
      toast.error("Gagal menyimpan data: " + (err.message || "Terjadi kesalahan"))
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (activeUnitId && item.unitSekolahId !== activeUnitId) return false
      if (statusFilter && item.statusKepegawaian !== statusFilter) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchNip = (item.nip || "").toLowerCase().includes(q)
        const matchBidang = (item.bidangStudi || "").toLowerCase().includes(q)
        if (!matchName && !matchNip && !matchBidang) return false
      }
      return true
    })
  }, [data, activeUnitId, statusFilter, searchTerm])

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data guru untuk diekspor")
      return
    }
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const mappedData = filteredData.map((g, idx) => ({
        "No": idx + 1,
        "NIP / NUPTK / NIK": g.nip || "-",
        "Nama Lengkap": g.name,
        "Gender": g.gender,
        "Unit Sekolah": g.unitSekolah?.name || "-",
        "Status": g.statusKepegawaian,
        "Pendidikan": g.pendidikan || "-",
        "Bidang Studi / Tugas": g.bidangStudi || "-",
        "No. WhatsApp": g.phone || "-",
        "Email": g.email || "-",
        "Nama Bank": g.bankName || "-",
        "No. Rekening": g.bankAccount || "-",
        "Atas Nama": g.bankAccountName || "-"
      }))
      const unitName = activeUnitId ? schoolUnits.find(u => u.id === activeUnitId)?.name || "Unit" : "Semua_Unit"
      const dateStr = new Date().toISOString().split('T')[0]
      exportToExcel(mappedData, `Data_Guru_${unitName}_${dateStr}`.replace(/\s+/g, '_'))
      toast.success("Berhasil mengunduh Excel Data Guru")
    } catch (err: any) {
      toast.error("Gagal ekspor Excel: " + err.message)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data guru untuk diekspor")
      return
    }
    setIsExportingPDF(true)
    try {
      const { exportToPdfTable } = await import("@/lib/pdf")
      const unitObj = schoolUnits.find(u => u.id === activeUnitId)
      const schoolUnitName = unitObj ? `UNIT ${unitObj.name.toUpperCase()} SIRAYA` : "YAYASAN AL-BASYARIAH SIRAYA"
      const dateStr = new Date().toISOString().split('T')[0]

      const headers = ["No", "NIP / NIK", "Nama Lengkap & Gelar", "Unit", "Status", "Pendidikan", "No. WA"]
      const pdfRows = filteredData.map((g, idx) => [
        idx + 1,
        g.nip || "-",
        g.name,
        g.unitSekolah?.name || "-",
        g.statusKepegawaian,
        g.pendidikan || "-",
        g.phone || "-"
      ])

      exportToPdfTable({
        title: "Daftar Guru & Staf Kepegawaian",
        subtitle: `Unit: ${unitObj?.name || "Semua Unit"} • Total: ${filteredData.length} Orang`,
        headers,
        data: pdfRows,
        filename: `Daftar_Guru_${unitObj?.name || "Semua"}_${dateStr}`.replace(/\s+/g, '_'),
        schoolUnitName,
        orientation: 'landscape'
      })
      toast.success("Berhasil mengunduh PDF Daftar Guru")
    } catch (err: any) {
      toast.error("Gagal ekspor PDF: " + err.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  const formatWhatsAppUrl = (phone: string | null) => {
    if (!phone) return null
    let clean = phone.replace(/\D/g, "")
    if (clean.startsWith("0")) clean = "62" + clean.slice(1)
    return `https://wa.me/${clean}`
  }

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Card */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Unit */}
          <select
            value={activeUnitId}
            onChange={(e) => setActiveUnitId(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Unit Sekolah</option>
            {schoolUnits.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Filter Status Kepegawaian */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Status</option>
            <option value="GTY">GTY (Tetap Yayasan)</option>
            <option value="GTT">GTT (Honorer)</option>
            <option value="PNS">PNS / DPK</option>
            <option value="Staf TU">Staf Tata Usaha</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIP, tugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredData.length === 0}
            className="flex items-center gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExportingPDF || filteredData.length === 0}
            className="flex items-center gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {!isReadOnly && (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">NIP / NUPTK / NIK</th>
                <th className="py-3.5 px-4">Nama Lengkap & Gelar</th>
                <th className="py-3.5 px-4">Unit Sekolah</th>
                <th className="py-3.5 px-4">Status & Tugas</th>
                <th className="py-3.5 px-4">Kontak WhatsApp</th>
                {!isReadOnly && <th className="py-3.5 px-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 6 : 7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <GraduationCap className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                      <p className="font-medium text-text-main">Belum Ada Data Guru</p>
                      <p className="text-xs mt-1">Gunakan tombol + Tambah Guru untuk memasukkan data kepegawaian baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const waUrl = formatWhatsAppUrl(item.phone)
                  return (
                    <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-center font-medium text-text-muted">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-text-muted">
                        {item.nip || <span className="italic opacity-60">Non-NIP</span>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-text-main">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-text-muted font-normal">
                            {item.pendidikan || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-text-main bg-primary/5 text-primary px-2 py-0.5 rounded-full border border-primary/10">
                          <Building2 className="w-3 h-3" />
                          {item.unitSekolah?.name || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.statusKepegawaian === "GTY" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            item.statusKepegawaian === "PNS" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                            "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {item.statusKepegawaian}
                          </span>
                          <span className="text-xs text-text-muted truncate max-w-[150px]" title={item.bidangStudi || ""}>
                            {item.bidangStudi || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.phone ? (
                          <a
                            href={waUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-medium"
                            title="Chat via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                            <span>{item.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-text-muted/60 italic">Belum dicantumkan</span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                              title="Edit Data Guru"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Hapus Guru"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modular 4-Tab Guru Form Modal */}
      <GuruFormModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={handleSaveModal}
        initialData={formData}
        schoolUnits={schoolUnits}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Guru"
        message="Apakah Anda yakin ingin menghapus data guru ini? Guru yang dihapus tidak akan muncul pada pilihan Wali Kelas."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        isLoading={isDeleting}
      />
    </div>
  )
}
