"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, GraduationCap, Building, Award, Calendar, User, Edit2, Info, ArrowRight, Phone, MessageCircle, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SideDrawer } from "@/components/ui/SideDrawer"
import { ToolbarExportExcel, ToolbarExportPDF } from "@/components/ui/DataTableToolbar"
import { getSiswaPaginated } from "@/actions/siswa"
import toast from "react-hot-toast"

interface SubKelasDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  subKelas: any
  isReadOnly?: boolean
  onEdit?: (subKelas: any) => void
  onPrev?: () => void
  onNext?: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  onManageClass?: (subKelas: any) => void
  userName?: string
}

export default function SubKelasDetailDrawer({
  isOpen,
  onClose,
  subKelas,
  isReadOnly = false,
  onEdit,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  onManageClass,
  userName
}: SubKelasDetailDrawerProps) {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  useEffect(() => {
    if (isOpen && subKelas?.id) {
      setIsLoading(true)
      getSiswaPaginated({
        subKelasId: subKelas.id,
        page: 1,
        limit: 200,
        statusFilter: "AKTIF"
      })
        .then((res) => {
          setStudents(res.data || [])
        })
        .catch(() => {
          setStudents([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setStudents([])
    }
  }, [isOpen, subKelas])

  if (!isOpen || !subKelas) return null

  const maleCount = students.filter(s => s.gender?.toLowerCase().includes("laki")).length
  const femaleCount = students.filter(s => s.gender?.toLowerCase().includes("perempuan")).length

  const handleStudentClick = (studentId: string) => {
    onClose()
    router.push(`/murid/${studentId}`)
  }

  const formatWhatsAppUrl = (phone: string | null | undefined) => {
    if (!phone) return null
    let clean = phone.replace(/\D/g, "")
    if (clean.startsWith("0")) clean = "62" + clean.slice(1)
    return `https://wa.me/${clean}`
  }

  const handleExportExcel = async () => {
    if (students.length === 0) {
      toast.error("Tidak ada data siswa untuk diekspor")
      return
    }
    setIsExportingExcel(true)
    try {
      const { exportToExcel } = await import("@/lib/excel")
      const mappedData = students.map((s, idx) => ({
        "No": idx + 1,
        "NISN": s.nisn || "-",
        "NIS": s.nis || "-",
        "Nama Siswa": s.name,
        "Gender": s.gender,
        "Status": s.status || "AKTIF",
        "Asal Sekolah": s.previousSchool || "-",
        "Nama Orang Tua / Wali": s.parentName || "-",
        "No. HP Orang Tua": s.parentPhone || "-"
      }))
      const dateStr = new Date().toISOString().split('T')[0]
      exportToExcel(mappedData, `Roster_Siswa_${subKelas.name}_${dateStr}`.replace(/\s+/g, '_'), {
        title: `Daftar Siswa Kelas ${subKelas.name}`,
        unitInfo: subKelas.unitSekolah || { name: "Yayasan Siraya" }
      })
      toast.success("Berhasil mengunduh Excel Daftar Siswa")
    } catch (err: any) {
      toast.error("Gagal ekspor Excel: " + err.message)
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    if (students.length === 0) {
      toast.error("Tidak ada data siswa untuk diekspor")
      return
    }
    setIsExportingPDF(true)
    try {
      const { exportTablePdf } = await import("@/lib/pdf")
      const { buildInstitutionInfo } = await import("@/lib/pdf-helpers")
      
      const tableColumn = ["No", "NIS", "NISN", "Nama", "L/P", "Status"]
      const tableRows = students.map((s: any, index: number) => [
        index + 1,
        s.nis || "-",
        s.nisn || "-",
        s.nama || s.name,
        s.jenisKelamin || s.gender,
        s.status || "AKTIF"
      ])

      exportTablePdf({
        institutionInfo: buildInstitutionInfo(undefined, subKelas.unitSekolah),
        title: `Daftar Murid Kelas ${subKelas.nama}`,
        subtitle: `Tingkat: ${subKelas.tingkat.name} • Tahun Akademik: ${subKelas.tahunAkademik.name}`,
        headers: tableColumn,
        data: tableRows,
        filename: `Murid_Kelas_${subKelas.nama.replace(/\s+/g, '_')}`,
        config: { orientation: 'portrait' }
      })
      toast.success("Berhasil mengunduh PDF Daftar Siswa")
    } catch (err: any) {
      toast.error("Gagal ekspor PDF: " + err.message)
    } finally {
      setIsExportingPDF(false)
    }
  }

  const subtitle = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-primary font-bold">{subKelas.unitSekolah?.name || "Unit Sekolah"}</span>
      <span>•</span>
      <span>{subKelas.tingkat?.name || "Tingkat"}</span>
      {subKelas.jurusan?.name && (
        <>
          <span>•</span>
          <span className="text-indigo-600 font-semibold">{subKelas.jurusan.name}</span>
        </>
      )}
    </div>
  )

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="text-xs text-gray-500">
        Mode: <span className="font-bold text-gray-700">{isReadOnly ? "Read-Only (Kepala Sekolah)" : "Administrator / TU"}</span>
      </div>
      <div className="flex items-center gap-2">
        {onManageClass && (
          <Button
            variant="outline"
            onClick={() => {
              onClose()
              onManageClass(subKelas)
            }}
            className="gap-2 font-semibold bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white"
          >
            <Users size={16} /> Kelola Murid Rombel
          </Button>
        )}
        {!isReadOnly && onEdit && (
          <Button
            variant="outline"
            onClick={() => {
              onClose()
              onEdit(subKelas)
            }}
            className="gap-2 font-semibold"
          >
            <Edit2 size={16} /> Edit Rombel Ini
          </Button>
        )}
        <Button variant="primary" onClick={onClose} className="px-6 font-bold">
          Tutup
        </Button>
      </div>
    </div>
  )

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={subKelas.name}
      subtitle={subtitle}
      icon={<GraduationCap size={24} />}
      widthClassName="max-w-4xl"
      onPrev={onPrev}
      onNext={onNext}
      prevDisabled={prevDisabled}
      nextDisabled={nextDisabled}
      footer={footer}
    >
      {/* Cards Info Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 rounded-2xl border border-blue-100/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-blue-700 font-bold uppercase tracking-wide">Total Siswa Aktif</div>
            <div className="text-2xl font-black text-gray-900">{isLoading ? "..." : students.length} <span className="text-xs font-normal text-gray-500">Siswa</span></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl border border-emerald-100/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
            <User size={22} />
          </div>
          <div>
            <div className="text-xs text-emerald-700 font-bold uppercase tracking-wide">Laki-Laki</div>
            <div className="text-2xl font-black text-gray-900">{isLoading ? "..." : maleCount} <span className="text-xs font-normal text-gray-500">Siswa</span></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-rose-50/50 p-4 rounded-2xl border border-pink-100/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold shadow-md">
            <User size={22} />
          </div>
          <div>
            <div className="text-xs text-pink-700 font-bold uppercase tracking-wide">Perempuan</div>
            <div className="text-2xl font-black text-gray-900">{isLoading ? "..." : femaleCount} <span className="text-xs font-normal text-gray-500">Siswa</span></div>
          </div>
        </div>
      </div>

      {/* Info Tambahan */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tahun Akademik</label>
          <div className="font-bold text-gray-800 mt-0.5 flex items-center gap-1.5">
            <Calendar size={15} className="text-primary" />
            {subKelas.tahunAkademik?.year || "Active Year"}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tingkat Sekolah</label>
          <div className="font-bold text-gray-800 mt-0.5 flex items-center gap-1.5">
            <Building size={15} className="text-primary" />
            {subKelas.tingkat?.name || "-"}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Program Studi / Jurusan</label>
          <div className="font-bold text-gray-800 mt-0.5 flex items-center gap-1.5">
            <Award size={15} className="text-primary" />
            {subKelas.jurusan?.name || "Umum / Non-Kejuruan"}
          </div>
        </div>
      </div>

      {/* Kartu Kontak Wali Kelas (QoL Feature) */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-xs text-emerald-700 font-extrabold uppercase tracking-wide">Wali Kelas / Pembimbing</div>
            <div className="text-lg font-bold text-text-main">
              {subKelas.waliKelasGuru?.name || subKelas.waliKelas || <span className="italic text-text-muted font-normal">Belum Ditentukan</span>}
            </div>
            {subKelas.waliKelasGuru?.nip && (
              <div className="text-xs text-text-muted font-mono">NIP: {subKelas.waliKelasGuru.nip}</div>
            )}
          </div>
        </div>

        {(subKelas.waliKelasGuru?.phone || subKelas.waliKelasPhone) ? (
          <a
            href={formatWhatsAppUrl(subKelas.waliKelasGuru?.phone || subKelas.waliKelasPhone) || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all font-semibold text-xs w-fit"
          >
            <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
            <span>Chat WhatsApp ({subKelas.waliKelasGuru?.phone || subKelas.waliKelasPhone})</span>
          </a>
        ) : (
          <div className="text-xs text-text-muted italic flex items-center gap-1.5 bg-background/60 px-3 py-1.5 rounded-lg border border-border">
            <Phone className="w-3.5 h-3.5" /> Kontak telepon belum tersedia
          </div>
        )}
      </div>

      {/* Daftar Siswa (Roster) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Daftar Siswa (Roster)
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              Klik siswa untuk melihat Profil 360°
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ToolbarExportExcel 
              onClick={handleExportExcel} 
              isExporting={isExportingExcel} 
              disabled={students.length === 0}
            />
            <ToolbarExportPDF 
              onClick={handleExportPDF} 
              isExporting={isExportingPDF} 
              disabled={students.length === 0}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="bg-gray-50/80 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <Users size={36} className="mx-auto text-gray-300 mb-2" />
            <div className="font-bold text-gray-600">Belum Ada Siswa Aktif</div>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
              Belum ada siswa aktif yang dialokasikan ke rombongan belajar ini.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NIS / NISN</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, idx) => (
                  <tr 
                    key={s.id} 
                    onClick={() => handleStudentClick(s.id)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-center font-medium text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{s.name}</div>
                          <div className="text-[11px] text-gray-400">{s.status || "AKTIF"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-gray-700">{s.nisn || "-"}</div>
                      <div className="font-mono text-[11px] text-gray-400">{s.nis}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        s.gender?.toLowerCase().includes("laki") 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-pink-100 text-pink-700"
                      }`}>
                        {s.gender?.toLowerCase().includes("laki") ? "L" : "P"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStudentClick(s.id)
                        }}
                        className="text-xs gap-1 py-1 px-2.5 group-hover:border-primary group-hover:text-primary font-bold"
                      >
                        Profil 360° <ArrowRight size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SideDrawer>
  )
}
