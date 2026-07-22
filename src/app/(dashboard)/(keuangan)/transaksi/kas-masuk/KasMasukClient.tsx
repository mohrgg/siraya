"use client"

import { useState, useRef, useMemo } from "react"
import { Plus, Search, Edit2, Trash2, Printer, Eye, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahTransaksiKas, editTransaksiKas, hapusTransaksiKas } from "@/actions/transaksi-kas"

export default function KasMasukClient({ 
  initialData, schoolUnits, initialUnitId, accounts, students, divisis
}: { 
  initialData: any[], schoolUnits: any[], initialUnitId: string, accounts: any[], students?: any[], divisis?: any[]
}) {
  const [data, setData] = useState<any[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const emptyItem = { id: "", akunDetailId: "", amount: "", description: "" }
  const emptyForm = {
    id: "",
    akunDetailId: "", // Akun Utama (Kas/Bank)
    unitSekolahId: initialUnitId,
    divisiId: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    studentName: "",
    formNo: "",
    editReason: "",
    items: [{ ...emptyItem }]
  }
  const [formData, setFormData] = useState(emptyForm)

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchSearch = d.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.studentName && d.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const txDate = new Date(d.date).getTime()
      const matchStart = startDate ? txDate >= new Date(startDate).getTime() : true
      const matchEnd = endDate ? txDate <= new Date(endDate).getTime() : true
      
      return matchSearch && matchStart && matchEnd
    })
  }, [data, searchTerm, startDate, endDate])

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
      divisiId: item.divisiId || "",
      date: new Date(item.date).toISOString().slice(0, 10),
      description: item.description || "",
      studentName: item.studentName || "",
      formNo: item.formNo || "",
      editReason: "",
      items: item.items && item.items.length > 0 
        ? item.items.map((i: any) => ({ ...i, amount: String(i.amount) }))
        : [{ ...emptyItem }]
    })
    setIsAdding(true)
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.items.length === 0) return alert("Minimal harus ada 1 baris rincian akun!")
    if (formData.items.some(i => !i.akunDetailId || !i.amount)) return alert("Harap isi semua baris rincian (Akun & Nominal)")
    if (formData.id && !formData.editReason) return alert("Harap isi Alasan Perubahan!")

    setIsSubmitting(true)
    try {
      const totalAmount = calculateTotal()

      if (formData.id) {
        const res = await editTransaksiKas(formData.id, {
          akunDetailId: formData.akunDetailId,
          totalAmount: totalAmount,
          date: new Date(formData.date),
          description: formData.description,
          studentName: formData.studentName,
          formNo: formData.formNo,
          divisiId: formData.divisiId || undefined,
          editReason: formData.editReason,
          items: formData.items.map(i => ({
            id: i.id || undefined,
            akunDetailId: i.akunDetailId,
            amount: Number(i.amount),
            description: i.description
          }))
        })
        setData(data.map(d => d.id === formData.id ? { ...d, ...res } : d))
      } else {
        const res = await tambahTransaksiKas({
          type: "IN",
          akunDetailId: formData.akunDetailId,
          unitSekolahId: formData.unitSekolahId,
          totalAmount: totalAmount,
          date: new Date(formData.date),
          description: formData.description,
          studentName: formData.studentName,
          formNo: formData.formNo,
          divisiId: formData.divisiId || undefined,
          items: formData.items.map(i => ({
            akunDetailId: i.akunDetailId,
            amount: Number(i.amount),
            description: i.description
          }))
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
    setTimeout(() => { window.print() }, 300)
  }

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  const activeUnit = schoolUnits.find((u: any) => u.id === initialUnitId)
  const kasAccounts = accounts.filter(a => a.subKlasifikasiAkun?.name?.toLowerCase().includes('kas') || a.subKlasifikasiAkun?.name?.toLowerCase().includes('bank'))
  const otherAccounts = accounts.filter(a => !kasAccounts.includes(a))

  return (
    <div>
      <ConfirmModal 
        isOpen={!!deleteId}
        title="Hapus Transaksi Kas Masuk"
        message="Apakah Anda yakin ingin menghapus transaksi penerimaan ini?"
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

      {/* Detail / Print Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">Bukti Transaksi Kas Masuk</h3>
              <button onClick={() => setDetailItem(null)} className="p-2 rounded-lg hover:bg-bg transition-colors">
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" ref={printRef}>
              <div className="print-content">
                <div className="text-center mb-6 hidden print:block">
                  <h2 className="text-xl font-bold">{activeUnit?.name || "Yayasan Al Basyariah"}</h2>
                  <p className="text-sm text-text-muted">Bukti Penerimaan Kas</p>
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
                  <p className="text-sm text-emerald-700 font-medium mb-1">Total Penerimaan</p>
                  <p className="text-3xl font-extrabold text-emerald-700">{formatRp(Number(detailItem.totalAmount))}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4">
                  <div className="bg-bg rounded-xl p-4">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-2">Informasi Header</p>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div>
                        <p className="text-text-muted">Akun Tujuan (Kas/Bank)</p>
                        <p className="font-semibold text-text-main">{detailItem.akunDetail ? `[${detailItem.akunDetail.code}] ${detailItem.akunDetail.name}` : "-"}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Atas Nama / Penyetor</p>
                        <p className="font-semibold text-text-main">{detailItem.studentName || "-"}</p>
                      </div>
                      {detailItem.divisi && (
                        <div>
                          <p className="text-text-muted">Divisi / Cost Center</p>
                          <p className="font-semibold text-text-main">{detailItem.divisi.name}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-text-muted">Dicatat Oleh</p>
                        <p className="font-semibold text-text-main">{detailItem.createdBy?.name || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rincian Items */}
                  <div className="bg-bg rounded-xl p-4">
                    <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-3">Rincian Penerimaan</p>
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border text-text-muted">
                          <th className="py-2 font-medium">Akun Lawan (Pendapatan/Lainnya)</th>
                          <th className="py-2 font-medium">Keterangan</th>
                          <th className="py-2 font-medium text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItem.items?.map((item: any, i: number) => (
                          <tr key={item.id || i} className="border-b border-border/50">
                            <td className="py-2 font-semibold text-text-main">[{item.akunDetail?.code}] {item.akunDetail?.name}</td>
                            <td className="py-2 text-text-muted">{item.description || "-"}</td>
                            <td className="py-2 text-right font-bold text-text-main">{formatRp(Number(item.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {detailItem.isEdited && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                      <div>
                        <p className="text-sm font-bold text-amber-700">Telah Dirubah (Di-edit)</p>
                        <p className="text-xs text-amber-600 mt-1">Alasan: {detailItem.editReason}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden print:grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                  <div>
                    <p className="font-semibold mb-16">Penyetor,</p>
                    <p className="border-t border-text-main pt-1">{detailItem.studentName || "(............................)"}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-16">Bendahara,</p>
                    <p className="border-t border-text-main pt-1">{detailItem.createdBy?.name || "(............................)"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-3 justify-end print:hidden">
              <Button variant="outline" onClick={() => setDetailItem(null)}>Tutup</Button>
              <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                <Printer size={16} className="mr-2" /> Cetak Bukti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 p-4 bg-surface rounded-2xl shadow-sm border border-border">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari referensi, keterangan, penyetor..." 
              className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="date" className="px-3 py-2 bg-bg border border-border rounded-xl text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-text-muted">-</span>
            <input type="date" className="px-3 py-2 bg-bg border border-border rounded-xl text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleAddClick} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent w-full md:w-auto">
          <Plus size={16} className="mr-2" /> Input Kas Masuk
        </Button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold text-emerald-600 m-0">{formData.id ? "Edit Transaksi Kas Masuk" : "Input Transaksi Kas Masuk (Penerimaan)"}</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Bagian Header */}
                <div className="bg-bg/50 p-5 rounded-xl border border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main">Disetor Ke Akun <span className="text-red-500">*</span></label>
                    <select className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm" value={formData.akunDetailId} onChange={e => setFormData({ ...formData, akunDetailId: e.target.value })} required>
                      <option value="">-- Kas / Bank --</option>
                      {kasAccounts.map((a: any) => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-main">Tanggal Transaksi <span className="text-red-500">*</span></label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label className="text-sm font-semibold text-text-main">Atas Nama / Penyetor</label>
                    <Input value={formData.studentName} onChange={e => setFormData({ ...formData, studentName: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-3">
                    <label className="text-sm font-semibold text-text-main">Keterangan Umum</label>
                    <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </div>

                {/* Bagian Detail / Multi-baris */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-surface p-3 border-b border-border flex justify-between items-center">
                    <h4 className="font-bold text-sm text-text-main">Rincian Penerimaan</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] })}>
                      <Plus size={14} className="mr-1" /> Tambah Baris
                    </Button>
                  </div>
                  <div className="bg-bg p-4 overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-text-muted border-b border-border">
                          <th className="pb-2 font-semibold w-1/3">Akun Lawan (Pendapatan/Modal) *</th>
                          <th className="pb-2 font-semibold w-1/3">Deskripsi *</th>
                          <th className="pb-2 font-semibold w-1/4">Nominal (Rp) *</th>
                          <th className="pb-2 font-semibold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-b border-border/30 last:border-0">
                            <td className="py-2 pr-2">
                              <select className="w-full px-2 py-1.5 bg-surface border border-border rounded focus:outline-none focus:border-primary" value={item.akunDetailId} onChange={e => {
                                const newItems = [...formData.items]; newItems[index].akunDetailId = e.target.value; setFormData({ ...formData, items: newItems });
                              }} required>
                                <option value="">-- Pilih Akun --</option>
                                {otherAccounts.map((a: any) => <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>)}
                              </select>
                            </td>
                            <td className="py-2 pr-2">
                              <Input className="py-1.5 px-2 text-sm" placeholder="Contoh: Donasi Alumni" value={item.description} onChange={e => {
                                const newItems = [...formData.items]; newItems[index].description = e.target.value; setFormData({ ...formData, items: newItems });
                              }} required />
                            </td>
                            <td className="py-2 pr-2">
                              <Input type="number" min="0" className="py-1.5 px-2 text-sm text-right" placeholder="0" value={item.amount} onChange={e => {
                                const newItems = [...formData.items]; newItems[index].amount = e.target.value; setFormData({ ...formData, items: newItems });
                              }} required />
                            </td>
                            <td className="py-2 text-center">
                              <button type="button" onClick={() => {
                                const newItems = [...formData.items]; newItems.splice(index, 1); setFormData({ ...formData, items: newItems });
                              }} className="p-1.5 text-red-500 hover:bg-red-50 rounded" disabled={formData.items.length === 1}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-emerald-50 p-4 border-t border-emerald-200 flex justify-between items-center">
                    <span className="font-bold text-emerald-700">Total Penerimaan:</span>
                    <span className="text-xl font-extrabold text-emerald-700">{formatRp(calculateTotal())}</span>
                  </div>
                </div>

                {formData.id && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <label className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} /> Alasan Perubahan Data <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="Tuliskan mengapa data ini diubah..." value={formData.editReason} onChange={e => setFormData({ ...formData, editReason: e.target.value })} required />
                  </div>
                )}
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
                  <Button type="submit" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">{formData.id ? "Simpan Perubahan" : "Simpan Penerimaan"}</Button>
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
          <p className="text-2xl font-bold text-emerald-700">{formatRp(filteredData.reduce((sum, d) => sum + Number(d.totalAmount), 0))}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-medium mb-1">Jumlah Transaksi</p>
          <p className="text-2xl font-bold text-blue-700">{filteredData.length} <span className="text-base font-normal">transaksi</span></p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-medium mb-1">Rata-rata per Transaksi</p>
          <p className="text-2xl font-bold text-purple-700">{filteredData.length > 0 ? formatRp(filteredData.reduce((sum, d) => sum + Number(d.totalAmount), 0) / filteredData.length) : "Rp 0"}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-gray-50/50">
                <SortableHeader label="Tanggal" sortKey="date" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="No Referensi" sortKey="referenceNo" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Atas Nama/Penyetor" sortKey="studentName" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Akun Tujuan" sortKey="akunDetail.name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
                <SortableHeader label="Total Nominal" sortKey="totalAmount" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-right" />
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-text-main">
                    {new Date(item.date).toLocaleDateString('id-ID')}
                    {item.isEdited && (
                      <span className="block mt-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded w-max border border-amber-200 font-bold" title={item.editReason}>
                        Di-edit
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-text-main">{item.referenceNo}</td>
                  <td className="p-4">
                    <div className="font-semibold text-text-main">{item.studentName || "-"}</div>
                    {item.description && <div className="text-sm text-text-muted mt-0.5 line-clamp-1">{item.description}</div>}
                  </td>
                  <td className="p-4 text-text-main text-sm">
                    {item.akunDetail ? `[${item.akunDetail.code}] ${item.akunDetail.name}` : "-"}
                    {item.divisi && <div className="text-xs text-purple-600 font-semibold mt-0.5">{item.divisi.name}</div>}
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-500">
                    {formatRp(Number(item.totalAmount))}
                    <div className="text-xs text-text-muted font-normal mt-0.5">{item.items?.length || 0} rincian</div>
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
