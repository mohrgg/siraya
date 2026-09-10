"use client"

import { Users, UserCheck, UserX, Building } from "lucide-react"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { TabNavigation } from "@/components/ui/TabNavigation"
import { useUserData } from "./hooks/useUserData"

import UserList from "./components/UserList"
import DivisiList from "./components/DivisiList"
import UserModal from "./components/UserModal"
import DivisiModal from "./components/DivisiModal"

import { PageHeader } from "@/components/ui/PageHeader"

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
    deleteUserId, setDeleteUserId,
    unlockUserId, setUnlockUserId,
    showDivModal, setShowDivModal,
    formDiv, setFormDiv,
    deleteDivId, setDeleteDivId,
    openAddUser, openEditUser,
    handleSubmitUser, handleResetPass, handleDisableUser, handleActivateUser, handleDeleteUserPermanen,
    handleUnlockUser,
    handleSubmitDivisi, handleDeleteDivisi
  } = useUserData(initialUsers, initialDivisi, units)

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title="Manajemen User & Divisi"
        subtitle="Kelola akses sistem, role, divisi, dan unit kerja untuk staf Anda"
      />

      <ConfirmModal isOpen={!!resetUserId} title="Reset Password" message="Yakin ingin mereset password pengguna ini menjadi 'albas123'? Pengguna akan diwajibkan mengganti kata sandi saat login berikutnya." onCancel={() => setResetUserId(null)} onConfirm={handleResetPass} isLoading={isSubmitting} confirmText="Reset Password" confirmVariant="primary" />
      <ConfirmModal isOpen={!!unlockUserId} title="Buka Kunci Akun" message="Yakin ingin membuka kunci akun ini sekarang? Percobaan login gagal akan direset menjadi 0 sehingga pengguna dapat langsung login kembali." onCancel={() => setUnlockUserId(null)} onConfirm={handleUnlockUser} isLoading={isSubmitting} confirmText="Buka Kunci Akun" confirmVariant="primary" />
      <ConfirmModal isOpen={!!disableUserId} title="Nonaktifkan Akun" message="Yakin ingin menonaktifkan pengguna ini? Mereka tidak akan bisa login lagi ke sistem." onCancel={() => setDisableUserId(null)} onConfirm={handleDisableUser} isLoading={isSubmitting} confirmText="Nonaktifkan" confirmVariant="danger" />
      <ConfirmModal isOpen={!!activateUserId} title="Aktifkan Akun" message="Yakin ingin mengaktifkan kembali pengguna ini agar dapat login ke sistem?" onCancel={() => setActivateUserId(null)} onConfirm={handleActivateUser} isLoading={isSubmitting} confirmText="Aktifkan Akun" confirmVariant="primary" />
      <ConfirmModal isOpen={!!deleteUserId} title="Hapus Pengguna Permanen" message="PERINGATAN: Akun ini akan dihapus secara permanen dari basis data dan tidak dapat dipulihkan. Seluruh riwayat aktivitas pada audit log akan tetap aman diarsipkan. Yakin ingin menghapus permanen?" onCancel={() => setDeleteUserId(null)} onConfirm={handleDeleteUserPermanen} isLoading={isSubmitting} confirmText="Hapus Permanen" confirmVariant="danger" />
      <ConfirmModal isOpen={!!deleteDivId} title="Hapus Divisi" message="Yakin ingin menghapus divisi ini?" onCancel={() => setDeleteDivId(null)} onConfirm={handleDeleteDivisi} isLoading={isSubmitting} confirmText="Hapus Divisi" confirmVariant="danger" />

      {/* CONTENT CARD */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col mb-6">
        {/* Tab Navigation Standar Siraya */}
        <TabNavigation
          tabs={[
            { id: "active", label: "Pengguna Aktif", icon: UserCheck, badge: activeCount },
            { id: "inactive", label: "Pengguna Nonaktif", icon: UserX, badge: inactiveCount },
            { id: "divisi", label: "Master Divisi", icon: Building, badge: divisis.length }
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as "active" | "inactive" | "divisi")}
        />

        {activeTab === "active" && (
          <UserList 
            filteredUsers={filteredUsers}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            filterRole={filterRole} setFilterRole={setFilterRole}
            filterUnit={filterUnit} setFilterUnit={setFilterUnit}
            units={units}
            openAddUser={openAddUser} openEditUser={openEditUser}
            setResetUserId={setResetUserId} setDisableUserId={setDisableUserId}
            setUnlockUserId={setUnlockUserId}
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
            setUnlockUserId={setUnlockUserId}
            isInactiveTab={true}
            setActivateUserId={setActivateUserId}
            setDeleteUserId={setDeleteUserId}
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
