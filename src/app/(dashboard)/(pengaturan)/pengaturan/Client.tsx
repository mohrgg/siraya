"use client"

import { useState } from "react"
import { Building2, Landmark, Database, Save, Plus, Trash2, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import { upsertPengaturan } from "@/actions/pengaturan"

export default function PengaturanClient({ initialSettings, units = [] }: { initialSettings: any, units?: any[] }) {
  const [activeTab, setActiveTab] = useState<"profil" | "rekening" | "backup">("profil")
  const [activeUnitTab, setActiveUnitTab] = useState<string>("GLOBAL")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    ...initialSettings,
    rekeningBank: initialSettings.rekeningBank ? JSON.parse(initialSettings.rekeningBank) : []
  })
  
  // State per unit
  const [unitData, setUnitData] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {}
    units.forEach(u => {
      initialState[u.id] = { ...u }
    })
    return initialState
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (activeTab === "profil" && activeUnitTab !== "GLOBAL") {
      setUnitData(prev => ({
        ...prev,
        [activeUnitTab]: {
          ...prev[activeUnitTab],
          [name]: value
        }
      }))
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }))
    }
  }

  const handleAddRekening = () => {
    setFormData((prev: any) => ({
      ...prev,
      rekeningBank: [...prev.rekeningBank, { bankName: "", accountNumber: "", accountName: "" }]
    }))
  }

  const handleRemoveRekening = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      rekeningBank: prev.rekeningBank.filter((_: any, i: number) => i !== index)
    }))
  }

  const handleRekeningChange = (index: number, field: string, value: string) => {
    const updated = [...formData.rekeningBank]
    updated[index] = { ...updated[index], [field]: value }
    setFormData((prev: any) => ({ ...prev, rekeningBank: updated }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    const toastId = toast.loading("Menyimpan pengaturan...")
    
    try {
      if (activeTab === "profil" && activeUnitTab !== "GLOBAL") {
        const { updateUnitSekolahKop } = await import("@/actions/pengaturan")
        const currentUnit = unitData[activeUnitTab]
        const result = await updateUnitSekolahKop(activeUnitTab, currentUnit)
        if (result.success) {
          toast.success(`Pengaturan kop surat unit berhasil disimpan!`, { id: toastId })
        } else {
          throw new Error(result.error)
        }
        return
      }

      const payload = {
        ...formData,
        rekeningBank: JSON.stringify(formData.rekeningBank)
      }
      
      const result = await upsertPengaturan(payload)
      
      if (result.success) {
        toast.success("Pengaturan berhasil disimpan!", { id: toastId })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan pengaturan", { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackup = () => {
    toast.success("Fitur backup database akan segera hadir!")
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Pengaturan Sistem</h1>
          <p className="text-text-muted">Kelola identitas yayasan, format penomoran, rekening, dan pencadangan data.</p>
        </div>
        
        {activeTab !== "backup" && (
          <Button onClick={handleSave} disabled={isSubmitting}>
            <Save size={16} className="mr-2" />
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 bg-bg rounded-xl p-1.5 w-max">
        <button 
          onClick={() => setActiveTab("profil")} 
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "profil" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text-main"}`}
        >
          <Building2 size={16} /> Identitas & Kop Surat
        </button>
        <button 
          onClick={() => setActiveTab("rekening")} 
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "rekening" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text-main"}`}
        >
          <Landmark size={16} /> Rekening & Penomoran
        </button>
        <button 
          onClick={() => setActiveTab("backup")} 
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "backup" ? "bg-surface shadow-sm text-primary" : "text-text-muted hover:text-text-main"}`}
        >
          <Database size={16} /> Backup Data
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8">
        
        {/* TAB 1: IDENTITAS */}
        {activeTab === "profil" && (
          <div className="space-y-6">
            
            {/* SUB-TABS UNTUK UNIT SEKOLAH */}
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setActiveUnitTab("GLOBAL")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeUnitTab === "GLOBAL" 
                  ? "bg-primary text-white shadow-sm" 
                  : "bg-surface border border-border text-text-muted hover:bg-gray-50"
                }`}
              >
                YAYASAN (GLOBAL)
              </button>
              {units.map((unit: any) => (
                <button
                  key={unit.id}
                  onClick={() => setActiveUnitTab(unit.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeUnitTab === unit.id 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-surface border border-border text-text-muted hover:bg-gray-50"
                  }`}
                >
                  KOP: {unit.name}
                </button>
              ))}
            </div>

            {activeUnitTab === "GLOBAL" ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                    <h2 className="text-lg font-bold text-text-main">Kop Surat Yayasan</h2>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3 text-blue-800 text-sm">
                    <Info size={20} className="shrink-0 mt-0.5 text-blue-600" />
                    <p>
                      <strong>Informasi Penggunaan:</strong> Data Identitas Yayasan ini bertindak sebagai <b>Kop Utama (Baris Teratas)</b> untuk semua dokumen cetak sistem, termasuk tabel Laporan Keuangan, Data Siswa, dan Header Kwitansi Pembayaran.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Yayasan/Lembaga</label>
                  <input type="text" name="namaYayasan" value={formData.namaYayasan} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Contoh: Yayasan Pendidikan Al Basyariah" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">URL Logo</label>
                  <input type="text" name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="/logo.png atau URL eksternal" />
                  <p className="text-xs text-text-muted mt-1">Digunakan untuk kop surat cetak PDF & Kwitansi.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Alamat Lengkap</label>
                  <textarea name="alamat" value={formData.alamat} onChange={handleChange} rows={2} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Alamat lengkap yayasan..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Nomor Telepon</label>
                  <input type="text" name="telepon" value={formData.telepon || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Email / Website</label>
                  <div className="flex gap-2">
                    <input type="text" name="email" value={formData.email || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Email" />
                    <input type="text" name="website" value={formData.website || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Website" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2">Footer & Penandatangan Cetak</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex gap-3 text-slate-700 text-sm">
                <Info size={20} className="shrink-0 mt-0.5 text-slate-500" />
                <p>
                  <strong>Catatan Cetak:</strong> Nama Bendahara akan secara otomatis dibubuhkan pada bagian bawah kanan (kolom tanda tangan) pada dokumen cetak <b>Kwitansi Pembayaran Resi</b>.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Kepala TU</label>
                  <input type="text" name="namaKepalaTU" value={formData.namaKepalaTU || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nama pejabat tata usaha" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Bendahara</label>
                  <input type="text" name="namaBendahara" value={formData.namaBendahara || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nama bendahara yayasan" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Catatan di Kwitansi</label>
                  <textarea name="catatanKwitansi" value={formData.catatanKwitansi || ""} onChange={handleChange} rows={2} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Contoh: Pembayaran yang sudah dilakukan tidak dapat ditarik kembali..."></textarea>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2">Identitas Unit: {unitData[activeUnitTab]?.name}</h2>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex gap-3 text-emerald-800 text-sm">
                  <Info size={20} className="shrink-0 mt-0.5 text-emerald-600" />
                  <p>
                    <strong>Informasi Penggunaan:</strong> Data spesifik unit ini akan muncul sebagai <b>Sub-Header (Baris Kedua)</b> pada laporan dan kwitansi untuk membedakan asal transaksi (misal: membedakan resi SPP SD dan SMP).
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Alamat Lengkap Unit</label>
                    <textarea name="address" value={unitData[activeUnitTab]?.address || ""} onChange={handleChange} rows={2} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Alamat lengkap unit sekolah..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Nomor Telepon Unit</label>
                    <input type="text" name="phone" value={unitData[activeUnitTab]?.phone || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="No Telp..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Email / Website Unit</label>
                    <div className="flex gap-2">
                      <input type="text" name="email" value={unitData[activeUnitTab]?.email || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Email" />
                      <input type="text" name="website" value={unitData[activeUnitTab]?.website || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Website" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Kepala Sekolah</label>
                    <input type="text" name="namaKepalaSekolah" value={unitData[activeUnitTab]?.namaKepalaSekolah || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nama Kepala Sekolah" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">NIP Kepala Sekolah</label>
                    <input type="text" name="nipKepalaSekolah" value={unitData[activeUnitTab]?.nipKepalaSekolah || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="NIP (Kosongkan jika tidak ada)" />
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* TAB 2: REKENING & PENOMORAN */}
        {activeTab === "rekening" && (
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                <h2 className="text-lg font-bold text-text-main">Rekening Bank Yayasan</h2>
                <Button variant="outline" size="sm" onClick={handleAddRekening}>
                  <Plus size={14} className="mr-1.5" /> Tambah Rekening
                </Button>
              </div>
              
              {formData.rekeningBank.length === 0 ? (
                <div className="text-center py-6 bg-bg rounded-xl border border-dashed border-border text-text-muted">
                  Belum ada data rekening bank yang ditambahkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.rekeningBank.map((rek: any, index: number) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-bg rounded-xl border border-border relative group">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-text-muted mb-1">Nama Bank</label>
                        <input type="text" value={rek.bankName} onChange={(e) => handleRekeningChange(index, "bankName", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="BSI / BCA / Mandiri" />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-text-muted mb-1">Nomor Rekening</label>
                        <input type="text" value={rek.accountNumber} onChange={(e) => handleRekeningChange(index, "accountNumber", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Contoh: 712345678" />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-text-muted mb-1">Atas Nama</label>
                        <input type="text" value={rek.accountName} onChange={(e) => handleRekeningChange(index, "accountName", e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Contoh: Yayasan Al Basyariah" />
                      </div>
                      <button onClick={() => handleRemoveRekening(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent group-hover:border-rose-200">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-text-main mb-4 border-b border-border pb-2">Format Penomoran Transaksi (Prefix)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Prefix Kas Masuk</label>
                  <div className="flex items-center gap-2">
                    <input type="text" name="prefixKasMasuk" value={formData.prefixKasMasuk} onChange={handleChange} className="w-24 bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase font-mono" placeholder="KM" maxLength={10} />
                    <span className="text-sm text-text-muted font-mono">-2026-0001</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Prefix Kas Keluar</label>
                  <div className="flex items-center gap-2">
                    <input type="text" name="prefixKasKeluar" value={formData.prefixKasKeluar} onChange={handleChange} className="w-24 bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase font-mono" placeholder="KK" maxLength={10} />
                    <span className="text-sm text-text-muted font-mono">-2026-0001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP DATA */}
        {activeTab === "backup" && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Database size={32} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">Pencadangan Database Server</h2>
            <p className="text-text-muted max-w-md mx-auto mb-6">
              Unduh seluruh data krusial sistem (Data Master, Transaksi, Laporan, Tagihan) ke dalam satu file Excel/JSON agar Anda memiliki cadangan mandiri jika terjadi hal yang tidak diinginkan.
            </p>
            <Button onClick={handleBackup} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download size={18} className="mr-2" /> Unduh Backup Sekarang
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
