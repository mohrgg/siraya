"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  FileText, 
  PieChart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  BookOpen,
  Calendar,
  Users2,
  GraduationCap,
  Landmark,
  Receipt,
  Key
} from "lucide-react"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import ChangePasswordModal from "@/components/modals/ChangePasswordModal"

const menuGroups = [
  {
    title: "UTAMA",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
    ]
  },
  {
    title: "DATA YAYASAN",
    items: [
      { href: "/unit-sekolah", label: "Unit Sekolah", icon: Building, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
      { href: "/jurusan", label: "Program & Jurusan", icon: BookOpen, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
    ]
  },
  {
    title: "DATA AKADEMIK",
    items: [
      { href: "/tahun-akademik", label: "Tahun Akademik", icon: Calendar, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
      { href: "/guru", label: "Guru & Staf", icon: GraduationCap, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
      { href: "/kelas", label: "Kelas & Murid", icon: Users2, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
    ]
  },
  {
    title: "KEUANGAN",
    items: [
      { href: "/akun-keuangan", label: "Akun Keuangan", icon: Landmark, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"] },
    ]
  },

  {
    title: "PENGATURAN",
    items: [
      { href: "/manajemen-user", label: "Manajemen User", icon: Users, allowedRoles: ["ADMIN"] },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, allowedRoles: ["ADMIN"] },
    ]
  }
] as { title: string, items: { href: string, label: string, icon: any, allowedRoles: string[] }[] }[]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.allowedRoles.includes(user?.role || "TATA_USAHA"))
  })).filter(group => group.items.length > 0)

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
  }

  return (
    <>
      <aside className={`bg-[#065f32] text-white h-full border-r border-[#0a753d] flex flex-col transition-all duration-300 relative z-40 ${isCollapsed ? "w-20" : "w-[265px]"}`}>
        {/* Floating Toggle Button (Right Edge) */}
        <button 
          className="absolute -right-3 top-8 w-7 h-7 rounded-full bg-surface border border-border text-primary flex items-center justify-center hover:bg-surface-hover z-50 shadow-md transition-transform"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex items-center p-5 gap-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/logo.png" alt="Logo Al Basyariah" className="w-full h-full object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden font-bold text-primary text-xl">AB</div>
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden">
              <span className="font-bold text-lg leading-tight tracking-tight text-white">SIRAYA</span>
              <span className="text-[10px] text-white/70 truncate">Sistem Informasi Yayasan Al Basyariah</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 overflow-x-hidden custom-scrollbar">
          {filteredGroups.map((group, groupIndex) => (
            <div key={group.title} className={`${isCollapsed ? "mb-0" : "mb-2"}`}>
              {group.title !== "UTAMA" && !isCollapsed && (
                <div className="text-[10px] font-bold text-white/50 tracking-wider mb-2 mt-4 px-3 uppercase">
                  {group.title}
                </div>
              )}
              {group.title !== "UTAMA" && isCollapsed && (
                 <div className="h-px bg-white/10 my-4 mx-3" />
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? "bg-white/20 text-white shadow-sm border border-white/10" 
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      } ${isCollapsed ? "justify-center" : "justify-start"}`}
                      title={isCollapsed ? item.label : ""}
                    >
                      <Icon size={20} className={isActive ? "text-white" : "text-white/80"} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(user?.name || "")}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-semibold text-white truncate">{user?.name || "User"}</span>
                <span className="text-xs text-white/60 truncate">{user?.role}</span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors" 
                  title="Ganti Password" 
                >
                  <Key size={16} />
                </button>
                <button 
                  onClick={() => setShowLogoutModal(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors" 
                  title="Keluar" 
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => signOut()}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sistem?"
        confirmText="Keluar"
        cancelText="Batal"
        confirmVariant="primary"
      />

      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  )
}
