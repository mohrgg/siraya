import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

export default function DivisiModal({ 
  showDivModal, setShowDivModal, 
  formDiv, setFormDiv, 
  handleSubmitDivisi, isSubmitting 
}: any) {
  if (!showDivModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
      <form onSubmit={handleSubmitDivisi} className="w-full max-w-sm bg-surface rounded-2xl shadow-xl border border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-lg">{formDiv.id ? "Edit" : "Tambah"} Divisi</h3>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Nama Divisi <span className="text-red-500">*</span></label>
            <Input value={formDiv.name} onChange={e => setFormDiv({...formDiv, name: e.target.value})} required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Keterangan</label>
            <Input value={formDiv.description} onChange={e => setFormDiv({...formDiv, description: e.target.value})} />
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => setShowDivModal(false)}>Batal</Button>
          <Button type="submit" isLoading={isSubmitting}>Simpan</Button>
        </div>
      </form>
    </div>
  )
}
