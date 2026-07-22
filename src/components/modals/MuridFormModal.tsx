"use client"
import { useState, useEffect, useRef } from "react"
import { X, User, Users, HeartPulse, GraduationCap, MapPin, Loader2, Save, Upload, Camera } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { toast } from "sonner"

interface MuridFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData: any
  schoolUnits: any[]
  classrooms: any[]
}

const TABS = [
  { id: "utama", label: "Informasi Utama", icon: GraduationCap },
  { id: "pribadi", label: "Identitas Pribadi", icon: User },
  { id: "pendidikan", label: "Pendidikan & Periodik", icon: MapPin },
  { id: "keluarga", label: "Data Keluarga", icon: Users },
  { id: "kesehatan", label: "Riwayat Kesehatan", icon: HeartPulse },
]

const INCOME_RANGES = [
  "Kurang dari Rp 1.000.000",
  "Rp 1.000.000 - Rp 3.000.000",
  "Rp 3.000.000 - Rp 5.000.000",
  "Rp 5.000.000 - Rp 10.000.000",
  "Lebih dari Rp 10.000.000",
  "Tidak Berpenghasilan"
]

export default function MuridFormModal({ isOpen, onClose, onSave, initialData, schoolUnits, classrooms }: MuridFormModalProps) {
  const [activeTab, setActiveTab] = useState("utama")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        // Ensure nested values like riwayatKelas are extracted correctly if editing
        subKelasId: initialData.subKelasId || initialData.riwayatKelas?.[0]?.subKelasId || "",
      })
      setActiveTab("utama")
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

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
      toast.success("Foto berhasil diunggah")
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah foto")
    } finally {
      setIsUploading(false)
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderUtama = () => (
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
          <label className="text-sm font-semibold text-text-main">NIS (Nomor Induk Siswa) <span className="text-red-500">*</span></label>
          <Input placeholder="Contoh: 20240101" value={formData.nis || ""} onChange={e => handleChange("nis", e.target.value)} required />
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
            <option value="DO">Drop Out (DO)</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderPribadi = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Nama Panggilan</label>
          <Input placeholder="Nama Panggilan" value={formData.nickname || ""} onChange={e => handleChange("nickname", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">NISN (10 Digit)</label>
          <Input placeholder="Contoh: 0012345678" value={formData.nisn || ""} onChange={e => handleChange("nisn", e.target.value)} maxLength={10} />
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
          <label className="text-sm font-semibold text-text-main">Tempat Lahir</label>
          <Input placeholder="Kota/Kabupaten" value={formData.birthPlace || ""} onChange={e => handleChange("birthPlace", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Tanggal Lahir</label>
          <Input type="date" value={formData.birthDate ? formData.birthDate.split('T')[0] : ""} onChange={e => handleChange("birthDate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Jenis Kelamin</label>
          <select className="w-full px-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium" value={formData.gender || ""} onChange={e => handleChange("gender", e.target.value)}>
            <option value="">-- Pilih --</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
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

  const renderPendidikan = () => (
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

  const renderKeluarga = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
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
    </div>
  )

  const renderKesehatan = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Riwayat Penyakit (Khusus/Alergi)</label>
          <textarea 
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main font-medium resize-y" 
            rows={4} 
            placeholder="Contoh: Asma, alergi debu, dll. Kosongkan jika tidak ada." 
            value={formData.medicalHistory || ""} 
            onChange={e => handleChange("medicalHistory", e.target.value)} 
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-albas-green m-0">
              {formData.id ? "Edit Data Profil Murid" : "Tambah Murid Baru"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Kelengkapan data profil sesuai standar Dapodik.</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        
        {/* Body Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 md:w-64 border-r border-border bg-gray-50/50 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left
                    ${isActive ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-white hover:text-text-main hover:shadow-sm'}`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-text-muted'} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
              <form id="muridForm" onSubmit={handleSubmit}>
                {activeTab === "utama" && renderUtama()}
                {activeTab === "pribadi" && renderPribadi()}
                {activeTab === "pendidikan" && renderPendidikan()}
                {activeTab === "keluarga" && renderKeluarga()}
                {activeTab === "kesehatan" && renderKesehatan()}
              </form>
            </div>
            
            {/* Footer Form Actions */}
            <div className="p-5 border-t border-border bg-gray-50/50 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" form="muridForm" isLoading={isSubmitting} className="flex items-center gap-2">
                <Save size={16} /> {formData.id ? "Simpan Perubahan" : "Simpan Data Murid"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
