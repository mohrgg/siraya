import React from "react"
import { User, Phone, Mail, UserCheck } from "lucide-react"
import { Input } from "@/components/ui/Input"

export default function TabPribadi({ formData, handleChange }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <User size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-main">Identitas Diri & Kontak Komunikasi</h4>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Data ini digunakan untuk komunikasi resmi sekolah serta fitur Klik-ke-Chat WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <User size={15} className="text-primary" />
            Nama Lengkap beserta Gelar <span className="text-red-500">*</span>
          </label>
          <Input 
            placeholder="Cth: Bpk. Ahmad Dahlan, S.Pd., M.Pd." 
            value={formData.name || ""} 
            onChange={e => handleChange("name", e.target.value)} 
            required 
          />
          <span className="text-[11px] text-text-muted">Tuliskan nama lengkap dengan gelar depan/belakang jika ada untuk dokumen resmi.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <UserCheck size={15} className="text-primary" />
            Jenis Kelamin <span className="text-red-500">*</span>
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium text-sm transition-all" 
            value={formData.gender || "Laki-laki"} 
            onChange={e => handleChange("gender", e.target.value)}
            required
          >
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Phone size={15} className="text-primary" />
            No. WhatsApp / Telepon
          </label>
          <Input 
            placeholder="Cth: 081234567890" 
            value={formData.phone || ""} 
            onChange={e => handleChange("phone", e.target.value)} 
          />
          <span className="text-[11px] text-text-muted">Nomor ini akan dihubungkan ke fitur chat WhatsApp otomatis.</span>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Mail size={15} className="text-primary" />
            Alamat Email (Opsional)
          </label>
          <Input 
            type="email"
            placeholder="Cth: ahmad.dahlan@siraya.sch.id" 
            value={formData.email || ""} 
            onChange={e => handleChange("email", e.target.value)} 
          />
        </div>
      </div>
    </div>
  )
}
