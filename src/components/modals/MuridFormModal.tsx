"use client"
import { useState, useEffect } from "react"
import { User, Users, HeartPulse, GraduationCap, Save } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SideDrawer } from "@/components/ui/SideDrawer"

import TabInformasiUmum from "./murid-tabs/TabInformasiUmum"
import TabIdentitasPribadi from "./murid-tabs/TabIdentitasPribadi"
import TabFisikMedis from "./murid-tabs/TabFisikMedis"
import TabKeluarga from "./murid-tabs/TabKeluarga"

interface MuridFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData: any
  schoolUnits: any[]
  classrooms: any[]
  activeUnitId?: string
}

const TABS = [
  { id: "utama", label: "Informasi Umum", icon: GraduationCap },
  { id: "pribadi", label: "Identitas", icon: User },
  { id: "medis", label: "Fisik & Medis", icon: HeartPulse },
  { id: "keluarga", label: "Keluarga & Wali", icon: Users },
]

export default function MuridFormModal({ isOpen, onClose, onSave, initialData, schoolUnits, classrooms, activeUnitId }: MuridFormModalProps) {
  const [activeTab, setActiveTab] = useState("utama")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        // Ensure nested values like riwayatKelas are extracted correctly if editing
        subKelasId: initialData.subKelasId || initialData.riwayatKelas?.[0]?.subKelasId || "",
      })
      setActiveTab("utama")
    }
  }, [isOpen, initialData])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const footer = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
      <span className="text-xs text-text-muted hidden sm:inline">
        Pastikan data wajib telah terisi dengan benar.
      </span>
      <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto ml-auto">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px] font-semibold">
          Batal
        </Button>
        <Button type="submit" form="muridForm" isLoading={isSubmitting} className="w-full sm:w-auto min-h-[44px] font-bold shadow-sm shadow-primary/20 flex items-center justify-center gap-2">
          <Save size={16} /> {formData.id ? "Simpan Perubahan" : "Simpan Data"}
        </Button>
      </div>
    </div>
  )

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={formData.id ? "Edit Profil Murid" : "Tambah Murid Baru"}
      subtitle="Kelengkapan data profil sesuai standar Dapodik."
      icon={<User className="text-primary" />}
      widthClassName="max-w-3xl"
      footer={footer}
    >
      <div className="flex flex-col space-y-6 w-full min-w-0 max-w-full">
        {/* Horizontal Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar border-b border-border pb-2 shrink-0 gap-2 w-full max-w-full">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                  ${isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-muted bg-gray-50 border border-transparent hover:bg-gray-100 hover:text-text-main'}`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-text-muted'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
          <form id="muridForm" onSubmit={handleSubmit} className="space-y-6 pb-6 w-full min-w-0 max-w-full">
            {activeTab === "utama" && <TabInformasiUmum formData={formData} handleChange={handleChange} schoolUnits={schoolUnits} classrooms={classrooms} activeUnitId={activeUnitId} />}
            {activeTab === "pribadi" && <TabIdentitasPribadi formData={formData} handleChange={handleChange} />}
            {activeTab === "medis" && <TabFisikMedis formData={formData} handleChange={handleChange} />}
            {activeTab === "keluarga" && <TabKeluarga formData={formData} handleChange={handleChange} />}
          </form>
        </div>
      </div>
    </SideDrawer>
  )
}
