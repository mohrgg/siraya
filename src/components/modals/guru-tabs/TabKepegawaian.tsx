import React, { useState, useEffect } from "react"
import { Building, Award, Briefcase, Hash, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { DynamicSelect } from "@/components/ui/DynamicSelect"
import { getBidangStudiList, createBidangStudi, deleteBidangStudi } from "@/actions/bidang-studi"
import { STATUS_KEPEGAWAIAN_LIST, normalizeStatusKepegawaian } from "@/lib/constants/kepegawaian"

export default function TabKepegawaian({ formData, handleChange, schoolUnits, availableStatuses }: any) {
  const [opsiBidangStudi, setOpsiBidangStudi] = useState<any[]>([])
  const [isCustomStatus, setIsCustomStatus] = useState(false)

  const currentNormalized = normalizeStatusKepegawaian(formData.statusKepegawaian)
  const knownStatuses = Array.from(new Set([
    ...STATUS_KEPEGAWAIAN_LIST,
    ...(availableStatuses?.map((s: any) => normalizeStatusKepegawaian(s.value)) || []),
    currentNormalized
  ])).filter(Boolean)

  useEffect(() => {
    if (formData.statusKepegawaian === "LAINNYA") {
      setIsCustomStatus(true)
    }
  }, [formData.statusKepegawaian])

  useEffect(() => {
    if (formData.unitSekolahId) {
      loadBidangStudi(formData.unitSekolahId)
    } else {
      setOpsiBidangStudi([])
    }
  }, [formData.unitSekolahId])

  const loadBidangStudi = async (unitId: string) => {
    const { data } = await getBidangStudiList(unitId)
    setOpsiBidangStudi(data || [])
  }

  const handleAddBidangStudi = async (name: string) => {
    if (!formData.unitSekolahId) return alert("Pilih Unit Sekolah terlebih dahulu")
    const { data, error } = await createBidangStudi(name, formData.unitSekolahId)
    if (error) alert(error)
    else if (data) {
      setOpsiBidangStudi(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      handleChange("bidangStudiId", data.id)
    }
  }

  const handleDeleteBidangStudi = async (id: string) => {
    const { error } = await deleteBidangStudi(id)
    if (error) alert(error)
    else {
      setOpsiBidangStudi(prev => prev.filter(o => o.id !== id))
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
            Pastikan unit sekolah dan status kepegawaian sesuai dengan SK penugasan terbaru.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Building size={15} className="text-primary" />
            Unit Sekolah Penugasan <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
            value={formData.unitSekolahId || ""} 
            onChange={e => handleChange("unitSekolahId", e.target.value)} 
            required
          >
            <option value="" disabled>-- Pilih Unit Sekolah --</option>
            {schoolUnits.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Award size={15} className="text-primary" />
            Status Kepegawaian <span className="text-red-500">*</span>
          </label>
          {isCustomStatus ? (
            <div className="flex gap-2">
              <Input 
                className="flex-1"
                placeholder="Ketik status baru..."
                value={formData.statusKepegawaian === "LAINNYA" ? "" : formData.statusKepegawaian}
                onChange={e => handleChange("statusKepegawaian", e.target.value)}
                autoFocus
              />
              <button 
                type="button"
                onClick={() => {
                  setIsCustomStatus(false)
                  handleChange("statusKepegawaian", "")
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
              value={currentNormalized} 
              onChange={e => {
                if (e.target.value === "LAINNYA") {
                  setIsCustomStatus(true)
                  handleChange("statusKepegawaian", "")
                } else {
                  handleChange("statusKepegawaian", e.target.value)
                }
              }}
              required
            >
              <option value="">-- Pilih Status Kepegawaian --</option>
              {knownStatuses.map(status => (
                <option key={status as string} value={status as string}>
                  {status as string}
                </option>
              ))}
              <option value="LAINNYA" className="font-bold text-primary">➕ Lainnya (Ketik Sendiri)...</option>
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Briefcase size={15} className="text-primary" />
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
            Status Aktif Tugas
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
            value={formData.isActive === false ? "false" : "true"} 
            onChange={e => handleChange("isActive", e.target.value === "true")}
          >
            <option value="true">Aktif Mengajar / Bertugas</option>
            <option value="false">Tidak Aktif / Non-Aktif / Cuti</option>
          </select>
        </div>
      </div>
    </div>
  )
}
