"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { useSortableData } from "@/hooks/useSortableData"
import { tambahTransaksiKas } from "@/actions/transaksi-kas"

export default function KasKeluarClient({ 
  initialData, schoolUnits, initialUnitId, accounts 
}: { 
  initialData: any[], schoolUnits: any[], initialUnitId: string, accounts: any[]
}) {
  const [data, setData] = useState<any[]>(initialData)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    akunDetailId: "",
    unitSekolahId: initialUnitId,
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    recipientName: "",
    formNo: "",
  })

  const filteredData = data.filter(d => 
    d.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const { items: sortedData, requestSort, sortConfig } = useSortableData(filteredData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await tambahTransaksiKas({
        type: "OUT",
        akunDetailId: formData.akunDetailId,
        unitSekolahId: formData.unitSekolahId,
        amount: Number(formData.amount),
        date: new Date(formData.date),
        description: formData.description,
        recipientName: formData.recipientName,
        formNo: formData.formNo
      })
      setData([res, ...data])
      setIsAdding(false)
      setFormData({
        ...formData,
        amount: "",
        description: "",
        recipientName: "",
        formNo: ""
      })
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format currency
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Cari referensi atau keterangan..." 
            className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm text-text-main" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
          <Plus size={16} className="mr-2" /> Input Kas Keluar
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 bg-bg border border-border rounded-2xl shadow-sm">
          <div className="md:col-span-2 font-bold text-lg text-text-main mb-2">Input Transaksi Kas Keluar (Pengeluaran)</div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Tanggal Transaksi</label>
            <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="hidden">
            <label className="text-sm font-semibold text-text-main">Unit Sekolah</label>
            <select className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium h-[42px]" value={formData.unitSekolahId} onChange={e => setFormData({ ...formData, unitSekolahId: e.target.value })} required>
              {schoolUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Akun Keuangan (Pengeluaran)</label>
            <select className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium h-[42px]" value={formData.akunDetailId} onChange={e => setFormData({ ...formData, akunDetailId: e.target.value })} required>
              <option value="">-- Pilih Akun --</option>
              {accounts.map(a => <option key={a.id} value={a.id}>[{a.code}] {a.name} ({a.subKlasifikasiAkun.name})</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Jumlah (Rp)</label>
            <Input type="number" min="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nomor Formulir/Kwitansi (Opsional)</label>
            <Input value={formData.formNo} onChange={e => setFormData({ ...formData, formNo: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Penerima Dana (Opsional)</label>
            <Input value={formData.recipientName} onChange={e => setFormData({ ...formData, recipientName: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Keterangan Tambahan / Keperluan</label>
            <textarea 
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main" 
              rows={3} 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              required
            />
          </div>
          
          <div className="md:col-span-2 flex gap-3 mt-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white border-transparent">Simpan Pengeluaran</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full border-collapse text-left min-w-[800px]">
          <thead>
            <tr className="border-b-2 border-border text-text-muted text-sm uppercase tracking-wider bg-surface">
              <SortableHeader label="Tanggal" sortKey="date" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
              <SortableHeader label="No Referensi" sortKey="referenceNo" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
              <SortableHeader label="Penerima/Keterangan" sortKey="recipientName" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
              <SortableHeader label="Akun" sortKey="akunDetail.name" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} />
              <SortableHeader label="Nominal" sortKey="amount" currentSortKey={sortConfig?.key as string} currentDirection={sortConfig?.direction} onSort={requestSort as any} className="text-right" />
            </tr>
          </thead>
          <tbody>
            {sortedData.map(item => (
              <tr key={item.id} className="border-b border-border hover:bg-gray-50/50 transition-colors">
                <td className="p-4 text-text-main">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                <td className="p-4 font-semibold text-text-main">{item.referenceNo}</td>
                <td className="p-4">
                  <div className="font-semibold text-text-main">{item.recipientName || "-"}</div>
                  <div className="text-sm text-text-muted mt-0.5">{item.description}</div>
                </td>
                <td className="p-4 text-text-main">
                  {item.akunDetail ? `[${item.akunDetail.code}] ${item.akunDetail.name}` : "-"}
                </td>
                <td className="p-4 text-right font-bold text-red-500">
                  {formatRp(Number(item.amount))}
                </td>
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted">Belum ada data Kas Keluar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
