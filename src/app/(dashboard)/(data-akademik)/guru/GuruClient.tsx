"use client"

import { useState, useMemo, useEffect } from "react"
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
  BadgeCheck,
  UploadCloud,
  User,
  X,
  Eye
} from "lucide-react"
import Link from "next/link"
import { tambahGuru, editGuru, hapusGuru, hapusGuruMassal } from "@/actions/guru"
import toast from "react-hot-toast"
import GuruFormModal from "@/components/modals/GuruFormModal"
import ImportGuruModal from "@/components/modals/ImportGuruModal"

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
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
}

export default function GuruClient({
  initialData,
  schoolUnits,
  userRole,
  activeUnitId
}: {
  initialData: Guru[]
  schoolUnits: UnitSekolah[]
  userRole?: string
  activeUnitId: string
}) {
  const router = useRouter()
  const isReadOnly = userRole === "KEPALA_SEKOLAH"

  const [data, setData] = useState<Guru[]>(initialData)
  
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [statusFilter, setStatusFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeUnitId, statusFilter, searchTerm])

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModalImportGuru, setShowModalImportGuru] = useState(false)

  const [selectedGurus, setSelectedGurus] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

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

  const handleBulkDeleteConfirm = async () => {
    if (selectedGurus.length === 0) return
    setIsDeletingBulk(true)
    try {
      await hapusGuruMassal(selectedGurus)
      setData(data.filter(d => !selectedGurus.includes(d.id)))
      toast.success(`Berhasil menghapus ${selectedGurus.length} data guru`)
      setSelectedGurus([])
      setShowBulkDeleteModal(false)
    } catch (err: any) {
      toast.error("Gagal menghapus data massal: " + err.message)
    } finally {
      setIsDeletingBulk(false)
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

  const paginatedData = useMemo(() => {
    return filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredData, currentPage, pageSize])

  const computedTotalPages = Math.ceil(filteredData.length / pageSize)

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
        unitInfo: unitObj ? {
          address: unitObj.address,
          phone: unitObj.phone,
          email: unitObj.email,
          website: unitObj.website
        } : undefined,
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
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
        {/* Dummy Tab Navigation for UI Consistency */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button className="px-6 py-3 font-semibold text-sm border-b-2 border-primary text-primary transition-colors">
            Daftar Guru & Staf Aktif
          </button>
        </div>

        {/* Top Filter & Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          {/* Search Box */}
          <div className="relative w-full md:w-64 flex-shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari nama, NIP, tugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-medium text-text-main placeholder-text-muted/50"
            />
          </div>

          {/* Filter Status Kepegawaian */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
          >
            <option value="">Semua Status</option>
            <option value="GTY">GTY (Tetap Yayasan)</option>
            <option value="GTT">GTT (Honorer)</option>
            <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
            <option value="DPK">DPK (Diperbantukan)</option>
            <option value="PPPK">PPPK (Perjanjian Kerja)</option>
            <option value="Honor">Honor (Pegawai Lepas)</option>
            <option value="Staf TU">Staf TU (Tata Usaha)</option>
            <option value="Satpam">Satpam (Keamanan)</option>
            <option value="OB">OB (Kebersihan)</option>
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2 border-l border-border pl-3" title="Ekspor data sesuai filter saat ini">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel || filteredData.length === 0}
              className="opacity-100 border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
            >
              <FileSpreadsheet size={16} className="mr-1.5" />
              {isExportingExcel ? 'Mengekspor...' : 'Excel'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF || filteredData.length === 0}
              className="opacity-100 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800"
            >
              <FileText size={16} className="mr-1.5" />
              {isExportingPDF ? 'Mengekspor...' : 'PDF'}
            </Button>

            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModalImportGuru(true)}
                className="opacity-100 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800"
              >
                <UploadCloud size={16} className="mr-1.5" />
                Impor Excel
              </Button>
            )}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex-shrink-0">
            <Button
              onClick={handleOpenAdd}
              className="flex items-center bg-primary text-white hover:bg-primary/90 shadow-sm"
            >
              <Plus size={16} className="mr-1.5" />
              <span>Tambah Guru</span>
            </Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
              <tr>

                <th className="p-4 font-semibold text-center w-12">NO</th>
                <th className="p-4 font-semibold text-left">NIP / NUPTK / NIK</th>
                <th className="p-4 font-semibold text-left">NAMA LENGKAP</th>
                <th className="p-4 font-semibold text-left">PENDIDIKAN</th>
                <th className="p-4 font-semibold text-left">UNIT SEKOLAH</th>
                <th className="p-4 font-semibold text-left">STATUS PEGAWAI</th>
                <th className="p-4 font-semibold text-left">BIDANG STUDI</th>
                {!isReadOnly && <th className="p-4 font-semibold text-right">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <GraduationCap className="w-12 h-12 stroke-[1.2] text-text-muted/40 mb-3" />
                      <p className="font-medium text-text-main">Belum Ada Data Guru</p>
                      <p className="text-xs mt-1">Gunakan tombol + Tambah Guru untuk memasukkan data kepegawaian baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const absoluteIdx = (currentPage - 1) * pageSize + idx + 1
                  const waUrl = formatWhatsAppUrl(item.phone)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">

                      <td className="p-4 text-center text-text-main">{absoluteIdx}</td>
                      <td className="p-4">
                        <div className="font-mono text-sm text-text-main font-semibold">
                          {item.nip || "-"}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 border border-border overflow-hidden flex items-center justify-center">
                            <User size={16} className="text-gray-400" />
                          </div>
                          <div className="font-bold text-text-main">
                            {item.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-text-muted">
                        {item.pendidikan || "-"}
                      </td>
                      <td className="p-4 font-medium text-text-main">
                        {item.unitSekolah?.name || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.statusKepegawaian === "GTY" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          item.statusKepegawaian === "PNS" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {item.statusKepegawaian}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-text-muted truncate max-w-[200px]" title={item.bidangStudi || ""}>
                        {item.bidangStudi || "-"}
                      </td>
                      {!isReadOnly && (
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/guru/${item.id}`}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-600 transition-colors"
                              title="Detail"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 hover:border-green-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
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

        {/* Pagination Controls */}
        {computedTotalPages > 0 && (
          <div className="pt-4 mt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-muted">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
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
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-1.5 text-sm font-medium text-text-main">
                Hal {currentPage} dari {computedTotalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(computedTotalPages, p + 1))}
                disabled={currentPage === computedTotalPages}
                className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Modular 4-Tab Guru Form Modal */}
      <GuruFormModal
        isOpen={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={handleSaveModal}
        initialData={formData}
        schoolUnits={schoolUnits}
      />

      <ImportGuruModal
        isOpen={showModalImportGuru}
        onClose={() => setShowModalImportGuru(false)}
        onSuccess={() => {
          setShowModalImportGuru(false)
          // Data is refreshed via router.refresh() inside the modal
        }}
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
