import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Sparkles, HelpCircle, Layers } from "lucide-react"

const getPresetsForUnit = (unitLevel?: string) => {
  const lvl = (unitLevel || "").toUpperCase()
  if (lvl === "SMA" || lvl === "SMK" || lvl === "MA") {
    return [
      { name: "Kelas X", order: 10 },
      { name: "Kelas XI", order: 11 },
      { name: "Kelas XII", order: 12 },
    ]
  }
  if (lvl === "SMP" || lvl === "MTS") {
    return [
      { name: "Kelas 7", order: 7 },
      { name: "Kelas 8", order: 8 },
      { name: "Kelas 9", order: 9 },
    ]
  }
  if (lvl === "SD" || lvl === "MI") {
    return [
      { name: "Kelas 1", order: 1 },
      { name: "Kelas 2", order: 2 },
      { name: "Kelas 3", order: 3 },
      { name: "Kelas 4", order: 4 },
      { name: "Kelas 5", order: 5 },
      { name: "Kelas 6", order: 6 },
    ]
  }
  if (lvl === "TK" || lvl === "RA" || lvl === "PAUD" || lvl === "KB" || lvl === "PLAYGROUP") {
    return [
      { name: "TK A", order: 1 },
      { name: "TK B", order: 2 },
      { name: "Playgroup / KB", order: 1 },
    ]
  }
  // Default fallback if unknown level
  return [
    { name: "Kelas 1", order: 1 },
    { name: "Kelas 2", order: 2 },
    { name: "Kelas 3", order: 3 },
    { name: "Kelas 4", order: 4 },
    { name: "Kelas 5", order: 5 },
    { name: "Kelas 6", order: 6 },
    { name: "Kelas 7", order: 7 },
    { name: "Kelas 8", order: 8 },
    { name: "Kelas 9", order: 9 },
    { name: "Kelas 10 / X", order: 10 },
    { name: "Kelas 11 / XI", order: 11 },
    { name: "Kelas 12 / XII", order: 12 },
  ]
}

export default function TingkatFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSubmitting,
  schoolUnits
}: any) {
  const selectedUnit = schoolUnits?.find((u: any) => u.id === formData.unitSekolahId) || schoolUnits?.[0]
  const presets = getPresetsForUnit(selectedUnit?.level)

  const [isCustom, setIsCustom] = useState(false)

  // Reset or detect custom mode when modal opens or unit changes
  useEffect(() => {
    if (isOpen) {
      if (formData.id && formData.name) {
        const match = presets.some(p => p.name === formData.name)
        setIsCustom(!match)
      } else {
        setIsCustom(false)
        // If creating new and name is empty, initialize with first preset
        if (!formData.name && presets[0]) {
          setFormData({
            ...formData,
            unitSekolahId: formData.unitSekolahId || selectedUnit?.id || "",
            name: presets[0].name,
            order: presets[0].order
          })
        }
      }
    }
  }, [isOpen, formData.id, formData.unitSekolahId])

  const handlePresetChange = (val: string) => {
    if (val === "__CUSTOM__") {
      setIsCustom(true)
      setFormData({ ...formData, name: "", order: presets.length + 1 })
    } else {
      const found = presets.find(p => p.name === val)
      if (found) {
        setIsCustom(false)
        setFormData({ ...formData, name: found.name, order: found.order })
      }
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={formData.id ? "Edit Tingkat" : "Tambah Tingkat Baru"}
      subtitle="Manajemen tingkatan kelas sesuai kurikulum unit sekolah"
      icon={Layers}
    >
      <form onSubmit={onSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">Unit Sekolah</label>
          <select 
            required 
            disabled={!!formData.id}
            className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium text-text-main"
            value={formData.unitSekolahId}
            onChange={e => {
              const newUnitId = e.target.value
              const newUnit = schoolUnits.find((u: any) => u.id === newUnitId)
              const newPresets = getPresetsForUnit(newUnit?.level)
              setFormData({ 
                ...formData, 
                unitSekolahId: newUnitId,
                name: !isCustom && newPresets[0] ? newPresets[0].name : formData.name,
                order: !isCustom && newPresets[0] ? newPresets[0].order : formData.order
              })
            }}
          >
            {schoolUnits?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name} ({u.level || "Umum"})</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-text-main">Nama Tingkat</label>
            {isCustom && (
              <button 
                type="button" 
                onClick={() => {
                  setIsCustom(false)
                  if (presets[0]) setFormData({ ...formData, name: presets[0].name, order: presets[0].order })
                }}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} />
                Pilih dari Preset Standar
              </button>
            )}
          </div>

          {!isCustom ? (
            <select
              required
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium text-text-main"
              value={formData.name || ""}
              onChange={e => handlePresetChange(e.target.value)}
            >
              <option value="" disabled>-- Pilih Tingkat Standar --</option>
              {presets.map((p, idx) => (
                <option key={idx} value={p.name}>
                  {p.name} (Urutan Jenjang #{p.order})
                </option>
              ))}
              <option value="__CUSTOM__" className="font-bold text-primary">
                + Buat Tingkat Custom Lainnya...
              </option>
            </select>
          ) : (
            <Input 
              required
              placeholder="Contoh: Kelas Akselerasi, Kelas Khusus..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          )}
        </div>

        {/* Kolom Order */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-text-main flex items-center gap-1.5">
              Urutan Logis (Order)
              <span className="text-gray-400 cursor-help" title="Angka penentu urutan kenaikan kelas & tampilan grafik (1 = terendah, 12 = tertinggi)">
                <HelpCircle size={14} />
              </span>
            </label>
            {!isCustom && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Otomatis dari Preset
              </span>
            )}
          </div>
          <Input 
            type="number"
            required
            min="1"
            disabled={!isCustom}
            className={!isCustom ? "bg-gray-100 text-gray-500 font-bold cursor-not-allowed" : "font-bold"}
            placeholder="1"
            value={formData.order}
            onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
          />
          <p className="text-[11px] text-text-muted mt-1">
            {!isCustom 
              ? "Angka jenjang diatur otomatis berdasarkan standar nasional pendidikan Indonesia."
              : "Tentukan angka jenjang secara manual. Tingkat dengan angka lebih kecil dianggap lebih muda/rendah."
            }
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" isLoading={isSubmitting}>Simpan Data</Button>
        </div>
      </form>
    </Modal>
  )
}
