import React from "react"
import { GraduationCap, BookOpen, Award } from "lucide-react"
import { Input } from "@/components/ui/Input"

export default function TabPendidikan({ formData, handleChange }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-main">Kualifikasi Akademik & Pendidikan</h4>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Rekam jejak pendidikan terakhir untuk keperluan pelaporan akreditasi dan data pengajar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <GraduationCap size={15} className="text-primary" />
            Pendidikan Terakhir
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
            value={formData.pendidikan || "S1"} 
            onChange={e => handleChange("pendidikan", e.target.value)}
          >
            <option value="S3">S3 / Doktor</option>
            <option value="S2">S2 / Magister</option>
            <option value="S1">S1 / Sarjana</option>
            <option value="D4">D4 / Diploma IV</option>
            <option value="D3">D3 / Diploma III</option>
            <option value="SMA/SMK">SMA / SMK Sederajat</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Award size={15} className="text-primary" />
            Gelar Akademik Utama
          </label>
          <Input 
            placeholder="Cth: S.Pd. / M.Pd. / Lc. / S.Kom." 
            value={formData.gelar || (formData.name?.includes(",") ? formData.name.split(",").slice(1).join(", ").trim() : "")} 
            onChange={e => handleChange("gelar", e.target.value)} 
          />
          <span className="text-[11px] text-text-muted">Gelar spesifik yang relevan dengan tugas mengajar.</span>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <BookOpen size={15} className="text-primary" />
            Catatan Sertifikasi / Kualifikasi Tambahan (Opsional)
          </label>
          <Input 
            placeholder="Cth: Sertifikasi Guru Profesional (Serdik) 2021 / Pelatihan Kurikulum Merdeka" 
            value={formData.catatanKualifikasi || ""} 
            onChange={e => handleChange("catatanKualifikasi", e.target.value)} 
          />
          <span className="text-[11px] text-text-muted">Dapat disiapkan untuk dokumentasi riwayat pelatihan atau sertifikasi pendidik.</span>
        </div>
      </div>
    </div>
  )
}
