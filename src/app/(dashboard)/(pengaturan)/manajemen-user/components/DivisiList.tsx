import { Edit2, XCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function DivisiList({ divisis, setFormDiv, setShowDivModal, setDeleteDivId }: any) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden max-w-3xl">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-bold text-text-main">Daftar Divisi</h2>
        <Button onClick={() => { setFormDiv({id: "", name: "", description: ""}); setShowDivModal(true) }}>
          <Plus size={16} className="mr-1.5" /> Tambah Divisi
        </Button>
      </div>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-bg border-b border-border text-text-muted">
            <th className="p-4 font-semibold">Nama Divisi</th>
            <th className="p-4 font-semibold">Keterangan</th>
            <th className="p-4 font-semibold text-center w-24">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {divisis.map((d: any) => (
            <tr key={d.id} className="border-b border-border">
              <td className="p-4 font-bold text-text-main">{d.name}</td>
              <td className="p-4 text-text-muted">{d.description || "-"}</td>
              <td className="p-4 text-center flex gap-1 justify-center">
                <button onClick={() => { setFormDiv({id: d.id, name: d.name, description: d.description || ""}); setShowDivModal(true) }} className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteDivId(d.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><XCircle size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
