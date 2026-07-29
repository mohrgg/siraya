import { useRef, useState } from "react"
import { User, Camera, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import toast from "react-hot-toast"

export default function TabUtama({ formData, handleChange, schoolUnits, classrooms }: any) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran maksimal file adalah 2MB")
      return
    }

    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("folder", "murid")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      })

      if (!res.ok) {
        throw new Error("Gagal mengunggah foto")
      }

      const { url } = await res.json()
      handleChange("photoUrl", url)
      toast.success("Foto profil berhasil diunggah")
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah foto")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Avatar Uploader Section */}
      <div className="flex items-center gap-6 p-4 bg-gray-50/50 rounded-xl border border-border">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center">
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-gray-300" />
            )}
            
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
              <span className="text-[10px] font-bold mt-1">{isUploading ? 'Mengunggah...' : 'Ubah Foto'}</span>
              <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleUploadPhoto} disabled={isUploading} />
            </label>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-sm text-text-main mb-1">Pas Foto Profil</h4>
          <p className="text-xs text-text-muted max-w-sm mb-3 leading-relaxed">
            Unggah foto profil siswa (Rasio 3:4 / Persegi). Format JPG/PNG maksimal 2MB. Foto ini akan muncul di aplikasi dan rapor.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload size={14} className="mr-1.5" /> {formData.photoUrl ? 'Ganti Foto' : 'Unggah Foto'}
            </Button>
            {formData.photoUrl && (
              <Button type="button" size="sm" variant="danger" onClick={() => handleChange("photoUrl", null)}>
                Hapus
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Nama Lengkap (Sesuai Akta) <span className="text-red-500">*</span></label>
          <Input placeholder="Nama Lengkap" value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Unit Sekolah <span className="text-red-500">*</span></label>
          <select 
            className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" 
            value={formData.unitSekolahId || ""} 
            onChange={e => handleChange("unitSekolahId", e.target.value)} 
            required
          >
            <option value="" disabled>-- Pilih Unit --</option>
            {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Rombel (Sub Kelas)</label>
          <select 
            className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" 
            value={formData.subKelasId || ""} 
            onChange={e => handleChange("subKelasId", e.target.value)}
          >
            <option value="">-- Belum ada kelas --</option>
            {classrooms.filter((c: any) => c.unitSekolahId === formData.unitSekolahId).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">NIS (Nomor Induk Siswa) <span className="text-gray-400 font-normal">(Opsional)</span></label>
          <Input placeholder="Contoh: 20240101 atau -" value={formData.nis || ""} onChange={e => handleChange("nis", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Jalur Beasiswa?</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.isScholarship ? "true" : "false"} onChange={e => handleChange("isScholarship", e.target.value === "true")}>
            <option value="false">TIDAK</option>
            <option value="true">YA</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Status Siswa</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.status || "AKTIF"} onChange={e => handleChange("status", e.target.value)}>
            <option value="AKTIF">Aktif</option>
            <option value="LULUS">Lulus</option>
            <option value="PINDAH">Pindah</option>
            <option value="KELUAR">Keluar (Drop Out)</option>
            <option value="CUTI">Cuti</option>
          </select>
        </div>
      </div>
    </div>
  )
}
