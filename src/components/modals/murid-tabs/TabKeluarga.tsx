import { Input } from "@/components/ui/Input"

const INCOME_RANGES = [
  "Kurang dari Rp 1.000.000",
  "Rp 1.000.000 - Rp 3.000.000",
  "Rp 3.000.000 - Rp 5.000.000",
  "Rp 5.000.000 - Rp 10.000.000",
  "Lebih dari Rp 10.000.000",
  "Tidak Berpenghasilan"
]

export default function TabKeluarga({ formData, handleChange }: any) {
  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      
      {/* Alamat & Kontak */}
      <div className="bg-gray-50/50 p-4 rounded-xl border border-border space-y-4">
        <h4 className="font-bold text-sm text-text-main">Data Kontak & Alamat Keluarga</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">No WhatsApp Siswa</label>
            <Input placeholder="08..." value={formData.phone || ""} onChange={e => handleChange("phone", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">No Telepon/WA Orang Tua</label>
            <Input placeholder="08..." value={formData.parentPhone || ""} onChange={e => handleChange("parentPhone", e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Alamat Email</label>
            <Input type="email" placeholder="contoh@email.com" value={formData.email || ""} onChange={e => handleChange("email", e.target.value)} />
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Alamat Jalan</label>
            <Input placeholder="Nama jalan, blok, nomor rumah..." value={formData.address || ""} onChange={e => handleChange("address", e.target.value)} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">RT</label>
              <Input placeholder="001" value={formData.rt || ""} onChange={e => handleChange("rt", e.target.value)} maxLength={5} />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">RW</label>
              <Input placeholder="002" value={formData.rw || ""} onChange={e => handleChange("rw", e.target.value)} maxLength={5} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Kelurahan / Desa</label>
            <Input placeholder="Kelurahan" value={formData.village || ""} onChange={e => handleChange("village", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Kecamatan</label>
            <Input placeholder="Kecamatan" value={formData.district || ""} onChange={e => handleChange("district", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Kode Pos</label>
            <Input placeholder="12345" value={formData.postalCode || ""} onChange={e => handleChange("postalCode", e.target.value)} maxLength={10} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ayah */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-text-main border-b border-border pb-2">Data Ayah Kandung</h4>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Nama Ayah</label><Input value={formData.fatherName || ""} onChange={e => handleChange("fatherName", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Tahun Lahir</label><Input placeholder="1980" value={formData.fatherBirthYear || ""} onChange={e => handleChange("fatherBirthYear", e.target.value)} maxLength={4} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">NIK</label><Input value={formData.fatherNik || ""} onChange={e => handleChange("fatherNik", e.target.value)} maxLength={16} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Pendidikan</label><Input value={formData.fatherEducation || ""} onChange={e => handleChange("fatherEducation", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Pekerjaan</label><Input value={formData.fatherOccupation || ""} onChange={e => handleChange("fatherOccupation", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Penghasilan</label>
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.fatherIncome || ""} onChange={e => handleChange("fatherIncome", e.target.value)}>
              <option value="">-- Pilih --</option>
              {INCOME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Ibu */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-text-main border-b border-border pb-2">Data Ibu Kandung</h4>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Nama Ibu</label><Input value={formData.motherName || ""} onChange={e => handleChange("motherName", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Tahun Lahir</label><Input placeholder="1985" value={formData.motherBirthYear || ""} onChange={e => handleChange("motherBirthYear", e.target.value)} maxLength={4} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">NIK</label><Input value={formData.motherNik || ""} onChange={e => handleChange("motherNik", e.target.value)} maxLength={16} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Pendidikan</label><Input value={formData.motherEducation || ""} onChange={e => handleChange("motherEducation", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Pekerjaan</label><Input value={formData.motherOccupation || ""} onChange={e => handleChange("motherOccupation", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Penghasilan</label>
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.motherIncome || ""} onChange={e => handleChange("motherIncome", e.target.value)}>
              <option value="">-- Pilih --</option>
              {INCOME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      {/* Wali */}
      <div className="bg-gray-50/50 p-4 rounded-xl border border-border space-y-4">
        <h4 className="font-bold text-sm text-text-main border-b border-border pb-2">Data Wali (Opsional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Nama Wali</label><Input value={formData.guardianName || ""} onChange={e => handleChange("guardianName", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Tahun Lahir</label><Input placeholder="1980" value={formData.guardianBirthYear || ""} onChange={e => handleChange("guardianBirthYear", e.target.value)} maxLength={4} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">NIK</label><Input value={formData.guardianNik || ""} onChange={e => handleChange("guardianNik", e.target.value)} maxLength={16} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Pendidikan</label><Input value={formData.guardianEducation || ""} onChange={e => handleChange("guardianEducation", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-text-muted">Pekerjaan</label><Input value={formData.guardianOccupation || ""} onChange={e => handleChange("guardianOccupation", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">Penghasilan</label>
            <select className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm" value={formData.guardianIncome || ""} onChange={e => handleChange("guardianIncome", e.target.value)}>
              <option value="">-- Pilih --</option>
              {INCOME_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted">No. Telepon / WA Wali</label>
            <Input placeholder="08..." value={formData.guardianPhone || ""} onChange={e => handleChange("guardianPhone", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
