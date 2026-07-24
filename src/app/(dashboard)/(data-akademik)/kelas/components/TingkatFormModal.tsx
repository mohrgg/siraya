import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function TingkatFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSubmitting,
  schoolUnits
}: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formData.id ? "Edit Tingkat" : "Tambah Tingkat Baru"}>
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
          <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Tingkat (Cth: Kelas 10, X)</label>
          <Input 
            required
            placeholder="Masukkan nama tingkat"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Urutan (Order)</label>
          <Input 
            type="number"
            required
            min="1"
            placeholder="1"
            value={formData.order}
            onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
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
