"use client"

import { useState } from "react"
import { Building2, Landmark, Database, Save, Plus, Trash2, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"
import { upsertPengaturan } from "@/actions/pengaturan"
import PrintHeader from "@/components/shared/print/PrintHeader"
import PrintSignature from "@/components/shared/print/PrintSignature"
import PrintFooter from "@/components/shared/print/PrintFooter"

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

  // State untuk Backup
  const [backupUnitId, setBackupUnitId] = useState<string>("GLOBAL")
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [isBackingUp, setIsBackingUp] = useState(false)

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

  const handleBackup = async () => {
    if (selectedModules.length === 0) {
      toast.error("Pilih minimal satu modul untuk dicadangkan!")
      return
    }

    setIsBackingUp(true)
    const toastId = toast.loading("Sedang menarik & memformat data...")

    try {
      const { generateBackupData } = await import("@/actions/backup")
      const result = await generateBackupData(selectedModules, backupUnitId)

      if (!result.success || !result.data) {
        throw new Error(result.error)
      }

      toast.loading("Membuat file Excel & mengatur lebar kolom...", { id: toastId })
      const { exportMultiSheetExcel } = await import("@/lib/excel")
      
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 15)
      const unitStr = backupUnitId === "GLOBAL" ? "YAYASAN" : units.find(u => u.id === backupUnitId)?.name?.replace(/\\s+/g, '_') || "UNIT"
      
      exportMultiSheetExcel(result.data, `Backup_Siraya_${unitStr}_${dateStr}`)

      toast.success("File Excel berhasil diunduh!", { id: toastId })
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan pencadangan data.", { id: toastId })
    } finally {
      setIsBackingUp(false)
    }
  }

  const toggleModule = (mod: string) => {
    setSelectedModules(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    )
  }

  const toggleAllModules = () => {
    if (selectedModules.length === 5) {
      setSelectedModules([])
    } else {
      setSelectedModules(["akademik", "keuangan", "arus_kas", "tagihan", "sistem"])
    }
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
            
            {/* Live Preview Dokumen Lengkap */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-wider">
                Live Preview Dokumen
              </div>
              <div className="mt-4 bg-white p-8 shadow-sm border border-slate-100 min-h-[420px] flex flex-col">
                {/* === KOP SURAT === */}
                <PrintHeader 
                  pengaturan={formData} 
                  unitInfo={activeUnitTab === "GLOBAL" ? undefined : unitData[activeUnitTab]}
                  className="block"
                />

                {/* === AREA KONTEN CONTOH === */}
                <div className="flex-1 my-6">
                  <div className="text-center mb-4">
                    <h3 className="text-base font-bold uppercase tracking-wide text-slate-800">JUDUL DOKUMEN / LAPORAN</h3>
                    <p className="text-xs text-slate-500 mt-1">Subtitle dokumen akan tampil di sini</p>
                  </div>
                  <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <p className="text-sm text-slate-400 italic">[ Area Isi Tabel / Data Dokumen ]</p>
                  </div>
                </div>

                {/* === TANDA TANGAN === */}
                <PrintSignature
                  pengaturan={formData}
                  unitInfo={activeUnitTab === "GLOBAL" ? undefined : unitData[activeUnitTab]}
                  tipe="ganda"
                  tanggal={new Date()}
                  kiri={{
                    jabatan: activeUnitTab !== "GLOBAL" ? "Kepala Sekolah" : "Kepala TU",
                    nama: activeUnitTab !== "GLOBAL" 
                      ? (unitData[activeUnitTab]?.namaKepalaSekolah || "____________________")
                      : (formData.namaKepalaTU || "____________________")
                  }}
                  kanan={{
                    jabatan: "Petugas",
                    nama: "(Nama User yang Login)"
                  }}
                  className="flex"
                />

                {/* === FOOTER === */}
                <PrintFooter 
                  pengaturan={formData}
                  catatan={formData.catatanKwitansi}
                  className="block"
                />
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">Simulasi tampilan dokumen lengkap yang akan muncul pada ekspor PDF dan Cetak. Ubah data pada form di bawah untuk melihat perubahan secara real-time.</p>
            </div>

            {/* Pilihan Mode Edit */}
            <div className="bg-surface border border-border rounded-xl p-2 flex gap-2 flex-wrap items-center">
              <span className="text-sm font-semibold text-text-muted ml-2 mr-2">Sedang Mengedit:</span>
              <button
                onClick={() => setActiveUnitTab("GLOBAL")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeUnitTab === "GLOBAL" 
                  ? "bg-primary text-white shadow-sm" 
                  : "bg-transparent text-text-muted hover:bg-gray-50"
                }`}
              >
                Informasi Yayasan (Utama)
              </button>
              <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
              {units.map((unit: any) => (
                <button
                  key={unit.id}
                  onClick={() => setActiveUnitTab(unit.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeUnitTab === unit.id 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-transparent text-text-muted hover:bg-gray-50"
                  }`}
                >
                  Unit: {unit.name}
                </button>
              ))}
            </div>

            {activeUnitTab === "GLOBAL" ? (
              <div className="space-y-8 animate-in fade-in duration-300 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-text-main border-b border-border pb-2 mb-4">1. Identitas Utama Yayasan</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Yayasan/Lembaga</label>
                    <input type="text" name="namaYayasan" value={formData.namaYayasan} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Contoh: Yayasan Pendidikan Al Basyariah" />
                    <p className="text-xs text-text-muted mt-1">Dicetak tebal pada baris pertama kop surat.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">URL Logo Yayasan</label>
                    <input type="text" name="logoUrl" value={formData.logoUrl || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="/logo.png atau URL eksternal" />
                    <p className="text-xs text-text-muted mt-1">Logo akan ditampilkan di sebelah kiri kop surat.</p>
                  </div>

                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-lg font-bold text-text-main border-b border-border pb-2 mb-4">2. Kontak & Alamat Yayasan</h3>
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
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Email & Website</label>
                    <div className="flex gap-2">
                      <input type="text" name="email" value={formData.email || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Email" />
                      <input type="text" name="website" value={formData.website || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Website" />
                    </div>
                  </div>

                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-lg font-bold text-text-main border-b border-border pb-2 mb-4">3. Penandatangan & Footer Dokumen</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-amber-800 text-sm">
                      <p>Pengaturan ini digunakan untuk mencetak nama pejabat di bawah dokumen laporan dan kwitansi tingkat yayasan.</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Kota Tempat Tanda Tangan</label>
                    <input type="text" name="kotaPenandatangan" value={formData.kotaPenandatangan || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 md:w-1/2" placeholder="Contoh: Bandung, Depok, Jakarta" />
                    <p className="text-xs text-text-muted mt-1">Misal: "Bandung, 12 Agustus 2026"</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Kepala TU</label>
                    <input type="text" name="namaKepalaTU" value={formData.namaKepalaTU || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nama Pejabat TU" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Nama Bendahara Yayasan</label>
                    <input type="text" name="namaBendahara" value={formData.namaBendahara || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nama Bendahara" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Catatan/Footer Kwitansi Global</label>
                    <textarea name="catatanKwitansi" value={formData.catatanKwitansi || ""} onChange={handleChange} rows={2} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Catatan tambahan di bagian bawah kwitansi..."></textarea>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-300 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-text-main border-b border-border pb-2 mb-4">Informasi Spesifik Unit: {unitData[activeUnitTab]?.name}</h3>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-sm">
                      <p>Data unit akan menimpa data Yayasan pada baris kedua kop surat (Sub-Header) serta kontak dan penandatangan jika dokumen dicetak spesifik untuk unit ini.</p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Alamat Lengkap Unit</label>
                    <textarea name="address" value={unitData[activeUnitTab]?.address || ""} onChange={handleChange} rows={2} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Alamat lengkap unit sekolah..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Nomor Telepon Unit</label>
                    <input type="text" name="phone" value={unitData[activeUnitTab]?.phone || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="No Telp Unit..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Email & Website Unit</label>
                    <div className="flex gap-2">
                      <input type="text" name="email" value={unitData[activeUnitTab]?.email || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Email" />
                      <input type="text" name="website" value={unitData[activeUnitTab]?.website || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Website" />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-lg font-bold text-text-main border-b border-border pb-2 mb-4">Penandatangan Unit</h3>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Kota Tempat Tanda Tangan Unit</label>
                    <input type="text" name="kotaPenandatangan" value={unitData[activeUnitTab]?.kotaPenandatangan || ""} onChange={handleChange} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 md:w-1/2" placeholder="Contoh: Bandung, Depok, Jakarta" />
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
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold text-text-main mb-1">Pencadangan Database Server</h2>
                <p className="text-text-muted text-sm">Unduh data krusial sistem ke format Excel (Multi-Sheet).</p>
              </div>
              <Button onClick={handleBackup} disabled={isBackingUp || selectedModules.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">
                {isBackingUp ? <span className="animate-pulse">Memproses...</span> : <><Download size={18} className="mr-2" /> Unduh Backup</>}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* KOLOM KIRI: SETTINGS */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-blue-800 font-bold mb-3">
                    <Building2 size={18} /> Cakupan Data (Filter)
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Pilih apakah ingin mem-backup seluruh data Yayasan atau spesifik per Unit Sekolah.
                  </p>
                  <select 
                    value={backupUnitId}
                    onChange={(e) => setBackupUnitId(e.target.value)}
                    className="w-full bg-white border border-blue-200 text-blue-900 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GLOBAL">Seluruh Yayasan (Semua Unit)</option>
                    {units.map((u: any) => (
                      <option key={u.id} value={u.id}>Unit: {u.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-text-main mb-2 flex items-center gap-2">
                    <Info size={16} className="text-primary" /> Informasi Privasi
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Data kredensial pengguna seperti <b>Password</b> tidak akan pernah disertakan dalam hasil unduhan demi alasan keamanan.<br/><br/>
                    Gunakan file backup ini secara bijak dan simpan di tempat yang aman (hindari komputer publik).
                  </p>
                </div>
              </div>

              {/* KOLOM KANAN: MODULES */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-text-main">Pilih Modul Data yang Ingin Di-backup</h3>
                  <button 
                    onClick={toggleAllModules} 
                    className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    {selectedModules.length === 5 ? "Batalkan Semua" : "Pilih Semua Modul"}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Modul 1 */}
                  <div 
                    onClick={() => toggleModule("akademik")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-4 ${selectedModules.includes("akademik") ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-surface border-border hover:border-gray-300"}`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${selectedModules.includes("akademik") ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"}`}>
                      {selectedModules.includes("akademik") && <span className="text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${selectedModules.includes("akademik") ? "text-emerald-800" : "text-text-main"}`}>Data Master Akademik</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">Siswa, Guru, Daftar Kelas (Rombel), Jurusan, dan Tingkat.</p>
                    </div>
                  </div>

                  {/* Modul 2 */}
                  <div 
                    onClick={() => toggleModule("keuangan")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-4 ${selectedModules.includes("keuangan") ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-surface border-border hover:border-gray-300"}`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${selectedModules.includes("keuangan") ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"}`}>
                      {selectedModules.includes("keuangan") && <span className="text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${selectedModules.includes("keuangan") ? "text-emerald-800" : "text-text-main"}`}>Data Master Keuangan</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">Klasifikasi Akun, Sub-Klasifikasi, dan Bagan Akun Standar (COA).</p>
                    </div>
                  </div>

                  {/* Modul 3 */}
                  <div 
                    onClick={() => toggleModule("arus_kas")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-4 ${selectedModules.includes("arus_kas") ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-surface border-border hover:border-gray-300"}`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${selectedModules.includes("arus_kas") ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"}`}>
                      {selectedModules.includes("arus_kas") && <span className="text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${selectedModules.includes("arus_kas") ? "text-emerald-800" : "text-text-main"}`}>Transaksi & Arus Kas</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">Buku Jurnal, Kas Masuk, Kas Keluar, dan Detail Transaksi.</p>
                    </div>
                  </div>

                  {/* Modul 4 */}
                  <div 
                    onClick={() => toggleModule("tagihan")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-4 ${selectedModules.includes("tagihan") ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-surface border-border hover:border-gray-300"}`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${selectedModules.includes("tagihan") ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"}`}>
                      {selectedModules.includes("tagihan") && <span className="text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${selectedModules.includes("tagihan") ? "text-emerald-800" : "text-text-main"}`}>Tagihan & Pembayaran</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">Daftar Tagihan (SPP, DSP) dan Histori Pembayaran Siswa.</p>
                    </div>
                  </div>

                  {/* Modul 5 */}
                  <div 
                    onClick={() => toggleModule("sistem")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-4 ${selectedModules.includes("sistem") ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-surface border-border hover:border-gray-300"}`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${selectedModules.includes("sistem") ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 bg-white"}`}>
                      {selectedModules.includes("sistem") && <span className="text-xs">✓</span>}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${selectedModules.includes("sistem") ? "text-emerald-800" : "text-text-main"}`}>Sistem & Akses (Global)</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">Manajemen User (Operator), Role, Divisi, dan Unit Sekolah.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
