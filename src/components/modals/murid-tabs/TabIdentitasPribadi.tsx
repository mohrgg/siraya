import { Input } from "@/components/ui/Input"

export default function TabIdentitasPribadi({ formData, handleChange }: any) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Nama Panggilan</label>
          <Input placeholder="Nama Panggilan" value={formData.nickname || ""} onChange={e => handleChange("nickname", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">NIK (16 Digit Sesuai KK)</label>
          <Input placeholder="Contoh: 3201..." value={formData.nik || ""} onChange={e => handleChange("nik", e.target.value)} maxLength={16} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Agama</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.religion || ""} onChange={e => handleChange("religion", e.target.value)}>
            <option value="">-- Pilih Agama --</option>
            <option value="Islam">Islam</option>
            <option value="Kristen">Kristen</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Jenis Kelamin</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.gender || ""} onChange={e => handleChange("gender", e.target.value)}>
            <option value="">-- Pilih --</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Tempat Lahir</label>
          <Input placeholder="Kota/Kabupaten" value={formData.birthPlace || ""} onChange={e => handleChange("birthPlace", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Tanggal Lahir</label>
          <Input 
            type="date" 
            value={
              formData.birthDate 
                ? (typeof formData.birthDate === 'string' 
                    ? formData.birthDate.split('T')[0] 
                    : formData.birthDate instanceof Date 
                      ? formData.birthDate.toISOString().split('T')[0] 
                      : "") 
                : ""
            } 
            onChange={e => handleChange("birthDate", e.target.value)} 
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Anak ke-</label>
            <Input type="number" min="1" value={formData.childOrder || ""} onChange={e => handleChange("childOrder", parseInt(e.target.value) || null)} />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Dari bersaudara</label>
            <Input type="number" min="1" value={formData.siblingCount || ""} onChange={e => handleChange("siblingCount", parseInt(e.target.value) || null)} />
          </div>
        </div>
      </div>
    </div>
  )
}
