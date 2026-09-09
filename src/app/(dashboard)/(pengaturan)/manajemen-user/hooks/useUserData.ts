import { useState, useMemo } from "react"
import { 
  tambahPengguna, editPengguna, resetPasswordPengguna, nonaktifkanPengguna, aktifkanPengguna, hapusPenggunaPermanen,
  tambahDivisi, editDivisi, hapusDivisi 
} from "@/actions/pengguna"
import toast from "react-hot-toast"

export function useUserData(initialUsers: any[], initialDivisi: any[], units: any[]) {
  const [activeTab, setActiveTab] = useState<"active" | "inactive" | "divisi">("active")
  const [users, setUsers] = useState(initialUsers)
  const [divisis, setDivisis] = useState(initialDivisi)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterUnit, setFilterUnit] = useState("")

  // Modals state User
  const [showUserModal, setShowUserModal] = useState(false)
  const [formUser, setFormUser] = useState({ id: "", name: "", email: "", role: "TATA_USAHA", unitSekolahId: "", divisiId: "", isActive: true, password: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [disableUserId, setDisableUserId] = useState<string | null>(null)
  const [activateUserId, setActivateUserId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  
  // Modals state Divisi
  const [showDivModal, setShowDivModal] = useState(false)
  const [formDiv, setFormDiv] = useState({ id: "", name: "", description: "" })
  const [deleteDivId, setDeleteDivId] = useState<string | null>(null)

  // Tab counts
  const activeCount = useMemo(() => users.filter(u => u.isActive).length, [users])
  const inactiveCount = useMemo(() => users.filter(u => !u.isActive).length, [users])

  // Derived filtered users based on activeTab
  const filteredUsers = useMemo(() => {
    const targetActive = activeTab === "active"
    return users.filter(u => {
      if (activeTab !== "divisi" && u.isActive !== targetActive) return false
      const matchSearch = (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchRole = filterRole ? u.role === filterRole : true
      const matchUnit = filterUnit ? (filterUnit === "GLOBAL" ? !u.unitSekolahId : u.unitSekolahId === filterUnit) : true
      return matchSearch && matchRole && matchUnit
    })
  }, [users, activeTab, searchQuery, filterRole, filterUnit])

  // Handlers User
  const openAddUser = () => {
    setFormUser({ id: "", name: "", email: "", role: "TATA_USAHA", unitSekolahId: "", divisiId: "", isActive: true, password: "" })
    setShowUserModal(true)
  }

  const openEditUser = (u: any) => {
    setFormUser({ 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      unitSekolahId: u.unitSekolahId || "", 
      divisiId: u.divisiId || "", 
      isActive: u.isActive, 
      password: "" 
    })
    setShowUserModal(true)
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formUser.id) {
        await editPengguna(formUser.id, formUser)
      } else {
        await tambahPengguna(formUser)
      }
      toast.success("Data pengguna berhasil disimpan!")
      window.location.reload()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleResetPass = async () => {
    if (!resetUserId) return
    setIsSubmitting(true)
    try {
      await resetPasswordPengguna(resetUserId)
      toast.success("Password direset menjadi: albas123")
      setResetUserId(null)
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleDisableUser = async () => {
    if (!disableUserId) return
    setIsSubmitting(true)
    try {
      await nonaktifkanPengguna(disableUserId)
      toast.success("Pengguna dinonaktifkan")
      window.location.reload()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleActivateUser = async () => {
    if (!activateUserId) return
    setIsSubmitting(true)
    try {
      await aktifkanPengguna(activateUserId)
      toast.success("Pengguna berhasil diaktifkan kembali")
      window.location.reload()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleDeleteUserPermanen = async () => {
    if (!deleteUserId) return
    setIsSubmitting(true)
    try {
      await hapusPenggunaPermanen(deleteUserId)
      toast.success("Pengguna berhasil dihapus permanen")
      setDeleteUserId(null)
      window.location.reload()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  // Handlers Divisi
  const handleSubmitDivisi = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (formDiv.id) await editDivisi(formDiv.id, formDiv)
      else await tambahDivisi(formDiv)
      toast.success("Data divisi berhasil disimpan!")
      window.location.reload()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleDeleteDivisi = async () => {
    if (!deleteDivId) return
    setIsSubmitting(true)
    try {
      await hapusDivisi(deleteDivId)
      toast.success("Divisi dihapus")
      window.location.reload()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  return {
    activeTab, setActiveTab,
    users, divisis,
    activeCount, inactiveCount,
    searchQuery, setSearchQuery,
    filterRole, setFilterRole,
    filterUnit, setFilterUnit,
    filteredUsers,
    showUserModal, setShowUserModal,
    formUser, setFormUser,
    isSubmitting,
    resetUserId, setResetUserId,
    disableUserId, setDisableUserId,
    activateUserId, setActivateUserId,
    deleteUserId, setDeleteUserId,
    showDivModal, setShowDivModal,
    formDiv, setFormDiv,
    deleteDivId, setDeleteDivId,
    openAddUser, openEditUser,
    handleSubmitUser, handleResetPass, handleDisableUser, handleActivateUser, handleDeleteUserPermanen,
    handleSubmitDivisi, handleDeleteDivisi
  }
}
