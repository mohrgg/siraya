import React from "react"
import { Building, Award, Briefcase, Hash, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/Input"

export default function TabKepegawaian({ formData, handleChange, schoolUnits }: any) {
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
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
            value={formData.statusKepegawaian || "GTY"} 
            onChange={e => handleChange("statusKepegawaian", e.target.value)}
            required
          >
            <option value="GTY">GTY (Guru Tetap Yayasan)</option>
            <option value="GTT">GTT (Honorer / Tidak Tetap)</option>
            <option value="PNS">PNS / DPK</option>
            <option value="Staf TU">Staf Tata Usaha</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Briefcase size={15} className="text-primary" />
            Bidang Studi / Tugas Mengajar Utama
          </label>
          <Input 
            placeholder="Cth: Guru Kelas 1 / Guru Matematika & Fisika / Staf Administrasi" 
            value={formData.bidangStudi || ""} 
            onChange={e => handleChange("bidangStudi", e.target.value)} 
          />
          <span className="text-[11px] text-text-muted">Jelaskan mata pelajaran yang diampu atau tanggung jawab administrasi.</span>
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
