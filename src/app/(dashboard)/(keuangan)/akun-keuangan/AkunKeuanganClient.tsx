"use client"

import { useState } from "react"
import { Plus, Folder, FolderOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { tambahKlasifikasiAkun, tambahSubKlasifikasiAkun, tambahAkunDetail } from "@/actions/akun-keuangan"

type Classification = any
type SchoolUnit = any

export default function AkunKeuanganClient({ 
  initialData, schoolUnits, initialUnitId 
}: { 
  initialData: Classification[], schoolUnits: SchoolUnit[], initialUnitId: string 
}) {
  const [data, setData] = useState<Classification[]>(initialData)
  
  // State form
  const [showAddClass, setShowAddClass] = useState(false)
  const [formClass, setFormClass] = useState({ name: "", unitSekolahId: initialUnitId })

  const [showAddSub, setShowAddSub] = useState(false)
  const [formSub, setFormSub] = useState({ name: "", code: "", klasifikasiAkunId: "" })

  const [showAddDetail, setShowAddDetail] = useState(false)
  const [formDetail, setFormDetail] = useState({ name: "", code: "", subKlasifikasiAkunId: "", bankAccountNumber: "" })

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tambahKlasifikasiAkun(formClass)
      setData([...data, { ...res, subKlasifikasiAkun: [] }])
      setShowAddClass(false)
      setFormClass({ ...formClass, name: "" })
    } catch (err: any) { alert(err.message) }
  }

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tambahSubKlasifikasiAkun(formSub)
      setData(data.map(d => d.id === formSub.klasifikasiAkunId ? { ...d, subKlasifikasiAkun: [...(d.subKlasifikasiAkuns || []), { ...res, akunDetail: [] }] } : d))
      setShowAddSub(false)
      setFormSub({ ...formSub, name: "", code: "" })
    } catch (err: any) { alert(err.message) }
  }

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await tambahAkunDetail(formDetail)
      setData(data.map(d => ({
        ...d,
        subKlasifikasiAkun: d.subKlasifikasiAkuns.map((s: any) => 
          s.id === formDetail.subKlasifikasiAkunId ? { ...s, akunDetail: [...(s.akunDetails || []), res] } : s
        )
      })))
      setShowAddDetail(false)
      setFormDetail({ ...formDetail, name: "", code: "", bankAccountNumber: "" })
    } catch (err: any) { alert(err.message) }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <Button onClick={() => setShowAddClass(true)}>
          <Plus size={16} className="mr-2" /> Klasifikasi Utama
        </Button>
        <Button variant="outline" onClick={() => setShowAddSub(true)}>
          <Plus size={16} className="mr-2" /> Sub Klasifikasi
        </Button>
        <Button variant="outline" onClick={() => setShowAddDetail(true)}>
          <Plus size={16} className="mr-2" /> Akun Detail
        </Button>
      </div>

      {showAddClass && (
        <div className="bg-surface rounded-2xl shadow-sm border-l-4 border-l-albas-green border-y border-r border-border p-6 mb-6">
          <h4 className="m-0 mb-4 text-lg font-bold text-albas-green">Tambah Klasifikasi Utama Baru</h4>
          <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Nama Klasifikasi (Cth: HARTA)</label>
              <Input value={formClass.name} onChange={e => setFormClass({ ...formClass, name: e.target.value })} required />
            </div>
            <div className="flex gap-2 h-[42px] items-center">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddClass(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      {showAddSub && (
        <div className="bg-surface rounded-2xl shadow-sm border-l-4 border-l-albas-green border-y border-r border-border p-6 mb-6">
          <h4 className="m-0 mb-4 text-lg font-bold text-albas-green">Tambah Sub Klasifikasi Baru</h4>
          <form onSubmit={handleAddSub} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Pilih Induk (Klasifikasi Utama)</label>
              <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formSub.klasifikasiAkunId} onChange={e => setFormSub({ ...formSub, klasifikasiAkunId: e.target.value })} required>
                <option value="">-- Pilih --</option>
                {data.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Kode (Cth: 1.1)</label>
              <Input value={formSub.code} onChange={e => setFormSub({ ...formSub, code: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Nama Sub (Cth: KAS & BANK)</label>
              <Input value={formSub.name} onChange={e => setFormSub({ ...formSub, name: e.target.value })} required />
            </div>
            <div className="flex gap-2 h-[42px] items-center">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddSub(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      {showAddDetail && (
        <div className="bg-surface rounded-2xl shadow-sm border-l-4 border-l-albas-green border-y border-r border-border p-6 mb-6">
          <h4 className="m-0 mb-4 text-lg font-bold text-albas-green">Tambah Akun Detail Baru</h4>
          <form onSubmit={handleAddDetail} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Pilih Sub Klasifikasi</label>
              <select className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-text-main font-medium" value={formDetail.subKlasifikasiAkunId} onChange={e => setFormDetail({ ...formDetail, subKlasifikasiAkunId: e.target.value })} required>
                <option value="">-- Pilih --</option>
                {data.flatMap(d => d.subKlasifikasiAkuns).map((s: any) => s && <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Kode Akun Detail (Cth: 1.1.01)</label>
              <Input value={formDetail.code} onChange={e => setFormDetail({ ...formDetail, code: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main">Nama Akun (Cth: Kas Kecil Tunai)</label>
              <Input value={formDetail.name} onChange={e => setFormDetail({ ...formDetail, name: e.target.value })} required />
            </div>
            <div className="flex gap-2 h-[42px] items-center">
              <Button type="submit">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddDetail(false)}>Batal</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {data.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Belum ada data Chart of Accounts. Silakan mulai dengan membuat Klasifikasi Utama.</div>
        ) : (
          <div className="p-6">
            {data.map(cls => (
              <div key={cls.id} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 font-bold text-lg mb-2 text-text-main">
                  <FolderOpen size={20} className="text-albas-green" /> {cls.name}
                </div>
                
                <div className="pl-6">
                  {cls.subKlasifikasiAkuns?.map((sub: any) => (
                    <div key={sub.id} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 font-semibold mb-2 text-text-muted">
                        <Folder size={16} /> [{sub.code}] {sub.name}
                      </div>
                      
                      <div className="pl-6">
                        <table className="w-full border-collapse">
                          <tbody>
                            {sub.akunDetails?.map((acc: any) => (
                              <tr key={acc.id} className="border-b border-bg hover:bg-gray-50/50 transition-colors">
                                <td className="p-2 w-36">
                                  <div className="flex items-center gap-2 text-text-muted">
                                    <FileText size={14} /> {acc.code}
                                  </div>
                                </td>
                                <td className="p-2 text-text-main">{acc.name}</td>
                              </tr>
                            ))}
                            {(!sub.akunDetails || sub.akunDetails.length === 0) && (
                              <tr>
                                <td colSpan={2} className="p-2 text-text-muted text-sm italic">
                                  Belum ada akun detail di sub klasifikasi ini.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  {(!cls.subKlasifikasiAkuns || cls.subKlasifikasiAkuns.length === 0) && (
                    <div className="text-text-muted text-sm italic pl-6">Belum ada sub klasifikasi.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
