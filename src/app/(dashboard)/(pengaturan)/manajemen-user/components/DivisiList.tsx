import { Edit2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Toolbar, ToolbarActions, ToolbarRefreshButton, ToolbarAddButton } from "@/components/ui/DataTableToolbar"
import { TableScrollHint } from "@/components/ui/TableScrollHint"

export default function DivisiList({ divisis, setFormDiv, setShowDivModal, setDeleteDivId }: any) {
  const router = useRouter()
  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <Toolbar>
          <h2 className="font-bold text-text-main text-base sm:text-lg">Daftar Divisi</h2>
          <ToolbarActions>
            <ToolbarRefreshButton onClick={() => router.refresh()} title="Segarkan Data" />
            <ToolbarAddButton onClick={() => { setFormDiv({id: "", name: "", description: ""}); setShowDivModal(true) }}>
              Tambah Divisi
            </ToolbarAddButton>
          </ToolbarActions>
        </Toolbar>
      </div>
      <TableScrollHint totalRows={divisis.length} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-text-muted text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Nama Divisi</th>
              <th className="p-4 font-semibold">Keterangan</th>
              <th className="p-4 font-semibold text-right w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {divisis.map((d: any) => (
              <tr key={d.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
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
    </div>
  )
}
