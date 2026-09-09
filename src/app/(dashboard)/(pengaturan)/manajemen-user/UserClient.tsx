"use client"

import { Users, UserCheck, UserX, Building } from "lucide-react"
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
    showDivModal, setShowDivModal,
    formDiv, setFormDiv,
    deleteDivId, setDeleteDivId,
    openAddUser, openEditUser,
    handleSubmitUser, handleResetPass, handleDisableUser, handleActivateUser,
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
      <ConfirmModal isOpen={!!activateUserId} title="Aktifkan Akun" message="Yakin ingin mengaktifkan kembali pengguna ini agar dapat login ke sistem?" onCancel={() => setActivateUserId(null)} onConfirm={handleActivateUser} isLoading={isSubmitting} />
      <ConfirmModal isOpen={!!deleteDivId} title="Hapus Divisi" message="Yakin ingin menghapus divisi ini?" onCancel={() => setDeleteDivId(null)} onConfirm={handleDeleteDivisi} isLoading={isSubmitting} />

      {/* CONTENT CARD */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col mb-6">
        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          <button 
            onClick={() => setActiveTab("active")} 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "active" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main"}`}
          >
            <UserCheck size={16} />
            Pengguna Aktif
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "active" ? "bg-primary/10 text-primary" : "bg-bg text-text-muted border border-border"}`}>
              {activeCount}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("inactive")} 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "inactive" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main"}`}
          >
            <UserX size={16} />
            Pengguna Nonaktif
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "inactive" ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-bg text-text-muted border border-border"}`}>
              {inactiveCount}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("divisi")} 
            className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "divisi" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main"}`}
          >
            <Building size={16} />
            Master Divisi
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === "divisi" ? "bg-primary/10 text-primary" : "bg-bg text-text-muted border border-border"}`}>
              {divisis.length}
            </span>
          </button>
        </div>

        {activeTab === "active" && (
          <UserList 
            filteredUsers={filteredUsers}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            filterRole={filterRole} setFilterRole={setFilterRole}
            filterUnit={filterUnit} setFilterUnit={setFilterUnit}
            units={units}
            openAddUser={openAddUser} openEditUser={openEditUser}
            setResetUserId={setResetUserId} setDisableUserId={setDisableUserId}
            isInactiveTab={false}
            setActivateUserId={setActivateUserId}
          />
        )}

        {activeTab === "inactive" && (
          <UserList 
            filteredUsers={filteredUsers}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            filterRole={filterRole} setFilterRole={setFilterRole}
            filterUnit={filterUnit} setFilterUnit={setFilterUnit}
            units={units}
            openAddUser={openAddUser} openEditUser={openEditUser}
            setResetUserId={setResetUserId} setDisableUserId={setDisableUserId}
            isInactiveTab={true}
            setActivateUserId={setActivateUserId}
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
