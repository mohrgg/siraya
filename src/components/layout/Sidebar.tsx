"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, Building, BookOpen, 
  Users2, Landmark, GraduationCap,
  Settings, LogOut, ChevronLeft, ChevronRight, Key,
  ArrowDownToLine, ArrowUpFromLine, Calendar, Users,
  FilePlus, PieChart
} from "lucide-react"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { ManageAccountModal } from "@/components/modals/ManageAccountModal"
import { formatDisplayName, formatRoleLabel, getRoleBadgeStyle } from "@/lib/helpers/user"
import { getFilteredMenuGroups } from "@/lib/constants/navigation"

export default function Sidebar({ 
  user, 
  logoUrl,
  initialCollapsed = false 
}: { 
  user: any; 
  logoUrl?: string | null;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname()
  const [currentUserName, setCurrentUserName] = useState(user?.name || "User")
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)

  useEffect(() => {
    if (user?.name) {
      setCurrentUserName(user.name)
    }
  }, [user?.name])

  // Sinkronisasi dengan localStorage saat mount
  useEffect(() => {
    const saved = localStorage.getItem("siraya_sidebar_collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem("siraya_sidebar_collapsed", String(next))
      document.cookie = `siraya_sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`
      return next
    })
  }

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showManageAccountModal, setShowManageAccountModal] = useState(false)
  const [manageAccountTab, setManageAccountTab] = useState<"profile" | "password">("profile")

  // Otomatis buka modal ganti password jika pengguna memiliki status wajib ganti password
  useEffect(() => {
    if (user?.mustChangePassword) {
      setManageAccountTab("password")
      setShowManageAccountModal(true)
    }
  }, [user?.mustChangePassword])

  const filteredGroups = getFilteredMenuGroups(user?.role)

  const displayName = formatDisplayName(currentUserName)
  const roleLabel = formatRoleLabel(user?.role)
  const roleBadgeStyle = getRoleBadgeStyle(user?.role)

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>

      {/* ======================================================== */}
      {/* 2. DESKTOP PERMANENT SIDEBAR (>=md) */}
      {/* ======================================================== */}
      <aside className={`
        hidden md:flex short:hidden hide-on-mobile-landscape bg-[#065f32] dark:bg-surface text-white dark:text-text-main h-full border-r border-[#0a753d] dark:border-border flex-col transition-all duration-300 z-30 relative shrink-0
        ${isCollapsed ? "w-20" : "w-[270px]"}
      `}>
        {/* Floating Toggle Button (Right Edge) - Desktop Only */}
        <button 
          className="absolute -right-3 top-8 w-7 h-7 rounded-full bg-surface border border-border text-primary flex items-center justify-center hover:bg-surface-hover z-50 shadow-md transition-transform cursor-pointer"
          onClick={handleToggleCollapse}
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex items-center px-4 py-3.5 gap-3 border-b border-white/10 dark:border-border shrink-0">
          <div className="w-10 h-10 shrink-0 bg-white dark:bg-bg rounded-xl flex items-center justify-center shadow-xs overflow-hidden border border-white/20 dark:border-border p-0.5">
            <img src={logoUrl || "/logo.png"} alt="Logo Al Basyariah" className="w-full h-full object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="hidden font-bold text-primary text-xl">AB</div>
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col min-w-0" title="Sistem Informasi Yayasan Al Basyariah">
              <span className="font-extrabold text-lg leading-tight tracking-tight text-white dark:text-text-main">
                SIRAYA
              </span>
              <span className="text-[10px] leading-snug text-white/80 dark:text-text-muted font-medium mt-0.5">
                Sistem Informasi Yayasan<br />Al Basyariah
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 overflow-x-hidden custom-scrollbar">
          {filteredGroups.map((group) => (
            <div key={group.title} className={`${isCollapsed ? "mb-0" : "mb-2"}`}>
              {group.title !== "UTAMA" && !isCollapsed && (
                <div className="text-[10px] font-bold text-white/50 dark:text-text-muted/60 tracking-wider mb-2 mt-4 px-3 uppercase">
                  {group.title}
                </div>
              )}
              {group.title !== "UTAMA" && isCollapsed && (
                 <div className="h-px bg-white/10 dark:bg-border my-4 mx-3" />
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
                          ? "bg-white/20 dark:bg-primary/15 text-white dark:text-primary shadow-sm border border-white/10 dark:border-primary/20 font-semibold" 
                          : "text-white/80 dark:text-text-muted hover:bg-white/10 dark:hover:bg-surface-hover hover:text-white dark:hover:text-text-main"
                      } ${isCollapsed ? "justify-center" : "justify-start"}`}
                      title={isCollapsed ? item.label : ""}
                    >
                      <Icon size={20} className={isActive ? "text-white dark:text-primary" : "text-white/80 dark:text-text-muted"} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer User Info */}
        <div className="p-3 border-t border-white/10 dark:border-border shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 dark:bg-bg/60 border border-white/10 dark:border-border hover:bg-white/10 dark:hover:bg-bg transition-all group">
              {/* Profile Card trigger modal */}
              <button
                type="button"
                onClick={() => {
                  setManageAccountTab("profile")
                  setShowManageAccountModal(true)
                }}
                className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                title={`${displayName} (${roleLabel}) - Klik untuk kelola akun`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-primary/15 text-white dark:text-primary font-bold flex items-center justify-center shrink-0 overflow-hidden border border-white/20 dark:border-primary/20 shadow-xs">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(displayName)}</span>
                    )}
                  </div>
                  {/* Status Indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#065f32] dark:border-surface rounded-full" />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-white dark:text-text-main truncate leading-tight group-hover:text-emerald-300 dark:group-hover:text-primary transition-colors">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border truncate max-w-[125px] ${roleBadgeStyle}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button 
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 dark:text-rose-400 hover:bg-red-500/20 dark:hover:bg-rose-950/40 hover:text-red-200 dark:hover:text-rose-300 transition-colors cursor-pointer shrink-0" 
                title="Keluar dari Sistem" 
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setManageAccountTab("profile")
                  setShowManageAccountModal(true)
                }}
                className="relative group cursor-pointer"
                title={`${displayName} - Kelola Akun`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-primary/15 text-white dark:text-primary font-bold flex items-center justify-center shrink-0 overflow-hidden border border-white/20 dark:border-primary/20 hover:scale-105 transition-transform">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#065f32] dark:border-surface rounded-full" />
              </button>

              <button 
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 dark:text-rose-400 hover:bg-red-500/20 dark:hover:bg-rose-950/40 transition-colors cursor-pointer" 
                title="Keluar" 
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          await signOut({ redirect: false })
          window.location.href = "/login"
        }}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari sistem Siraya?"
        confirmText="Keluar"
        cancelText="Batal"
        confirmVariant="primary"
      />

      <ManageAccountModal 
        isOpen={showManageAccountModal}
        onClose={() => setShowManageAccountModal(false)}
        initialTab={manageAccountTab}
        onProfileUpdated={(updated) => {
          if (updated?.name) setCurrentUserName(updated.name)
        }}
      />
    </>
  )
}
