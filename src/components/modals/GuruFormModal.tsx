"use client"
import { useState, useEffect } from "react"
import { Briefcase, User, GraduationCap, CreditCard, Save } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { SideDrawer } from "@/components/ui/SideDrawer"

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
  availableStatuses?: any[]
  activeUnitId?: string
  userRole?: string
}

const TABS = [
  { id: "pribadi", label: "Identitas", icon: User },
  { id: "kepegawaian", label: "Kepegawaian", icon: Briefcase },
  { id: "pendidikan", label: "Pendidikan", icon: GraduationCap },
  { id: "honorarium", label: "Rekening Bank", icon: CreditCard },
]

export default function GuruFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  schoolUnits,
  availableStatuses,
  activeUnitId,
  userRole,
}: GuruFormModalProps) {
  const [activeTab, setActiveTab] = useState("pribadi")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        jenisPtk: initialData?.jenisPtk || "GURU",
        jabatan: initialData?.jabatan || "",
        statusKepegawaian: initialData?.statusKepegawaian && initialData.statusKepegawaian !== "-" ? initialData.statusKepegawaian : "",
        pendidikan: initialData?.pendidikan || "S1",
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      })
      setActiveTab("pribadi")
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
    <div className="flex justify-between items-center w-full">
      <span className="text-xs text-text-muted hidden sm:inline">
        Pastikan bertanda (<span className="text-red-500">*</span>) terisi.
      </span>
      <div className="flex gap-2.5 ml-auto">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" form="guruForm" isLoading={isSubmitting} className="flex items-center gap-2">
          <Save size={16} /> Simpan Data
        </Button>
      </div>
    </div>
  )

  const isStaf = formData.jenisPtk === "STAF"
  const modalTitle = formData.id 
    ? (isStaf ? "Edit Profil Staf & Karyawan" : "Edit Profil Guru")
    : (isStaf ? "Tambah Staf & Karyawan (Tendik)" : "Tambah Guru (Tenaga Pendidik)")
  const modalSubtitle = isStaf
    ? "Kelengkapan data kepegawaian dan penugasan operasional non-kependidikan."
    : "Kelengkapan data kepegawaian dan profil pengajar."

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={<Briefcase className="text-primary" />}
      widthClassName="max-w-3xl"
      footer={footer}
    >
      <div className="flex flex-col space-y-6">
        {/* Horizontal Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar border-b border-border pb-2 shrink-0 gap-2">
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
        <div className="flex-1">
          <form id="guruForm" onSubmit={handleSubmit} className="space-y-6 pb-6">
            {activeTab === "pribadi" && <TabPribadi formData={formData} handleChange={handleChange} />}
            {activeTab === "kepegawaian" && (
              <TabKepegawaian
                formData={formData}
                handleChange={handleChange}
                schoolUnits={schoolUnits}
                activeUnitId={activeUnitId}
                userRole={userRole}
              />
            )}
            {activeTab === "pendidikan" && <TabPendidikan formData={formData} handleChange={handleChange} />}
            {activeTab === "honorarium" && <TabHonorarium formData={formData} handleChange={handleChange} />}
          </form>
        </div>
      </div>
    </SideDrawer>
  )
}
