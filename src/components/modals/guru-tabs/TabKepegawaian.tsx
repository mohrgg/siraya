import React, { useState, useEffect } from "react"
import { Building, Award, Briefcase, Hash, CheckCircle2, GraduationCap, Users } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { DynamicSelect } from "@/components/ui/DynamicSelect"
import { getBidangStudiList, createBidangStudi, deleteBidangStudi } from "@/actions/bidang-studi"
import { getStatusKepegawaianList, createStatusKepegawaian, deleteStatusKepegawaian } from "@/actions/status-kepegawaian"
import { getJabatanStafList, createJabatanStaf, deleteJabatanStaf } from "@/actions/jabatan-staf"
import { normalizeStatusKepegawaian } from "@/lib/constants/kepegawaian"
import toast from "react-hot-toast"

export default function TabKepegawaian({
  formData,
  handleChange,
  schoolUnits,
  activeUnitId,
  userRole,
}: {
  formData: any
  handleChange: (field: string, value: any) => void
  schoolUnits: any[]
  activeUnitId?: string
  userRole?: string
}) {
  const [opsiBidangStudi, setOpsiBidangStudi] = useState<any[]>([])
  const [opsiStatusKepegawaian, setOpsiStatusKepegawaian] = useState<any[]>([])
  const [opsiJabatanStaf, setOpsiJabatanStaf] = useState<any[]>([])

  const currentJenisPtk = formData.jenisPtk || "GURU"

  const isUnitLocked = Boolean(activeUnitId && activeUnitId !== "all") || (userRole !== "ADMIN" && Boolean(formData.unitSekolahId || activeUnitId))
  const lockedUnitId = (activeUnitId && activeUnitId !== "all") ? activeUnitId : formData.unitSekolahId
  const selectedUnit = schoolUnits?.find((u: any) => u.id === (formData.unitSekolahId || lockedUnitId))

  useEffect(() => {
    if (isUnitLocked && lockedUnitId && formData.unitSekolahId !== lockedUnitId) {
      handleChange("unitSekolahId", lockedUnitId)
    }
  }, [isUnitLocked, lockedUnitId, formData.unitSekolahId])

  useEffect(() => {
    loadStatusKepegawaian()
    loadJabatanStaf()
  }, [])

  const loadStatusKepegawaian = async () => {
    const { data, error } = await getStatusKepegawaianList()
    if (error) {
      toast.error(error)
    } else {
      setOpsiStatusKepegawaian(data || [])
    }
  }

  const handleAddStatusKepegawaian = async (name: string) => {
    const res = await createStatusKepegawaian(name)
    if (!res.success) {
      toast.error(res.error || "Gagal menambahkan status kepegawaian")
    } else if (res.data) {
      toast.success(`Status "${res.data.name}" berhasil ditambahkan`)
      setOpsiStatusKepegawaian(prev => {
        if (prev.some(o => o.id === res.data!.id)) return prev
        return [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name))
      })
      handleChange("statusKepegawaian", res.data.name)
    }
  }

  const handleDeleteStatusKepegawaian = async (id: string) => {
    const res = await deleteStatusKepegawaian(id)
    if (!res.success) {
      toast.error(res.error || "Gagal menghapus status kepegawaian")
    } else {
      toast.success("Status kepegawaian berhasil dihapus")
      setOpsiStatusKepegawaian(prev => prev.filter(o => o.id !== id))
    }
  }

  const loadJabatanStaf = async () => {
    const { data, error } = await getJabatanStafList()
    if (error) {
      toast.error(error)
    } else {
      setOpsiJabatanStaf(data || [])
    }
  }

  const handleAddJabatanStaf = async (name: string) => {
    const res = await createJabatanStaf(name)
    if (!res.success) {
      toast.error(res.error || "Gagal menambahkan jabatan staf")
    } else if (res.data) {
      toast.success(`Jabatan "${res.data.name}" berhasil ditambahkan`)
      setOpsiJabatanStaf(prev => {
        if (prev.some(o => o.id === res.data!.id)) return prev
        return [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name))
      })
      handleChange("jabatan", res.data.name)
    }
  }

  const handleDeleteJabatanStaf = async (id: string) => {
    const res = await deleteJabatanStaf(id)
    if (!res.success) {
      toast.error(res.error || "Gagal menghapus jabatan staf")
    } else {
      toast.success("Jabatan staf berhasil dihapus")
      setOpsiJabatanStaf(prev => prev.filter(o => o.id !== id))
    }
  }

  useEffect(() => {
    if (formData.unitSekolahId && currentJenisPtk === "GURU") {
      loadBidangStudi(formData.unitSekolahId)
    } else {
      setOpsiBidangStudi([])
    }
  }, [formData.unitSekolahId, currentJenisPtk])

  const loadBidangStudi = async (unitId: string) => {
    const { data } = await getBidangStudiList(unitId)
    setOpsiBidangStudi(data || [])
  }

  const handleAddBidangStudi = async (name: string) => {
    if (!formData.unitSekolahId) {
      toast.error("Pilih Unit Sekolah terlebih dahulu")
      return
    }
    const { data, error } = await createBidangStudi(name, formData.unitSekolahId)
    if (error) {
      toast.error(error)
    } else if (data) {
      toast.success(`Bidang studi "${data.name}" berhasil ditambahkan`)
      setOpsiBidangStudi(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      handleChange("bidangStudiId", data.id)
    }
  }

  const handleDeleteBidangStudi = async (id: string) => {
    const { error } = await deleteBidangStudi(id)
    if (error) toast.error(error)
    else {
      toast.success("Bidang studi berhasil dihapus")
      setOpsiBidangStudi(prev => prev.filter(o => o.id !== id))
    }
  }

  const handleSelectJenisPtk = (type: "GURU" | "STAF") => {
    handleChange("jenisPtk", type)
    if (type === "GURU") {
      handleChange("jabatan", "")
    } else {
      handleChange("bidangStudiId", "")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Briefcase size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-main">Data Kepegawaian & Tugas Yayasan</h4>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Pilih klasifikasi peran (Guru / Staf) dan pastikan unit serta status kepegawaian sesuai penugasan terbaru.
          </p>
        </div>
      </div>

      {/* Selector Jenis Peran / PTK (Clean Antislop UI & Mobile 44px Target) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
          <Users size={15} className="text-primary" />
          Kategori Tenaga Kependidikan (PTK) <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => handleSelectJenisPtk("GURU")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
              currentJenisPtk === "GURU"
                ? "bg-white text-primary shadow-xs border border-border"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <GraduationCap size={16} className={currentJenisPtk === "GURU" ? "text-primary" : "text-text-muted"} />
            <span>Guru (Tenaga Pendidik)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectJenisPtk("STAF")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
              currentJenisPtk === "STAF"
                ? "bg-white text-primary shadow-xs border border-border"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <Briefcase size={16} className={currentJenisPtk === "STAF" ? "text-primary" : "text-text-muted"} />
            <span>Staf & Karyawan (Tendik)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Building size={15} className="text-primary" />
            {currentJenisPtk === "GURU" ? "Unit Sekolah Penugasan" : "Unit / Kantor Penugasan"} <span className="text-red-500">*</span>
          </label>
          {isUnitLocked ? (
            <div className="px-3.5 py-2.5 bg-bg/80 border border-border rounded-xl text-sm font-bold text-text-main flex items-center justify-between">
              <span>{selectedUnit?.name || "Unit Terpilih"}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Terkunci</span>
            </div>
          ) : (
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
              value={formData.unitSekolahId || ""} 
              onChange={e => handleChange("unitSekolahId", e.target.value)} 
              required
            >
              <option value="" disabled>-- Pilih Unit Penugasan --</option>
              {schoolUnits?.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Award size={15} className="text-primary" />
            Status Kepegawaian <span className="text-red-500">*</span>
          </label>
          <DynamicSelect 
            value={formData.statusKepegawaian || ""}
            onChange={(val) => handleChange("statusKepegawaian", val)}
            options={opsiStatusKepegawaian}
            onAdd={handleAddStatusKepegawaian}
            onDelete={handleDeleteStatusKepegawaian}
            placeholder="-- Pilih Status Kepegawaian --"
            valueMode="name"
            deleteTitle="Hapus Status Kepegawaian"
            deleteMessage="Apakah Anda yakin ingin menghapus status kepegawaian ini? Status hanya dapat dihapus jika tidak sedang digunakan oleh pegawai manapun."
          />
        </div>

        {currentJenisPtk === "GURU" ? (
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <GraduationCap size={15} className="text-primary" />
              Bidang Studi / Tugas Mengajar Utama
            </label>
            <DynamicSelect 
              value={formData.bidangStudiId || ""}
              onChange={(val) => handleChange("bidangStudiId", val)}
              options={opsiBidangStudi}
              onAdd={handleAddBidangStudi}
              onDelete={handleDeleteBidangStudi}
              placeholder="Pilih Bidang Studi..."
              disabled={!formData.unitSekolahId}
            />
            {!formData.unitSekolahId && (
              <span className="text-[11px] text-amber-500">Pilih unit sekolah terlebih dahulu untuk melihat opsi bidang studi.</span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <Briefcase size={15} className="text-primary" />
              Jabatan / Posisi Penugasan Staf <span className="text-red-500">*</span>
            </label>
            <DynamicSelect 
              value={formData.jabatan || ""}
              onChange={(val) => handleChange("jabatan", val)}
              options={opsiJabatanStaf}
              onAdd={handleAddJabatanStaf}
              onDelete={handleDeleteJabatanStaf}
              placeholder="-- Pilih atau Tambah Jabatan Staf --"
              valueMode="name"
              deleteTitle="Hapus Jabatan Staf"
              deleteMessage="Apakah Anda yakin ingin menghapus jabatan staf ini? Jabatan hanya dapat dihapus jika tidak sedang digunakan oleh staf manapun."
            />
            <span className="text-[11px] text-text-muted">
              Anda dapat memilih dari daftar atau mengetikkan jabatan staf baru jika belum tersedia.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Hash size={15} className="text-primary" />
            NIP / NUPTK / NIK Yayasan
          </label>
          <Input 
            placeholder="Cth: 19850101 201001 1 001" 
            value={formData.nip || ""} 
            onChange={e => handleChange("nip", e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-primary" />
            Status Keaktifan
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
            value={formData.isActive === false ? "false" : "true"} 
            onChange={e => handleChange("isActive", e.target.value === "true")}
          >
            <option value="true">
              {currentJenisPtk === "GURU" ? "Aktif Mengajar" : "Aktif Bertugas"}
            </option>
            <option value="false">Tidak Aktif / Non-Aktif / Cuti</option>
          </select>
        </div>
      </div>
    </div>
  )
}
