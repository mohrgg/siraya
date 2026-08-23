"use client"

import { Users, Building } from "lucide-react"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { useUserData } from "./hooks/useUserData"

import UserList from "./components/UserList"
import DivisiList from "./components/DivisiList"
import UserModal from "./components/UserModal"
import DivisiModal from "./components/DivisiModal"

export default function UserClient({
  initialUsers, initialDivisi, units
}: {
  initialUsers: any[], initialDivisi: any[], units: any[]
}) {
  const {
    activeTab, setActiveTab,
    divisis,
    searchQuery, setSearchQuery,
    filterRole, setFilterRole,
    filterUnit, setFilterUnit,
    filteredUsers,
    showUserModal, setShowUserModal,
    formUser, setFormUser,
    isSubmitting,
    resetUserId, setResetUserId,
    disableUserId, setDisableUserId,
    showDivModal, setShowDivModal,
    formDiv, setFormDiv,
    deleteDivId, setDeleteDivId,
    openAddUser, openEditUser,
    handleSubmitUser, handleResetPass, handleDisableUser,
    handleSubmitDivisi, handleDeleteDivisi
  } = useUserData(initialUsers, initialDivisi, units)

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Manajemen User & Divisi</h1>
          <p className="text-text-muted">Kelola akses sistem, role, divisi, dan unit kerja untuk staf Anda.</p>
        </div>
      </div>

      <ConfirmModal isOpen={!!resetUserId} title="Reset Password" message="Yakin ingin mereset password pengguna ini menjadi 'albas123'?" onCancel={() => setResetUserId(null)} onConfirm={handleResetPass} isLoading={isSubmitting} />
      <ConfirmModal isOpen={!!disableUserId} title="Nonaktifkan Akun" message="Yakin ingin menonaktifkan pengguna ini? Mereka tidak akan bisa login lagi ke sistem." onCancel={() => setDisableUserId(null)} onConfirm={handleDisableUser} isLoading={isSubmitting} />
      <ConfirmModal isOpen={!!deleteDivId} title="Hapus Divisi" message="Yakin ingin menghapus divisi ini?" onCancel={() => setDeleteDivId(null)} onConfirm={handleDeleteDivisi} isLoading={isSubmitting} />

      {/* CONTENT CARD */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col mb-6">
        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button 
            onClick={() => setActiveTab("users")} 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main"}`}
          >
            Daftar Pengguna Sistem
          </button>
          <button 
            onClick={() => setActiveTab("divisi")} 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "divisi" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main"}`}
          >
            Master Divisi
          </button>
        </div>

        {activeTab === "users" && (
          <UserList 
            filteredUsers={filteredUsers}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            filterRole={filterRole} setFilterRole={setFilterRole}
            filterUnit={filterUnit} setFilterUnit={setFilterUnit}
            units={units}
            openAddUser={openAddUser} openEditUser={openEditUser}
            setResetUserId={setResetUserId} setDisableUserId={setDisableUserId}
          />
        )}

        {activeTab === "divisi" && (
          <DivisiList 
            divisis={divisis}
            setFormDiv={setFormDiv}
            setShowDivModal={setShowDivModal}
            setDeleteDivId={setDeleteDivId}
          />
        )}
      </div>

      <UserModal 
        showUserModal={showUserModal} setShowUserModal={setShowUserModal}
        formUser={formUser} setFormUser={setFormUser}
        handleSubmitUser={handleSubmitUser} isSubmitting={isSubmitting}
        units={units} divisis={divisis}
      />

      <DivisiModal 
        showDivModal={showDivModal} setShowDivModal={setShowDivModal}
        formDiv={formDiv} setFormDiv={setFormDiv}
        handleSubmitDivisi={handleSubmitDivisi} isSubmitting={isSubmitting}
      />
    </div>
  )
}
