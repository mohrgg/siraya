"use client"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Briefcase, User, GraduationCap, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/Button"

import TabKepegawaian from "./guru-tabs/TabKepegawaian"
import TabPribadi from "./guru-tabs/TabPribadi"
import TabPendidikan from "./guru-tabs/TabPendidikan"
import TabHonorarium from "./guru-tabs/TabHonorarium"

interface GuruFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData: any
  schoolUnits: any[]
}

const TABS = [
  { id: "kepegawaian", label: "Informasi Kepegawaian", icon: Briefcase },
  { id: "pribadi", label: "Identitas & Kontak", icon: User },
  { id: "pendidikan", label: "Kualifikasi Akademik", icon: GraduationCap },
  { id: "honorarium", label: "Rekening Bank & Honor", icon: CreditCard },
]

export default function GuruFormModal({ isOpen, onClose, onSave, initialData, schoolUnits }: GuruFormModalProps) {
  const [activeTab, setActiveTab] = useState("kepegawaian")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        statusKepegawaian: initialData?.statusKepegawaian || "-",
        pendidikan: initialData?.pendidikan || "S1",
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      })
      setActiveTab("kepegawaian")
    }
  }, [isOpen, initialData])

  if (!isOpen || !mounted) return null

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

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-surface rounded-2xl shadow-xl border border-border flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-bg rounded-t-2xl shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-albas-green m-0">
              {formData.id ? "Edit Data Profil Guru & Staf" : "Tambah Guru & Staf Baru"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Kelengkapan data kepegawaian dan profil pengajar sesuai standar sekolah.</p>
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
              <form id="guruForm" onSubmit={handleSubmit}>
                {activeTab === "kepegawaian" && <TabKepegawaian formData={formData} handleChange={handleChange} schoolUnits={schoolUnits} />}
                {activeTab === "pribadi" && <TabPribadi formData={formData} handleChange={handleChange} />}
                {activeTab === "pendidikan" && <TabPendidikan formData={formData} handleChange={handleChange} />}
                {activeTab === "honorarium" && <TabHonorarium formData={formData} handleChange={handleChange} />}
              </form>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border bg-gray-50/50 flex justify-between items-center rounded-b-2xl shrink-0">
              <span className="text-xs text-text-muted hidden sm:inline">
                Pastikan bertanda (<span className="text-red-500">*</span>) telah terisi dengan benar.
              </span>
              <div className="flex gap-2.5 ml-auto">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" form="guruForm" isLoading={isSubmitting}>
                  Simpan Data Guru
                </Button>
              </div>
            </div>
          </div>
        </div>
    </div></div>,
    document.body
  )
}
