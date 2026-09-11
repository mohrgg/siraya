"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Save, Receipt, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateKasMasuk } from "@/actions/kas-masuk"
import toast from "react-hot-toast"

type KasMasukLine = {
  id: string
  akunId: string
  nilai: number
  deskripsi: string
}

export default function EditKasMasukClient({ transaksi, kasBankAccounts, pendapatanAccounts }: { transaksi: any, kasBankAccounts: any[], pendapatanAccounts: any[] }) {
  const router = useRouter()
  const isTagihan = transaksi.sumber === "TAGIHAN"
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find the Debit line for Akun Penerima
  const debitLine = transaksi.detail.find((d: any) => d.posisi === "DEBIT")
  const kreditLines = transaksi.detail.filter((d: any) => d.posisi === "KREDIT")

  const [header, setHeader] = useState({
    akunPenerimaId: debitLine?.akunId || kasBankAccounts[0]?.id || "",
    tanggal: new Date(transaksi.tanggal).toISOString().split('T')[0],
    noReferensi: transaksi.noReferensi,
    noFormulir: transaksi.noFormulir || "",
    namaPihakKetiga: transaksi.namaPihakKetiga || "",
    deskripsi: transaksi.deskripsi || ""
  })

  const [lines, setLines] = useState<KasMasukLine[]>(
    kreditLines.map((d: any) => ({
      id: d.id,
      akunId: d.akunId,
      nilai: d.nilai,
      deskripsi: d.deskripsi || ""
    }))
  )

  const totalNilai = lines.reduce((sum, line) => sum + (Number(line.nilai) || 0), 0)

  const addLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), akunId: "", nilai: 0, deskripsi: "" }])
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id))
    }
  }

  const updateLine = (id: string, field: keyof KasMasukLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!header.akunPenerimaId) return toast.error("Silakan pilih Akun Penerima Kas")
    if (lines.some(l => !l.akunId || l.nilai <= 0)) {
      return toast.error("Semua baris pembukuan harus memiliki Akun dan Nilai > 0")
    }

    try {
      setIsSubmitting(true)
      const payload = {
        ...header,
        tanggal: new Date(header.tanggal),
        details: lines.map(l => ({
          akunId: l.akunId,
          nilai: Number(l.nilai),
          deskripsi: l.deskripsi
        }))
      }

      await updateKasMasuk(transaksi.id, payload)
      toast.success("Perubahan transaksi berhasil disimpan!")
      router.push("/kas-masuk")
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full pb-36 md:pb-24">
      <PageHeader 
        title="Ubah Kas Masuk"
        subtitle="Edit transaksi penerimaan uang"
        backHref={`/kas-masuk/${transaksi.id}`}
        backLabel="Kembali ke Detail Kas Masuk"
        backShortLabel="Kembali"
        backPosition="left"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* HEADER SECTION */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg/50">
            <h2 className="font-semibold text-text-main">
              Informasi Transaksi (Header)
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="flex flex-col gap-1.5 lg:col-span-1">
              <label className="text-sm font-semibold text-text-main">Masuk Ke Akun Kas/Bank <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  className="w-full pl-4 pr-10 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-medium"
                  value={header.akunPenerimaId}
                  onChange={e => setHeader({ ...header, akunPenerimaId: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Pilih Dompet/Rekening --</option>
                  {kasBankAccounts.map(akun => (
                    <option key={akun.id} value={akun.id}>{akun.kode} - {akun.nama}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              <span className="text-xs text-text-muted">Pilih dompet/rekening tempat uang diterima (DEBIT).</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Tanggal Transaksi <span className="text-red-500">*</span></label>
              <input 
                type="date"
                required
                disabled={isTagihan}
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                value={header.tanggal}
                onChange={e => setHeader({ ...header, tanggal: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">No. Referensi (Auto) <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                readOnly
                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl focus:outline-none text-sm font-medium text-text-muted font-mono cursor-not-allowed"
                value={header.noReferensi}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Nama Penyetor (Opsional)</label>
              <input 
                type="text"
                disabled={isTagihan}
                placeholder="Contoh: Bpk. Budi Santoso"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                value={header.namaPihakKetiga}
                onChange={e => setHeader({ ...header, namaPihakKetiga: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">No. Formulir / Kertas (Opsional)</label>
              <input 
                type="text"
                disabled={isTagihan}
                placeholder="Contoh: KWT-001"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                value={header.noFormulir}
                onChange={e => setHeader({ ...header, noFormulir: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label className="text-sm font-semibold text-text-main">Keterangan Umum <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                disabled={isTagihan}
                placeholder="Contoh: Penerimaan Donasi Pembangunan Masjid"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                value={header.deskripsi}
                onChange={e => setHeader({ ...header, deskripsi: e.target.value })}
              />
            </div>

          </div>
        </div>

        {/* PLACEHOLDER TAGIHAN INFO */}
        {isTagihan && (
          <div className="bg-blue-50/50 rounded-2xl shadow-sm border border-blue-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
              <Receipt size={20} className="mr-2" />
              Rincian Tagihan Siswa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-sm text-text-muted mb-1 font-medium">Total Tagihan</p>
                <p className="text-xl font-bold text-text-main">Rp 0</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-sm text-text-muted mb-1 font-medium">Sudah Dibayar</p>
                <p className="text-xl font-bold text-albas-green">Rp 0</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-sm text-text-muted mb-1 font-medium">Sisa Belum Dibayar</p>
                <p className="text-xl font-bold text-red-500">Rp 0</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-4 italic">* Fitur Rincian Tagihan Siswa dalam tahap pengembangan.</p>
          </div>
        )}

        {/* DETAIL PEMBUKUAN SECTION */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg/50 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-text-main">Rincian Pembukuan (Pendapatan)</h2>
              <p className="text-xs text-text-muted mt-0.5">Catat dari mana saja sumber penerimaan uang tersebut (KREDIT).</p>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg text-text-muted font-semibold border-b border-border">
                <tr>
                  <th className="p-4 min-w-[300px]">AKUN <span className="text-red-500">*</span></th>
                  <th className="p-4 w-48">KODE</th>
                  <th className="p-4 w-64 text-right">TOTAL <span className="text-red-500">*</span></th>
                  <th className="p-4 w-16 text-center">HAPUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => {
                  const selectedAkun = pendapatanAccounts.find(a => a.id === line.akunId)
                  const kodeAkun = selectedAkun ? selectedAkun.kode : ""

                  return (
                    <tr key={line.id} className="hover:bg-bg/30">
                      <td className="p-4">
                        <select 
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          value={line.akunId}
                          onChange={e => updateLine(line.id, "akunId", e.target.value)}
                          required
                          disabled={isTagihan}
                        >
                          <option value="" disabled>Pilih Ke Akun</option>
                          {pendapatanAccounts.map(akun => (
                            <option key={akun.id} value={akun.id}>[{akun.kode}] {akun.nama}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text-muted cursor-not-allowed font-mono"
                          value={kodeAkun}
                          readOnly
                          placeholder="Kode"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text"
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-right font-semibold text-albas-green"
                          placeholder="0"
                          value={line.nilai ? line.nilai.toLocaleString('id-ID') : ""}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, "");
                            updateLine(line.id, "nilai", rawValue ? Number(rawValue) : 0);
                          }}
                          required
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          type="button" 
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1 || isTagihan}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 hover:border-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mx-auto block"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-bg/50 border-t border-border">
                <tr>
                  <td colSpan={4} className="p-4">
                    <div className="flex flex-col gap-4">
                      {!isTagihan && (
                        <div className="flex justify-center">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={addLine}
                            className="text-text-muted hover:text-text-main border-border"
                          >
                            <Plus size={16} className="mr-1.5" /> Tambah Baris Pembukuan
                          </Button>
                        </div>
                      )}
                      <div className="flex justify-end items-center gap-8 pt-2">
                        <span className="font-bold text-text-muted">Total</span>
                        <span className="font-bold text-albas-green text-lg w-48 text-right">
                          Rp {totalNilai.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          

        </div>

        {/* Action Bar (Sticky Bottom) */}
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 md:left-[265px] bg-white/95 backdrop-blur-md border-t border-border p-3 sm:p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-end gap-3 z-30 md:pb-4">
          <Link href={`/kas-masuk/${transaksi.id}`} className="flex-1 sm:flex-initial">
            <Button type="button" variant="outline" className="w-full min-w-[100px] min-h-[44px]">Batal</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting} className="flex-1 sm:flex-initial min-w-[150px] min-h-[44px] shadow-md shadow-primary/20">
            <Save size={16} className="mr-1.5" /> Simpan Perubahan
          </Button>
        </div>

      </form>
    </div>
  )
}
