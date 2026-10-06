'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard, CreditCard, GraduationCap, PieChart, 
  LayoutGrid, X, Key, LogOut, Search
} from 'lucide-react'
import { getFilteredMenuGroups } from '@/lib/constants/navigation'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import ChangePasswordModal from '@/components/modals/ChangePasswordModal'

interface MobileBottomNavProps {
  user?: {
    name?: string | null
    email?: string | null
    role?: string
    avatar?: string | null
    mustChangePassword?: boolean
  }
  logoUrl?: string | null
}

export default function MobileBottomNav({ user, logoUrl }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when mobile menu sheet is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  const userRole = user?.role || 'TATA_USAHA'
  const menuGroups = getFilteredMenuGroups(userRole)

  // Route active states
  const isDashboardActive = pathname === '/'
  const isKeuanganActive = pathname.startsWith('/kas') || 
                           pathname.startsWith('/akun-keuangan') || 
                           pathname.startsWith('/pembuatan-tagihan') || 
                           pathname.startsWith('/pembayaran-tagihan') || 
                           pathname.startsWith('/rekapitulasi-tunggakan')
  const isAkademikActive = pathname.startsWith('/kelas') || 
                           pathname.startsWith('/guru') || 
                           pathname.startsWith('/tahun-akademik') || 
                           pathname.startsWith('/jurusan') ||
                           pathname.startsWith('/murid')
  const isLaporanActive = pathname.startsWith('/laporan')

  // Smart routing per role for payment / finance
  const isKepsekOrYayasan = userRole === 'KEPALA_SEKOLAH' || userRole === 'YAYASAN'
  const pembayaranHref = isKepsekOrYayasan ? '/rekapitulasi-tunggakan' : '/pembayaran-tagihan'
  const pembayaranLabel = isKepsekOrYayasan ? 'Tunggakan' : 'Pembayaran'

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
  }

  // Filter items in modal based on search
  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      !searchQuery || 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0)

  return (
    <>
      {/* ======================================================== */}
      {/* 1. BOTTOM NAVIGATION DOCK (5-SLOT WITH CENTER MENU HUB)   */}
      {/* ======================================================== */}
      <nav 
        aria-label="Navigasi Mobile Bawah"
        className="md:hidden short:block show-block-on-mobile-landscape fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 px-2 py-1 short:py-0.5 shadow-lg safe-area-bottom"
      >
        <div className="grid grid-cols-5 gap-1 items-center max-w-md short:max-w-xl mx-auto">
          {/* Slot 1: Dashboard */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1.5 short:py-0.5 px-0.5 rounded-xl transition-all min-h-[48px] short:min-h-[38px] touch-manipulation ${
              isDashboardActive && !isModalOpen
                ? 'text-primary font-bold bg-primary/10'
                : 'text-text-muted hover:text-text-main hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={18} className="short:w-4 short:h-4" strokeWidth={isDashboardActive && !isModalOpen ? 2.5 : 2} />
            <span className="text-[10px] short:text-[9px] mt-1 short:mt-0 tracking-tight leading-none truncate max-w-full px-0.5">Dashboard</span>
          </Link>

          {/* Slot 2: Pembayaran (Keuangan) */}
          <Link
            href={pembayaranHref}
            className={`flex flex-col items-center justify-center py-1.5 short:py-0.5 px-0.5 rounded-xl transition-all min-h-[48px] short:min-h-[38px] touch-manipulation ${
              isKeuanganActive && !isModalOpen
                ? 'text-primary font-bold bg-primary/10'
                : 'text-text-muted hover:text-text-main hover:bg-slate-50'
            }`}
          >
            <CreditCard size={18} className="short:w-4 short:h-4" strokeWidth={isKeuanganActive && !isModalOpen ? 2.5 : 2} />
            <span className="text-[10px] short:text-[9px] mt-1 short:mt-0 tracking-tight leading-none truncate max-w-full px-0.5">{pembayaranLabel}</span>
          </Link>

          {/* Slot 3: CENTER PROMINENT MENU HUB (APP LAUNCHER) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-3.5 short:-mt-2 relative group cursor-pointer touch-manipulation"
            aria-label="Buka Semua Menu & Modul"
            aria-expanded={isModalOpen}
          >
            <div className={`w-12 h-12 short:w-9 short:h-9 rounded-2xl short:rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2 border-surface ${
              isModalOpen 
                ? 'bg-emerald-800 text-white ring-2 ring-primary/40' 
                : 'bg-primary text-white shadow-primary/30 hover:bg-primary-hover'
            }`}>
              <LayoutGrid size={22} className="short:w-4 short:h-4" strokeWidth={2.2} />
            </div>
            <span className="text-[10px] short:text-[9px] font-extrabold text-primary tracking-tight mt-0.5 short:mt-0 leading-none">
              Menu
            </span>
          </button>

          {/* Slot 4: Kelas & Murid (Akademik) */}
          <Link
            href="/kelas"
            className={`flex flex-col items-center justify-center py-1.5 short:py-0.5 px-0.5 rounded-xl transition-all min-h-[48px] short:min-h-[38px] touch-manipulation ${
              isAkademikActive && !isModalOpen
                ? 'text-primary font-bold bg-primary/10'
                : 'text-text-muted hover:text-text-main hover:bg-slate-50'
            }`}
          >
            <GraduationCap size={18} className="short:w-4 short:h-4" strokeWidth={isAkademikActive && !isModalOpen ? 2.5 : 2} />
            <span className="text-[10px] short:text-[9px] mt-1 short:mt-0 tracking-tight leading-none truncate max-w-full px-0.5">Akademik</span>
          </Link>

          {/* Slot 5: Laporan */}
          <Link
            href="/laporan"
            className={`flex flex-col items-center justify-center py-1.5 short:py-0.5 px-0.5 rounded-xl transition-all min-h-[48px] short:min-h-[38px] touch-manipulation ${
              isLaporanActive && !isModalOpen
                ? 'text-primary font-bold bg-primary/10'
                : 'text-text-muted hover:text-text-main hover:bg-slate-50'
            }`}
          >
            <PieChart size={18} className="short:w-4 short:h-4" strokeWidth={isLaporanActive && !isModalOpen ? 2.5 : 2} />
            <span className="text-[10px] short:text-[9px] mt-1 short:mt-0 tracking-tight leading-none truncate max-w-full px-0.5">Laporan</span>
          </Link>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* 2. APP LAUNCHER BOTTOM SHEET MODAL (POP UP MODAL MENU)   */}
      {/* ======================================================== */}
      {isModalOpen && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 short:p-2 md:hidden short:flex show-on-mobile-landscape"
          role="dialog"
          aria-modal="true"
          aria-label="Menu dan Modul Sistem"
        >
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Sheet Container */}
          <div 
            className="relative w-full max-w-lg short:max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl z-10 flex flex-col max-h-[calc(100dvh-32px)] short:max-h-[calc(100dvh-12px)] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header Modal */}
            <div className="p-4 short:py-2 short:px-3.5 border-b border-border flex items-center justify-between gap-3 bg-bg/40 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 short:w-7 short:h-7 rounded-xl bg-primary/10 flex items-center justify-center p-1.5 border border-primary/20 shrink-0">
                  <img 
                    src={logoUrl || "/logo.png"} 
                    alt="Logo Siraya" 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }} 
                  />
                  <div className="hidden font-bold text-primary text-sm">AB</div>
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-base short:text-sm text-text-main tracking-tight leading-tight">
                    Semua Modul Siraya
                  </h2>
                  <span className="text-[10px] short:text-[9px] text-text-muted font-medium truncate block">
                    Pintasan menu dan navigasi terpadu
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 short:w-7 short:h-7 rounded-xl bg-surface hover:bg-slate-100 flex items-center justify-center text-text-muted hover:text-text-main border border-border transition-colors cursor-pointer shrink-0"
                aria-label="Tutup Menu"
              >
                <X size={18} className="short:w-4 short:h-4" />
              </button>
            </div>

            {/* User Quick Identity Pill */}
            <div className="px-4 short:px-3 pt-3 short:pt-1.5 shrink-0">
              <div className="p-2.5 short:py-1.5 short:px-2 rounded-xl bg-bg border border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 short:w-6 short:h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-200 text-xs short:text-[10px]">
                    {getInitials(user?.name || "")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-main truncate">{user?.name || "Pengguna"}</p>
                    <span className="text-[10px] short:text-[9px] font-semibold text-text-muted">
                      {userRole === "YAYASAN" ? "PENGURUS YAYASAN" : userRole}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] short:text-[9px] font-extrabold bg-primary/10 text-primary shrink-0">
                  Aktif
                </span>
              </div>
            </div>

            {/* In-Modal Search Bar */}
            <div className="px-4 short:px-3 pt-2.5 short:pt-1.5 pb-1 short:pb-0.5 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari modul atau fitur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 short:py-1.5 bg-surface border border-border rounded-xl text-xs font-medium text-text-main placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all min-h-[38px] short:min-h-[32px]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Module Categories Grid */}
            <div className="flex-1 overflow-y-auto p-4 short:p-3 space-y-4 short:space-y-2">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div key={group.title}>
                    <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase block mb-1.5 short:mb-1 px-0.5">
                      {group.title}
                    </span>
                    <div className="grid grid-cols-2 short:grid-cols-3 gap-2 short:gap-1.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsModalOpen(false)}
                            className={`p-2.5 short:p-2 rounded-xl border flex items-center gap-2.5 transition-all min-h-[50px] short:min-h-[38px] ${
                              isActive
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-surface hover:bg-slate-50 border-border text-text-main'
                            }`}
                          >
                            <div className={`w-7 h-7 short:w-6 short:h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <Icon size={15} className="short:w-3.5 short:h-3.5" />
                            </div>
                            <span className="text-xs short:text-[11px] font-bold leading-snug line-clamp-2 break-words flex-1">
                              {item.label}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-text-muted">
                  <p className="text-xs font-semibold">Tidak ditemukan modul yang cocok</p>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="p-3 short:py-1.5 short:px-3 border-t border-border flex items-center justify-between gap-2 bg-bg/50 shrink-0">
              <button 
                onClick={() => { setIsModalOpen(false); setShowChangePasswordModal(true); }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 short:py-1 px-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-text-main bg-surface border border-border transition-colors min-h-[40px] short:min-h-[32px] cursor-pointer" 
              >
                <Key size={14} />
                <span>Ganti Sandi</span>
              </button>
              <button 
                onClick={() => { setIsModalOpen(false); setShowLogoutModal(true); }}
                className="inline-flex items-center justify-center gap-1.5 py-2 short:py-1 px-3 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors min-h-[40px] short:min-h-[32px] cursor-pointer" 
              >
                <LogOut size={14} />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modals */}
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

      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        isMandatory={!!user?.mustChangePassword}
      />
    </>
  )
}
