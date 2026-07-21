"use client"

import { useState, useRef } from "react"
import { Plus, Search, Edit2, Trash2, Printer, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahTransaksiKas, editTransaksiKas, hapusTransaksiKas } from "@/actions/transaksi-kas"

export default function KasMasukClient({ 
  initialData, schoolUnits, initialUnitId, accounts, students 
}: { 
  initialData: any[], schoolUnits: any[], initialUnitId: string, accounts: any[], students: any[] 
}) {
  const [data, setData] = useState<any[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const emptyForm = {
    id: "",
    akunDetailId: "",
    unitSekolahId: initialUnitId,
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    studentName: "",
    formNo: "",
  }
  const [formData, setFormData] = useState(emptyForm)

  const filteredData = data.filter(d => 
    d.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.studentName && d.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData);

  const handleAddClick = () => {
    setFormData(emptyForm)
    setIsAdding(true)
  }

  const handleEditClick = (item: any) => {
    setFormData({
      id: item.id,
      akunDetailId: item.akunDetailId,
      unitSekolahId: item.unitSekolahId,
      amount: String(item.amount),
      date: new Date(item.date).toISOString().slice(0, 10),
      description: item.description || "",
      studentName: item.studentName || "",
      formNo: item.formNo || "",
    })
    setIsAdding(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formData.id) {
        // Edit
        const res = await editTransaksiKas(formData.id, {
          akunDetailId: formData.akunDetailId,
          amount: Number(formData.amount),
          date: new Date(formData.date),
          description: formData.description,
          studentName: formData.studentName,
          formNo: formData.formNo,
        })
        setData(data.map(d => d.id === formData.id ? { ...d, ...res } : d))
      } else {
        // Tambah Baru
        const res = await tambahTransaksiKas({
          type: "IN",
          akunDetailId: formData.akunDetailId,
          unitSekolahId: formData.unitSekolahId,
          amount: Number(formData.amount),
          date: new Date(formData.date),
          description: formData.description,
          studentName: formData.studentName,
          formNo: formData.formNo
        })
        setData([res, ...data])
      }
      setIsAdding(false)
      setFormData(emptyForm)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await hapusTransaksiKas(deleteId)
      setData(data.filter(d => d.id !== deleteId))
      setDeleteId(null)
    } catch (e: any) {
      alert("Gagal menghapus: " + e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrint = (item: any) => {
    setDetailItem(item)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  const activeUnit = schoolUnits.find((u: any) => u.id === initialUnitId)

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Transaksi Kas Masuk"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Data akan ditandai sebagai dihapus dan tidak tampil di laporan."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Detail / Print Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">Detail Transaksi Kas Masuk</h3>
              <button onClick={() => setDetailItem(null)} className="p-2 rounded-lg hover:bg-bg transition-colors">
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" ref={printRef}>
              {/* Print-friendly content */}
              <div className="print-content">
                <div className="text-center mb-6 hidden print:block">
                  <h2 className="text-xl font-bold">{activeUnit?.name || "Yayasan Al Basyariah"}</h2>
                  <p className="text-sm text-text-muted">Bukti Transaksi Kas Masuk</p>
                  <hr className="my-3 border-text-main" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-muted font-medium mb-1">No. Referensi</p>
                    <p className="font-bold text-text-main text-lg">{detailItem.referenceNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted font-medium mb-1">Tanggal Transaksi</p>
                    <p className="font-bold text-text-main text-lg">{new Date(detailItem.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Nominal Penerimaan</p>
                  <p className="text-3xl font-extrabold text-emerald-700">{formatRp(Number(detailItem.amount))}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4">
                  <div className="bg-bg rounded-xl p-4">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">Informasi Transaksi</p>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div>
                        <p className="text-text-muted">Akun Keuangan</p>
                        <p className="font-semibold text-text-main">{detailItem.akunDetail ? `[${detailItem.akunDetail.code}] ${detailItem.akunDetail.name}` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Penyetor / Nama Siswa</p>
                        <p className="font-semibold text-text-main">{detailItem.studentName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">No. Formulir</p>
                        <p className="font-semibold text-text-main">{detailItem.formNo || "-"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Dicatat Oleh</p>
                        <p className="font-semibold text-text-main">{detailItem.createdBy?.name || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {detailItem.description && (
                    <div className="bg-bg rounded-xl p-4">
                      <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">Keterangan</p>
                      <p className="text-sm text-text-main">{detailItem.description}</p>
                    </div>
                  )}
                </div>

                {/* Print-only signature */}
                <div className="hidden print:grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                  <div>
                    <p className="font-semibold mb-16">Penyetor,</p>
                    <p className="border-t border-text-main pt-1">{detailItem.studentName || "(............................)"}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-16">Penerima,</p>
                    <p className="border-t border-text-main pt-1">{detailItem.createdBy?.name || "(............................)"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3 justify-end print:hidden">
              <Button variant="outline" onClick={() => setDetailItem(null)}>Tutup</Button>
              <Button onClick={() => window.print()}>
                <Printer size={16} className="mr-2" /> Cetak Bukti
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari referensi, keterangan, penyetor..." 
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm text-text-main" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={16} className="mr-2" /> Input Kas Masuk
        </Button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-albas-green m-0">{formData.id ? "Edit Transaksi Kas Masuk" : "Input Transaksi Kas Masuk (Penerimaan)"}</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Tanggal Transaksi <span className="text-red-500">*</span></label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="hidden">
                  <select value={formData.unitSekolahId} onChange={e => setFormData({ ...formData, unitSekolahId: e.target.value })} required>
                    {schoolUnits.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Akun Keuangan (Penerimaan) <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formData.akunDetailId} onChange={e => setFormData({ ...formData, akunDetailId: e.target.value })} required>
                    <option value="">-- Pilih Akun --</option>
                    {accounts.map((a: any) => <option key={a.id} value={a.id}>[{a.code}] {a.name} ({a.subKlasifikasiAkun?.name})</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Jumlah (Rp) <span className="text-red-500">*</span></label>
                  <Input type="number" min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nomor Formulir (Opsional)</label>
                  <Input value={formData.formNo} onChange={e => setFormData({ ...formData, formNo: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Nama Siswa / Penyetor (Opsional)</label>
                  <input list="students" className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
                  <datalist id="students">
                    {students.filter((s: any) => s.unitSekolahId === formData.unitSekolahId).map((s: any) => <option key={s.id} value={s.name} />)}
                  </datalist>
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-main">Keterangan Tambahan</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium resize-y" 
                    rows={3} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>
                
                <div className="md:col-span-2 flex gap-3 mt-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
                  <Button type="submit" isLoading={isSubmitting}>{formData.id ? "Simpan Perubahan" : "Simpan Transaksi"}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700 font-medium mb-1">Total Kas Masuk</p>
          <p className="text-2xl font-bold text-emerald-700">{formatRp(data.reduce((sum, d) => sum + Number(d.amount), 0))}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">Jumlah Transaksi</p>
          <p className="text-2xl font-bold text-blue-700">{data.length} <span className="text-base font-normal">transaksi</span></p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-medium mb-1">Rata-rata per Transaksi</p>
          <p className="text-2xl font-bold text-purple-700">{data.length > 0 ? formatRp(data.reduce((sum, d) => sum + Number(d.amount), 0) / data.length) : "Rp 0"}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-gray-50/50">
                <SortableHeader label="Tanggal" sortKey="date" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="No Referensi" sortKey="referenceNo" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Penyetor/Keterangan" sortKey="studentName" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Akun" sortKey="akunDetail.name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Nominal" sortKey="amount" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-right" />
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-text-main">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 font-semibold text-text-main">{item.referenceNo}</td>
                  <td className="p-4">
                    <div className="font-semibold text-text-main">{item.studentName || item.recipientName || "-"}</div>
                    {item.description && <div className="text-sm text-text-muted mt-0.5 line-clamp-1">{item.description}</div>}
                  </td>
                  <td className="p-4 text-text-main text-sm">
                    {item.akunDetail ? `[${item.akunDetail.code}] ${item.akunDetail.name}` : "-"}
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-600">
                    {formatRp(Number(item.amount))}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailItem(item)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Lihat Detail">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleEditClick(item)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handlePrint(item)} className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="Cetak Bukti">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted">Belum ada data Kas Masuk.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
