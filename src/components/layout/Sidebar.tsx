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
import ChangePasswordModal from "@/components/modals/ChangePasswordModal"
import { useMobileMenu } from "./MobileMenuContext"
import { X } from "lucide-react"

const menuGroups = [
  {
    title: "UTAMA",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "DATA YAYASAN",
    items: [
      { href: "/unit-sekolah", label: "Unit Sekolah", icon: Building, allowedRoles: ["ADMIN", "YAYASAN"], isGlobal: true },
      { href: "/jurusan", label: "Program & Jurusan", icon: BookOpen, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "DATA AKADEMIK",
    items: [
      { href: "/tahun-akademik", label: "Tahun Akademik", icon: Calendar, allowedRoles: ["ADMIN", "YAYASAN"], isGlobal: true },
      { href: "/guru", label: "Guru & Staf", icon: GraduationCap, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
      { href: "/kelas", label: "Kelas & Murid", icon: Users2, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "KEUANGAN",
    items: [
      { href: "/akun-keuangan", label: "Akun Keuangan", icon: Landmark, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"], isGlobal: true },
      { href: "/kas-masuk", label: "Kas Masuk", icon: ArrowDownToLine, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
      { href: "/kas-keluar", label: "Kas Keluar", icon: ArrowUpFromLine, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
      { href: "/pembuatan-tagihan", label: "Pembuatan Tagihan", icon: FilePlus, allowedRoles: ["ADMIN", "TATA_USAHA"] },
      { href: "/pembayaran-tagihan", label: "Pembayaran Tagihan", icon: FilePlus, allowedRoles: ["ADMIN", "TATA_USAHA"] },
      { href: "/rekapitulasi-tunggakan", label: "Rekap. Tagihan & Tunggakan", icon: FilePlus, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"] },
    ]
  },
  {
    title: "LAPORAN",
    items: [
      { href: "/laporan", label: "Laporan Keuangan", icon: PieChart, allowedRoles: ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH", "YAYASAN"], isGlobal: true },
    ]
  },
  {
    title: "PENGATURAN",
    items: [
      { href: "/manajemen-user", label: "Manajemen User", icon: Users, allowedRoles: ["ADMIN"], isGlobal: true },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, allowedRoles: ["ADMIN"], isGlobal: true },
    ]
  }
] as { title: string, items: { href: string, label: string, icon: any, allowedRoles: string[], isGlobal?: boolean }[] }[]

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
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)

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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  // Otomatis buka modal ganti password jika pengguna memiliki status wajib ganti password
  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowChangePasswordModal(true)
    }
  }, [user?.mustChangePassword])

  const isKepsek = user?.role === "KEPALA_SEKOLAH"
  const isYayasan = user?.role === "YAYASAN"

  const filteredGroups = menuGroups.map(group => {
    let title = group.title
    if (isKepsek) {
      if (group.title === "DATA AKADEMIK") title = "AKADEMIK & MUTU"
      if (group.title === "KEUANGAN") title = "AUDIT KEUANGAN UNIT"
      if (group.title === "LAPORAN") title = "PENGESAHAN & LAPORAN"
    }

    const items = group.items
      .filter(item => item.allowedRoles.includes(user?.role || "TATA_USAHA"))
      .map(item => {
        if (isKepsek) {
          if (item.href === "/kelas") return { ...item, label: "Kapasitas & Rombel" }
          if (item.href === "/guru") return { ...item, label: "Beban & Data Guru" }
          if (item.href === "/rekapitulasi-tunggakan") return { ...item, label: "Monitoring SPP & Tagihan" }
          if (item.href === "/kas-masuk") return { ...item, label: "Audit Kas Masuk" }
          if (item.href === "/kas-keluar") return { ...item, label: "Audit Kas Keluar" }
          if (item.href === "/laporan") return { ...item, label: "Laporan & Pengesahan" }
        }
        return item
      })

    return {
      ...group,
      title,
      items
    }
  }).filter(group => group.items.length > 0)

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
  }

  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu()

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MOBILE NAVIGATION SHEET (MODERN SLIDE-OVER DRAWER) */}
      {/* ======================================================== */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Soft Backdrop with blur */}
        <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        />

        {/* Slide-over Drawer (Width 82vw, max 320px so main page context remains visible) */}
        <div 
          className={`fixed inset-y-0 left-0 w-[82vw] max-w-[320px] bg-surface text-text-main border-r border-border shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out z-50 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between gap-3 bg-bg/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 border border-primary/20 shrink-0">
                <img src={logoUrl || "/logo.png"} alt="Logo Siraya" className="w-full h-full object-contain" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }} />
                <div className="hidden font-bold text-primary text-sm">AB</div>
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-base text-text-main tracking-tight block leading-tight">SIRAYA</span>
                <span className="text-[10px] text-text-muted font-medium truncate block">Yayasan Al Basyariah</span>
              </div>
            </div>

            <button
              onClick={closeMobileMenu}
              className="w-10 h-10 rounded-xl bg-surface hover:bg-slate-100 flex items-center justify-center text-text-muted hover:text-text-main border border-border transition-colors cursor-pointer shrink-0"
              aria-label="Tutup Menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Quick Profile Card */}
          <div className="p-3 mx-3 mt-3 rounded-xl bg-bg border border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-200 text-xs">
              {getInitials(user?.name || "")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-main truncate">{user?.name || "Pengguna"}</p>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary">
                {user?.role === "YAYASAN" ? "PENGURUS" : user?.role}
              </span>
            </div>
          </div>

          {/* Navigation Items (Categorized & Finger-friendly) */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.title}>
                <div className="text-[10px] font-bold text-text-muted tracking-wider px-2 mb-1.5 uppercase">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                          isActive 
                            ? "bg-primary text-white shadow-2xs" 
                            : "text-text-muted hover:text-text-main hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={18} className={isActive ? "text-white" : "text-text-muted"} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-t border-border flex items-center justify-between gap-2 bg-bg/50">
            <button 
              onClick={() => { closeMobileMenu(); setShowChangePasswordModal(true); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-main bg-surface border border-border transition-colors min-h-[40px] cursor-pointer" 
            >
              <Key size={14} />
              <span>Ganti Sandi</span>
            </button>
            <button 
              onClick={() => { closeMobileMenu(); setShowLogoutModal(true); }}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors min-h-[40px] cursor-pointer" 
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DESKTOP PERMANENT SIDEBAR (>=md) */}
      {/* ======================================================== */}
      <aside className={`
        hidden md:flex bg-[#065f32] text-white h-full border-r border-[#0a753d] flex-col transition-all duration-300 z-30 relative shrink-0
        ${isCollapsed ? "w-20" : "w-[265px]"}
      `}>
        {/* Floating Toggle Button (Right Edge) - Desktop Only */}
        <button 
          className="absolute -right-3 top-8 w-7 h-7 rounded-full bg-surface border border-border text-primary flex items-center justify-center hover:bg-surface-hover z-50 shadow-md transition-transform cursor-pointer"
          onClick={handleToggleCollapse}
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex items-center p-5 gap-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
            <img src={logoUrl || "/logo.png"} alt="Logo Al Basyariah" className="w-full h-full object-contain" onError={(e) => {
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
          {filteredGroups.map((group) => (
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
                <span className="text-xs text-white/60 truncate">
                  {user?.role === "YAYASAN" ? "PENGURUS YAYASAN" : user?.role}
                </span>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer" 
                  title="Ganti Password" 
                >
                  <Key size={16} />
                </button>
                <button 
                  onClick={() => setShowLogoutModal(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer" 
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
        isMandatory={!!user?.mustChangePassword}
      />
    </>
  )
}
