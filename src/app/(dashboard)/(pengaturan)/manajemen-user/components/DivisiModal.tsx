import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Briefcase } from "lucide-react"

export default function DivisiModal({ 
  showDivModal, setShowDivModal, 
  formDiv, setFormDiv, 
  handleSubmitDivisi, isSubmitting 
}: any) {
  return (
    <Modal
      isOpen={showDivModal}
      onClose={() => setShowDivModal(false)}
      title={formDiv.id ? "Edit Divisi" : "Tambah Divisi"}
      subtitle="Pengelompokan divisi kerja atau bidang tugas staf"
      icon={Briefcase}
      widthClassName="max-w-md"
      footer={
        <>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full sm:w-auto min-h-[44px] font-semibold" 
            onClick={() => setShowDivModal(false)}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            form="form-divisi" 
            className="w-full sm:w-auto min-h-[44px] font-bold shadow-sm shadow-primary/20" 
            isLoading={isSubmitting}
          >
            {formDiv.id ? "Simpan Perubahan" : "Simpan Divisi"}
          </Button>
        </>
      }
    >
      <form id="form-divisi" onSubmit={handleSubmitDivisi} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Nama Divisi <span className="text-red-500">*</span></label>
          <Input value={formDiv.name} onChange={e => setFormDiv({...formDiv, name: e.target.value})} required autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-main">Keterangan</label>
          <Input value={formDiv.description} onChange={e => setFormDiv({...formDiv, description: e.target.value})} />
        </div>
      </form>
    </Modal>
  )
}
