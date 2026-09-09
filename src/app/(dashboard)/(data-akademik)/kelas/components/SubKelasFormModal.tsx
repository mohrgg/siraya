import { useEffect } from "react"
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
  schoolUnits = [],
  grades = [],
  academicYears = [],
  initialMajors = [],
  initialTeachers = [],
  activeUnitId
}: any) {
  useEffect(() => {
    if (isOpen) {
      const validUnit = (formData.unitSekolahId && formData.unitSekolahId !== "all")
        ? formData.unitSekolahId
        : ((activeUnitId && activeUnitId !== "all") ? activeUnitId : (schoolUnits[0]?.id || ""))
      
      const availableGrades = grades.filter((g: any) => g.unitSekolahId === validUnit)
      const validTingkat = formData.tingkatId || (availableGrades[0]?.id || "")

      const availableMajors = initialMajors.filter((m: any) => m.unitSekolahId === validUnit)
      const validJurusan = formData.jurusanId || (availableMajors[0]?.id || "")

      if (formData.unitSekolahId !== validUnit || formData.tingkatId !== validTingkat || (availableMajors.length > 0 && !formData.jurusanId)) {
        setFormData((prev: any) => ({
          ...prev,
          unitSekolahId: validUnit,
          tingkatId: prev.tingkatId || validTingkat,
          jurusanId: prev.jurusanId || validJurusan
        }))
      }
    }
  }, [isOpen, formData.unitSekolahId, activeUnitId, grades, schoolUnits, initialMajors])

  const isSelectedGuruInList = initialTeachers.some((t: any) => t.id === formData.waliKelasGuruId)
  const teachersForUnit = [
    ...(formData.waliKelasGuruId && !isSelectedGuruInList ? [{
      id: formData.waliKelasGuruId,
      name: `${formData.waliKelas || 'Guru Terpilih'} (Telah Dihapus/Nonaktif)`,
      unitSekolah: { name: "Nonaktif" },
      statusKepegawaian: ""
    }] : []),
    ...initialTeachers.filter((t: any) => t.unitSekolahId === formData.unitSekolahId)
  ].sort((a: any, b: any) => {
    if (a.id === formData.waliKelasGuruId && !isSelectedGuruInList) return -1;
    return a.name.localeCompare(b.name);
  });
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={formData.id ? "Edit Sub Kelas (Rombel)" : "Tambah Sub Kelas (Rombel)"}
      subtitle="Alokasi kelas dan penunjukan Wali Kelas untuk tahun ajaran aktif"
      icon={Users}
        widthClassName="max-w-xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" form="form-subkelas" isLoading={isSubmitting}>Simpan Data</Button>
          </>
        }
      >
        <form id="form-subkelas" onSubmit={onSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Unit Sekolah</label>
          <select 
            required 
            disabled={!!formData.id || (activeUnitId && activeUnitId !== "all")}
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100 disabled:cursor-not-allowed text-text-main"
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
            <label className="block text-sm font-semibold text-text-main mb-1.5">Jurusan</label>
            <select 
              required
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.jurusanId}
              onChange={e => setFormData({ ...formData, jurusanId: e.target.value })}
            >
              <option value="" disabled>-- Pilih Jurusan --</option>
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
              <option key={y.id} value={y.id}>{y.name} {y.isActive ? "(Aktif)" : ""}</option>
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
            value={formData.waliKelasGuruId || ""}
            onChange={e => {
              const val = e.target.value
              if (val === "") {
                setFormData({ ...formData, waliKelasGuruId: "", waliKelas: "", waliKelasPhone: "" })
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
                {t.name} • {t.unitSekolah?.name || "Yayasan"} ({t.nip ? `NIP: ${t.nip}` : (t.statusKepegawaian && t.statusKepegawaian !== "-" ? t.statusKepegawaian : "Guru")})
              </option>
            ))}
          </select>

          {formData.waliKelasGuruId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 opacity-80">
              <div>
                <label className="block text-xs font-medium text-text-main mb-1">Preview Nama di Rapot</label>
                <Input
                  value={formData.waliKelas || ""}
                  disabled
                  className="text-sm bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-main mb-1">Kontak Tersinkron</label>
                <Input
                  value={formData.waliKelasPhone || "Belum ada no. HP"}
                  disabled
                  className="text-sm bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed italic"
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
