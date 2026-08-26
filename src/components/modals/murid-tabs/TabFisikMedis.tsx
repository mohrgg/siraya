import { Input } from "@/components/ui/Input"

export default function TabFisikMedis({ formData, handleChange }: any) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Tinggi Badan (cm)</label>
          <Input type="number" placeholder="Contoh: 150" value={formData.height || ""} onChange={e => handleChange("height", parseFloat(e.target.value) || null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Berat Badan (kg)</label>
          <Input type="number" placeholder="Contoh: 45" value={formData.weight || ""} onChange={e => handleChange("weight", parseFloat(e.target.value) || null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Lingkar Kepala (cm)</label>
          <Input type="number" placeholder="Contoh: 50" value={formData.headSize || ""} onChange={e => handleChange("headSize", parseFloat(e.target.value) || null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Golongan Darah</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.bloodType || ""} onChange={e => handleChange("bloodType", e.target.value)}>
            <option value="">-- Pilih --</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
        </div>
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 pt-2">
          <label className="text-sm font-semibold text-text-main">Riwayat Penyakit (Khusus/Alergi)</label>
          <textarea 
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium resize-y" 
            rows={4} 
            placeholder="Contoh: Asma, alergi debu, dll. Kosongkan jika tidak ada." 
            value={formData.medicalHistory || ""} 
            onChange={e => handleChange("medicalHistory", e.target.value)} 
          />
        </div>
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-sm font-semibold text-text-main">Penyakit Bawaan / Kronis (Opsional)</label>
          <Input placeholder="Contoh: Asma, Jantung, dll." value={formData.disease || ""} onChange={e => handleChange("disease", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-sm font-semibold text-text-main">Kelainan Fisik / Disabilitas (Opsional)</label>
          <Input placeholder="Contoh: Tunanetra, Tunarungu, dll." value={formData.abnormality || ""} onChange={e => handleChange("abnormality", e.target.value)} />
        </div>
      </div>
    </div>
  )
}
