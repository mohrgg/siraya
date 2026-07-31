"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, Save, Receipt, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateNoReferensi, createKasKeluar } from "@/actions/kas-keluar"
import toast from "react-hot-toast"

type KasKeluarLine = {
  id: string
  akunId: string
  nilai: number
  deskripsi: string
}

export default function TambahKasKeluarClient({ kasBankAccounts, pengeluaranAccounts, divisiList, penggunaList }: { kasBankAccounts: any[], pengeluaranAccounts: any[], divisiList: any[], penggunaList: any[] }) {
  const router = useRouter()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [header, setHeader] = useState({
    akunSumberId: kasBankAccounts[0]?.id || "",
    tanggal: new Date().toISOString().split('T')[0],
    noReferensi: "",
    noFormulir: "",
    namaPihakKetiga: "",
    penerimaId: "",
    divisiId: "",
    deskripsi: ""
  })

  const [lines, setLines] = useState<KasKeluarLine[]>([
    { id: crypto.randomUUID(), akunId: "", nilai: 0, deskripsi: "" }
  ])

  // Fetch / Generate No Referensi when date changes
  useEffect(() => {
    if (header.tanggal) {
      generateNoReferensi(new Date(header.tanggal)).then(ref => {
        setHeader(prev => ({ ...prev, noReferensi: ref }))
      }).catch(console.error)
    }
  }, [header.tanggal])

  const totalNilai = lines.reduce((sum, line) => sum + (Number(line.nilai) || 0), 0)

  const addLine = () => {
    setLines([...lines, { id: crypto.randomUUID(), akunId: "", nilai: 0, deskripsi: "" }])
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.id !== id))
    }
  }

  const updateLine = (id: string, field: keyof KasKeluarLine, value: any) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!header.akunSumberId) return toast.error("Silakan pilih Akun Penerima Kas")
    if (lines.some(l => !l.akunId || l.nilai <= 0)) {
      return toast.error("Semua baris pembukuan harus memiliki Akun dan Nilai > 0")
    }

    try {
      setIsSubmitting(true)
      await createKasKeluar({
        akunSumberId: header.akunSumberId,
        tanggal: new Date(header.tanggal),
        noReferensi: header.noReferensi,
        noFormulir: header.noFormulir,
        namaPihakKetiga: header.namaPihakKetiga,
        deskripsi: header.deskripsi,
        details: lines.map(l => ({
          akunId: l.akunId,
          nilai: Number(l.nilai),
          deskripsi: l.deskripsi
        }))
      })

      toast.success("Kas Keluar berhasil disimpan!")
      router.push("/kas-keluar")
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto w-full pb-24">
      
      {/* Top Navigation */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
            Tambah Kas Keluar
          </h1>
          <p className="text-text-muted">Catat penerimaan dana / pendapatan umum ke dalam sistem</p>
        </div>
        <Link href="/kas-keluar">
          <Button variant="outline" className="flex items-center gap-2 bg-white border-border hover:bg-bg shadow-sm">
            <ArrowLeft size={16} className="text-text-muted" /> <span className="text-text-main font-medium text-sm">Kembali</span>
          </Button>
        </Link>
      </div>

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
              <label className="text-sm font-semibold text-text-main">Keluar Dari Akun Kas/Bank <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  className="w-full pl-4 pr-10 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-medium"
                  value={header.akunSumberId}
                  onChange={e => setHeader({ ...header, akunSumberId: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Pilih Dompet/Rekening --</option>
                  {kasBankAccounts.map(akun => (
                    <option key={akun.id} value={akun.id}>{akun.kode} - {akun.nama}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
              <span className="text-xs text-text-muted">Pilih dompet/rekening tempat uang dikeluarkan (KREDIT).</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Tanggal Transaksi <span className="text-red-500">*</span></label>
              <input 
                type="date"
                required
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
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
              <label className="text-sm font-semibold text-text-main">Penerima (Terdaftar) <span className="text-red-500">*</span></label>
              <div className="relative">
                <select 
                  className="w-full pl-4 pr-10 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-medium"
                  value={header.penerimaId}
                  onChange={e => {
                    const selectedUserId = e.target.value;
                    const selectedUser = penggunaList.find(u => u.id === selectedUserId);
                    setHeader({ 
                      ...header, 
                      penerimaId: selectedUserId,
                      divisiId: selectedUser?.divisiId || ""
                    });
                  }}
                  required
                >
                  <option value="" disabled>-- Pilih Penerima --</option>
                  {penggunaList.map(pengguna => (
                    <option key={pengguna.id} value={pengguna.id}>{pengguna.name} ({pengguna.role})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Atas Nama Penerima (Opsional)</label>
              <input 
                type="text"
                placeholder="Contoh: Bpk. Hamba Allah"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={header.namaPihakKetiga}
                onChange={e => setHeader({ ...header, namaPihakKetiga: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Divisi (Opsional)</label>
              <div className="relative">
                <select 
                  className="w-full pl-4 pr-10 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  value={header.divisiId}
                  onChange={e => setHeader({ ...header, divisiId: e.target.value })}
                  disabled={!!header.penerimaId}
                >
                  <option value="">-- Pilih Divisi --</option>
                  {divisiList.map(divisi => (
                    <option key={divisi.id} value={divisi.id}>{divisi.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">No. Formulir / Kertas (Opsional)</label>
              <input 
                type="text"
                placeholder="Contoh: KWT-001"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={header.noFormulir}
                onChange={e => setHeader({ ...header, noFormulir: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label className="text-sm font-semibold text-text-main">Keterangan Umum <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="Contoh: Pengeluaran Donasi Pembangunan Masjid"
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={header.deskripsi}
                onChange={e => setHeader({ ...header, deskripsi: e.target.value })}
              />
            </div>

          </div>
        </div>

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
                  const selectedAkun = pengeluaranAccounts.find(a => a.id === line.akunId)
                  const kodeAkun = selectedAkun ? selectedAkun.kode : ""

                  return (
                    <tr key={line.id} className="hover:bg-bg/30">
                      <td className="p-4">
                        <select 
                          className="w-full px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                          value={line.akunId}
                          onChange={e => updateLine(line.id, "akunId", e.target.value)}
                          required
                        >
                          <option value="" disabled>Pilih Ke Akun</option>
                          {pengeluaranAccounts.map(akun => (
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
                          disabled={lines.length === 1}
                          className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed mx-auto block"
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
        <div className="fixed bottom-0 left-0 right-0 md:left-[265px] bg-white border-t border-border p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-end gap-3 z-30">
          <Link href="/kas-keluar">
            <Button type="button" variant="outline" className="min-w-[100px]">Batal</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting} className="min-w-[150px] shadow-md shadow-primary/20">
            <Save size={16} className="mr-1.5" /> Simpan Transaksi
          </Button>
        </div>

      </form>
    </div>
  )
}
