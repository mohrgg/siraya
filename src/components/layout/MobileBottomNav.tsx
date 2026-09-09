'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, GraduationCap, Menu, ShieldCheck } from 'lucide-react'
import { useMobileMenu } from './MobileMenuContext'

interface MobileBottomNavProps {
  role?: string
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { toggleMobileMenu, isMobileMenuOpen } = useMobileMenu()

  // Tentukan apakah route aktif
  const isDashboardActive = pathname === '/'
  const isKeuanganActive = pathname.startsWith('/kas') || 
                           pathname.startsWith('/akun-keuangan') || 
                           pathname.startsWith('/pembuatan-tagihan') || 
                           pathname.startsWith('/pembayaran-tagihan') || 
                           pathname.startsWith('/rekapitulasi-tunggakan')
  const isAkademikActive = pathname.startsWith('/kelas') || 
                           pathname.startsWith('/guru') || 
                           pathname.startsWith('/tahun-akademik') || 
                           pathname.startsWith('/jurusan')

  const isAuditActive = pathname === '/' && typeof window !== 'undefined' && window.location.search.includes('tab=operasional')

  return (
    <nav 
      aria-label="Navigasi Mobile Bawah"
      className="md:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 px-2 py-1.5 shadow-lg safe-area-bottom"
    >
      <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
        {/* 1. Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            isDashboardActive && !isAuditActive
              ? 'text-primary font-bold bg-primary/10'
              : 'text-text-muted hover:text-text-main hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard size={19} strokeWidth={isDashboardActive && !isAuditActive ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Beranda</span>
        </Link>

        {/* 2. Keuangan */}
        <Link
          href="/kas-masuk"
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            isKeuanganActive
              ? 'text-primary font-bold bg-primary/10'
              : 'text-text-muted hover:text-text-main hover:bg-slate-50'
          }`}
        >
          <CreditCard size={19} strokeWidth={isKeuanganActive ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Keuangan</span>
        </Link>

        {/* 3. Akademik */}
        <Link
          href="/kelas"
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            isAkademikActive
              ? 'text-primary font-bold bg-primary/10'
              : 'text-text-muted hover:text-text-main hover:bg-slate-50'
          }`}
        >
          <GraduationCap size={19} strokeWidth={isAkademikActive ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Akademik</span>
        </Link>

        {/* 4. Menu Lengkap */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation cursor-pointer ${
            isMobileMenuOpen
              ? 'text-primary font-bold bg-primary/15'
              : 'text-text-muted hover:text-text-main hover:bg-slate-50'
          }`}
          aria-expanded={isMobileMenuOpen}
          aria-label="Buka Semua Menu"
        >
          <Menu size={19} strokeWidth={isMobileMenuOpen ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight leading-none">Menu</span>
        </button>
      </div>
    </nav>
  )
}
