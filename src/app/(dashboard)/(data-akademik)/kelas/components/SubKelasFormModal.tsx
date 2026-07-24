import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function SubKelasFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSubmitting,
  schoolUnits,
  grades,
  academicYears,
  initialMajors
}: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? "Edit Sub Kelas" : "Tambah Sub Kelas (Rombel)"}>
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Unit Sekolah</label>
          <select 
            required 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formData.unitSekolahId}
            onChange={e => setFormData({ ...formData, unitSekolahId: e.target.value })}
          >
            {schoolUnits.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Tingkat</label>
          <select 
            required 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formData.tingkatId}
            onChange={e => setFormData({ ...formData, tingkatId: e.target.value })}
          >
            <option value="" disabled>Pilih tingkat...</option>
            {grades.filter((g: any) => g.unitSekolahId === formData.unitSekolahId).map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        
        {initialMajors.filter((m: any) => m.unitSekolahId === formData.unitSekolahId).length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Jurusan (Opsional)</label>
            <select 
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.jurusanId}
              onChange={e => setFormData({ ...formData, jurusanId: e.target.value })}
            >
              <option value="">Tidak ada jurusan</option>
              {initialMajors.filter((m: any) => m.unitSekolahId === formData.unitSekolahId).map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Tahun Akademik</label>
          <select 
            required 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formData.tahunAkademikId}
            onChange={e => setFormData({ ...formData, tahunAkademikId: e.target.value })}
          >
            {academicYears.map((y: any) => (
              <option key={y.id} value={y.id}>{y.name} - {y.isActive ? '(Aktif)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Rombel (Cth: 10-RPL-1)</label>
          <Input 
            required
            placeholder="Masukkan nama rombel"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" isLoading={isSubmitting}>Simpan Data</Button>
        </div>
      </form>
    </Modal>
  )
}
