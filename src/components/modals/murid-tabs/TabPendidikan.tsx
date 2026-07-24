import { Input } from "@/components/ui/Input"

export default function TabPendidikan({ formData, handleChange }: any) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Asal Sekolah</label>
          <Input placeholder="Nama TK/SD/SMP sebelumnya" value={formData.previousSchool || ""} onChange={e => handleChange("previousSchool", e.target.value)} />
        </div>
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
          <label className="text-sm font-semibold text-text-main">Jarak Tempuh ke Sekolah</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.distanceToSchool || ""} onChange={e => handleChange("distanceToSchool", e.target.value)}>
            <option value="">-- Pilih --</option>
            <option value="< 1 km">Kurang dari 1 km</option>
            <option value="1 - 3 km">1 - 3 km</option>
            <option value="3 - 5 km">3 - 5 km</option>
            <option value="5 - 10 km">5 - 10 km</option>
            <option value="> 10 km">Lebih dari 10 km</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Waktu Tempuh</label>
          <Input placeholder="Contoh: 15 Menit" value={formData.travelTime || ""} onChange={e => handleChange("travelTime", e.target.value)} />
        </div>
      </div>
    </div>
  )
}
