"use client"
import { useState, useEffect } from "react"
import { X, User, Users, HeartPulse, GraduationCap, MapPin, Save } from "lucide-react"
import { Button } from "@/components/ui/Button"

import TabUtama from "./murid-tabs/TabUtama"
import TabPribadi from "./murid-tabs/TabPribadi"
import TabPendidikan from "./murid-tabs/TabPendidikan"
import TabKeluarga from "./murid-tabs/TabKeluarga"
import TabKesehatan from "./murid-tabs/TabKesehatan"

interface MuridFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData: any
  schoolUnits: any[]
  classrooms: any[]
}

const TABS = [
  { id: "utama", label: "Informasi Utama", icon: GraduationCap },
  { id: "pribadi", label: "Identitas Pribadi", icon: User },
  { id: "pendidikan", label: "Pendidikan & Periodik", icon: MapPin },
  { id: "keluarga", label: "Data Keluarga", icon: Users },
  { id: "kesehatan", label: "Riwayat Kesehatan", icon: HeartPulse },
]

export default function MuridFormModal({ isOpen, onClose, onSave, initialData, schoolUnits, classrooms }: MuridFormModalProps) {
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

  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-albas-green m-0">
              {formData.id ? "Edit Data Profil Murid" : "Tambah Murid Baru"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Kelengkapan data profil sesuai standar Dapodik.</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        
        {/* Body Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 md:w-64 border-r border-border bg-gray-50/50 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left
                    ${isActive ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-white hover:text-text-main hover:shadow-sm'}`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-text-muted'} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white">
              <form id="muridForm" onSubmit={handleSubmit}>
                {activeTab === "utama" && <TabUtama formData={formData} handleChange={handleChange} schoolUnits={schoolUnits} classrooms={classrooms} />}
                {activeTab === "pribadi" && <TabPribadi formData={formData} handleChange={handleChange} />}
                {activeTab === "pendidikan" && <TabPendidikan formData={formData} handleChange={handleChange} />}
                {activeTab === "keluarga" && <TabKeluarga formData={formData} handleChange={handleChange} />}
                {activeTab === "kesehatan" && <TabKesehatan formData={formData} handleChange={handleChange} />}
              </form>
            </div>
            
            {/* Footer Form Actions */}
            <div className="p-5 border-t border-border bg-gray-50/50 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" form="muridForm" isLoading={isSubmitting} className="flex items-center gap-2">
                <Save size={16} /> {formData.id ? "Simpan Perubahan" : "Simpan Data Murid"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
