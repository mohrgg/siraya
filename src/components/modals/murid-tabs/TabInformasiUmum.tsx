import { Input } from "@/components/ui/Input"

export default function TabInformasiUmum({ formData, handleChange, schoolUnits, classrooms }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
          <label className="text-sm font-semibold text-text-main">NISN (10 Digit)</label>
          <Input placeholder="Contoh: 0012345678" value={formData.nisn || ""} onChange={e => handleChange("nisn", e.target.value)} maxLength={10} />
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
        <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 pt-2">
          <h4 className="text-sm font-bold text-text-main border-b border-border pb-1 mb-1">Informasi Registrasi Lainnya</h4>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Asal Sekolah</label>
          <Input placeholder="Nama TK/SD/SMP sebelumnya" value={formData.previousSchool || ""} onChange={e => handleChange("previousSchool", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">No Formulir (Opsional)</label>
          <Input placeholder="Contoh: REG-2024-001" value={formData.formNo || ""} onChange={e => handleChange("formNo", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Username Akun Portal</label>
          <Input placeholder="Belum tersedia" value={formData.username || ""} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Password Portal</label>
          <Input type="password" placeholder="Belum tersedia" value={formData.password || ""} disabled />
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
