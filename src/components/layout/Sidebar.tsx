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
  Landmark
} from "lucide-react"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

const menuGroups = [
  {
    title: "UTAMA",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "DATA YAYASAN",
    items: [
      { href: "/unit-sekolah", label: "Unit Sekolah", icon: Building },
      { href: "/jurusan", label: "Program & Jurusan", icon: BookOpen },
    ]
  },
  {
    title: "DATA AKADEMIK",
    items: [
      { href: "/tahun-akademik", label: "Tahun Akademik", icon: Calendar },
      { href: "/kelas", label: "Kelas & Murid", icon: Users2 },
    ]
  },
  {
    title: "KEUANGAN",
    items: [
      { href: "/akun-keuangan", label: "Akun Keuangan", icon: Landmark },
      { href: "/transaksi", label: "Transaksi", icon: Wallet },
      { href: "/laporan", label: "Laporan", icon: FileText },
      { href: "/anggaran", label: "Anggaran", icon: PieChart },
    ]
  },
  {
    title: "PENGATURAN",
    items: [
      { href: "/manajemen-user", label: "Manajemen User", icon: Users, adminOnly: true },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, adminOnly: true },
    ]
  }
]

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.adminOnly || (item.adminOnly && user?.role === "ADMIN"))
  })).filter(group => group.items.length > 0)

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
  }

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        {/* Floating Toggle Button (Right Edge) */}
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <img src="/logo.png" alt="Logo Al Basyariah" className="brand-logo" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} />
            <div className="brand-logo-fallback hidden">AB</div>
          </div>
          
          {!isCollapsed && (
            <div className="brand-titles">
              <span className="brand-text">SIRAYA</span>
              <span className="brand-subtext">Sistem Informasi Yayasan Al Basyariah</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {filteredGroups.map((group, groupIndex) => (
            <div key={group.title} className="nav-group">
              {group.title !== "UTAMA" && (
                <div className="nav-section-title">
                  {group.title}
                </div>
              )}
              
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon size={22} className="nav-icon" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" />
              ) : (
                <span>{getInitials(user?.name || "")}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="sidebar-user-info" style={{ flex: 1, overflow: 'hidden' }}>
                <span className="sidebar-user-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || "User"}</span>
                <span className="sidebar-user-role">{user?.role}</span>
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={() => setShowLogoutModal(true)}
                className="icon-btn text-error" 
                title="Keluar" 
                style={{ width: '36px', height: '36px', border: 'none', background: 'none', boxShadow: 'none' }}
              >
                <LogOut size={18} />
              </button>
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
    </>
  )
}
