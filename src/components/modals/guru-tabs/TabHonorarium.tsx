import React from "react"
import { CreditCard, Landmark, DollarSign, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/Input"

export default function TabHonorarium({ formData, handleChange }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <CreditCard size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-main">Informasi Perbankan & Honorarium (Opsional)</h4>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Data rekening bank disimpan dengan aman untuk persiapan fitur otomatisasi pembayaran gaji dan honorarium guru/staf di masa depan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <Landmark size={15} className="text-primary" />
            Nama Bank
          </label>
          <Input 
            placeholder="Cth: BSI / BCA / BRI / Bank Mandiri" 
            value={formData.bankName || ""} 
            onChange={e => handleChange("bankName", e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <CreditCard size={15} className="text-primary" />
            Nomor Rekening Bank
          </label>
          <Input 
            placeholder="Cth: 7123456789" 
            value={formData.bankAccount || ""} 
            onChange={e => handleChange("bankAccount", e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-primary" />
            Atas Nama Rekening (Sesuai Buku Tabungan)
          </label>
          <Input 
            placeholder="Cth: Ahmad Dahlan" 
            value={formData.bankAccountName || formData.name || ""} 
            onChange={e => handleChange("bankAccountName", e.target.value)} 
          />
          <span className="text-[11px] text-text-muted">Pastikan nama pemilik rekening sama agar transaksi transfer berjalan lancar.</span>
        </div>
      </div>
    </div>
  )
}
