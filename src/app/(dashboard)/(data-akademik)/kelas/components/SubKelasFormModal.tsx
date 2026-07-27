import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Users } from "lucide-react"

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
  initialMajors,
  initialTeachers = []
}: any) {
  const isSelectedGuruInList = initialTeachers.some((t: any) => t.id === formData.waliKelasGuruId)
  const teachersForUnit = [
    ...(formData.waliKelasGuruId && !isSelectedGuruInList ? [{
      id: formData.waliKelasGuruId,
      name: `${formData.waliKelas || 'Guru Terpilih'} (Telah Dihapus/Nonaktif)`,
      unitSekolah: { name: "Nonaktif" },
      statusKepegawaian: "-"
    }] : []),
    ...initialTeachers
  ].sort((a: any, b: any) => {
    if (a.id === formData.waliKelasGuruId && !isSelectedGuruInList) return -1;
    const aMatch = a.unitSekolahId === formData.unitSekolahId ? -1 : 1;
    const bMatch = b.unitSekolahId === formData.unitSekolahId ? -1 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.name.localeCompare(b.name);
  });
  const isCustomTeacher = !formData.waliKelasGuruId && (formData.waliKelas || formData.waliKelasPhone)
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={formData.id ? "Edit Sub Kelas (Rombel)" : "Tambah Sub Kelas (Rombel)"}
      subtitle="Alokasi kelas dan penunjukan Wali Kelas untuk tahun ajaran aktif"
      icon={Users}
      widthClassName="max-w-xl"
    >
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
              <option value="">-- Umum / Tanpa Jurusan --</option>
              {initialMajors.filter((m: any) => m.unitSekolahId === formData.unitSekolahId).map((m: any) => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Tahun Ajaran</label>
          <select 
            required 
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={formData.tahunAkademikId}
            onChange={e => setFormData({ ...formData, tahunAkademikId: e.target.value })}
          >
            {academicYears.map((y: any) => (
              <option key={y.id} value={y.id}>{y.year} {y.semester} {y.isActive ? "(Aktif)" : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Sub Kelas (Rombel)</label>
          <Input 
            required
            placeholder="Masukkan nama rombel"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="pt-2 border-t border-border mt-1">
          <label className="block text-sm font-semibold text-text-main mb-1.5">Wali Kelas / Pembimbing Akademik</label>
          <select
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm mb-2"
            value={formData.waliKelasGuruId ? formData.waliKelasGuruId : (isCustomTeacher ? "CUSTOM" : "")}
            onChange={e => {
              const val = e.target.value
              if (val === "") {
                setFormData({ ...formData, waliKelasGuruId: "", waliKelas: "", waliKelasPhone: "" })
              } else if (val === "CUSTOM") {
                setFormData({ ...formData, waliKelasGuruId: "" })
              } else {
                const selectedGuru = initialTeachers.find((t: any) => t.id === val)
                if (selectedGuru) {
                  setFormData({
                    ...formData,
                    waliKelasGuruId: selectedGuru.id,
                    waliKelas: selectedGuru.name,
                    waliKelasPhone: selectedGuru.phone || ""
                  })
                }
              }
            }}
          >
            <option value="">-- Belum Dipilih --</option>
            {teachersForUnit.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} • {t.unitSekolah?.name || "Yayasan"} ({t.nip ? `NIP: ${t.nip}` : t.statusKepegawaian})
              </option>
            ))}
            <option value="CUSTOM">+ Ketik Manual (Jika guru belum terdaftar)...</option>
          </select>

          {(!formData.waliKelasGuruId && (isCustomTeacher || formData.waliKelasGuruId === "")) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
              <div>
                <label className="block text-xs font-medium text-text-main mb-1">Nama Wali Kelas</label>
                <Input
                  placeholder="Cth: Bpk. Ahmad Dahlan, S.Pd."
                  value={formData.waliKelas || ""}
                  onChange={e => setFormData({ ...formData, waliKelas: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-main mb-1">No. WhatsApp / Telepon</label>
                <Input
                  placeholder="Cth: 081234567890"
                  value={formData.waliKelasPhone || ""}
                  onChange={e => setFormData({ ...formData, waliKelasPhone: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" isLoading={isSubmitting}>Simpan Data</Button>
        </div>
      </form>
    </Modal>
  )
}
