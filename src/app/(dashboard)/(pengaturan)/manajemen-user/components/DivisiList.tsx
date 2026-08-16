import { Edit2, XCircle } from "lucide-react"
import { Toolbar, ToolbarActions, ToolbarAddButton } from "@/components/ui/DataTableToolbar"

export default function DivisiList({ divisis, setFormDiv, setShowDivModal, setDeleteDivId }: any) {
  return (
    <div className="flex flex-col">
      <div className="p-6 bg-white border-b border-gray-100">
        <Toolbar>
          <h2 className="font-bold text-gray-900 text-lg">Daftar Divisi</h2>
          <ToolbarActions>
            <ToolbarAddButton onClick={() => { setFormDiv({id: "", name: "", description: ""}); setShowDivModal(true) }}>
              Tambah Divisi
            </ToolbarAddButton>
          </ToolbarActions>
        </Toolbar>
      </div>
      <table className="w-full text-left text-sm border-collapse bg-white">
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
