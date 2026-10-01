'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Layers, Activity, School, LayoutDashboard, ChevronDown, Check, X, ShieldCheck } from 'lucide-react'
import { setGlobalContext } from '@/actions/app-context'
import { sortUnitsByLevel } from '@/lib/constants/units'

interface DashboardNavTabsProps {
  role: string
  units?: { id: string; name: string; level?: string }[]
  activeUnitId?: string
}

export default function DashboardNavTabs({ role, units = [], activeUnitId = "" }: DashboardNavTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showUnitPicker, setShowUnitPicker] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when unit picker is open
  useEffect(() => {
    if (showUnitPicker) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showUnitPicker])

  const currentTab = searchParams.get('tab')
  const currentUnitId = searchParams.get('unitId')

  // Canonical sorting: SD -> SMP -> SMA -> SMK
  const sortedUnits = sortUnitsByLevel(units)

  // Pemetaan daftar tab sesuai role sistem
  const getTabsForRole = (currentRole: string) => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { id: 'yayasan', tabType: 'yayasan', label: 'Konsolidasi Yayasan', icon: Building2, href: '/?tab=yayasan' },
          ...sortedUnits.map(u => ({
            id: `unit-${u.id}`,
            tabType: 'unit',
            unitId: u.id,
            label: u.name,
            icon: Layers,
            href: `/?tab=unit&unitId=${u.id}`
          })),
          { id: 'operasional', tabType: 'operasional', label: 'Sistem & Operasional', icon: Activity, href: '/?tab=operasional' },
        ]
      case 'TATA_USAHA':
        return [
          { id: 'unit', tabType: 'unit', label: 'Unit Aktif', icon: School, href: '/?tab=unit' },
        ]
      case 'KEPALA_SEKOLAH':
        return [
          { id: 'kepsek', tabType: 'kepsek', label: 'Ringkasan Eksekutif', icon: LayoutDashboard, href: '/?tab=kepsek' },
        ]
      case 'YAYASAN':
        return [
          { id: 'yayasan', tabType: 'yayasan', label: 'Konsolidasi 360° Yayasan', icon: Building2, href: '/?tab=yayasan' },
          ...sortedUnits.map(u => ({
            id: `unit-${u.id}`,
            tabType: 'unit',
            unitId: u.id,
            label: u.name,
            icon: Layers,
            href: `/?tab=unit&unitId=${u.id}`
          })),
        ]
      default:
        return [
          { id: 'yayasan', tabType: 'yayasan', label: 'Yayasan', icon: Building2, href: '/?tab=yayasan' },
        ]
    }
  }

  const tabs = getTabsForRole(role)

  // Target unit yang sedang aktif jika berada di tab unit
  const effectiveUnitId = currentUnitId || (activeUnitId && activeUnitId !== 'all' ? activeUnitId : units[0]?.id)
  const activeUnitObj = units.find(u => u.id === effectiveUnitId)

  const isTabActive = (tab: any) => {
    if (role === 'KEPALA_SEKOLAH') return tab.id === 'kepsek'
    if (role === 'TATA_USAHA') return tab.id === 'unit'

    if (currentTab === 'operasional') {
      return tab.id === 'operasional'
    }
    if (currentTab === 'yayasan') {
      return tab.id === 'yayasan'
    }
    if (currentTab === 'unit') {
      return tab.tabType === 'unit' && tab.unitId === effectiveUnitId
    }

    // Default jika tidak ada parameter ?tab= di URL
    if (activeUnitId && activeUnitId !== 'all') {
      return tab.tabType === 'unit' && tab.unitId === activeUnitId
    }
    return tab.id === 'yayasan'
  }

  const handleTabClick = (e: React.MouseEvent, tab: any) => {
    if (role !== 'ADMIN' && role !== 'YAYASAN') return

    if (tab.tabType === 'yayasan') {
      e.preventDefault()
      startTransition(async () => {
        await setGlobalContext('all', '')
        window.location.href = '/?tab=yayasan'
      })
    } else if (tab.tabType === 'unit' && tab.unitId) {
      e.preventDefault()
      startTransition(async () => {
        await setGlobalContext(tab.unitId, '')
        window.location.href = `/?tab=unit&unitId=${tab.unitId}`
      })
    }
  }

  const handleMobileUnitSelect = (unitId: string) => {
    setShowUnitPicker(false)
    startTransition(async () => {
      await setGlobalContext(unitId, '')
      window.location.href = `/?tab=unit&unitId=${unitId}`
    })
  }

  const isYayasanActive = isTabActive({ id: 'yayasan', tabType: 'yayasan' })
  const isUnitActive = currentTab === 'unit' || (activeUnitId && activeUnitId !== 'all' && currentTab !== 'operasional' && currentTab !== 'yayasan')
  const isAuditActive = currentTab === 'operasional'

  return (
    <div className="mb-3 sm:mb-6 w-full" data-testid="dashboard-nav-tabs">
      {/* ======================================================== */}
      {/* 1. MOBILE 3-SEGMENTED SWITCHER (<md atau ponsel landscape) */}
      {/* ======================================================== */}
      {(role === 'ADMIN' || role === 'YAYASAN') && (
        <div className="md:hidden short:block show-block-on-mobile-landscape w-full">
          <div className="bg-surface p-1 rounded-2xl border border-border shadow-xs grid grid-cols-3 gap-1">
            {/* Segmen 1: Yayasan */}
            <button
              type="button"
              onClick={(e) => handleTabClick(e, { tabType: 'yayasan' })}
              className={`flex items-center justify-center gap-1.5 py-2.5 short:py-1.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] short:min-h-[36px] cursor-pointer touch-manipulation ${
                isYayasanActive
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-50'
              }`}
            >
              <Building2 size={15} className="shrink-0" />
              <span className="truncate">Yayasan</span>
            </button>

            {/* Segmen 2: Unit Sekolah (Tap to open Sheet) */}
            <button
              type="button"
              onClick={() => setShowUnitPicker(true)}
              className={`flex items-center justify-center gap-1 py-2.5 short:py-1.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] short:min-h-[36px] cursor-pointer touch-manipulation ${
                isUnitActive
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-50'
              }`}
            >
              <School size={15} className="shrink-0" />
              <span className="truncate max-w-[65px] xs:max-w-none">
                {isUnitActive && activeUnitObj ? activeUnitObj.name.replace(/Albasyariah/i, '').trim() : 'Unit'}
              </span>
              <ChevronDown size={13} className="shrink-0 opacity-80" />
            </button>

            {/* Segmen 3: Audit Sistem */}
            <Link
              href="/?tab=operasional"
              className={`flex items-center justify-center gap-1.5 py-2.5 short:py-1.5 px-2 rounded-xl text-xs font-bold transition-all min-h-[44px] short:min-h-[36px] touch-manipulation ${
                isAuditActive
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-50'
              }`}
            >
              <ShieldCheck size={15} className="shrink-0" />
              <span className="truncate">Audit</span>
            </Link>
          </div>

          {/* Unit Picker Bottom Sheet Modal */}
          {showUnitPicker && mounted && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 short:p-2">
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={() => setShowUnitPicker(false)}
              />
              <div 
                className="relative w-full max-w-lg short:max-w-xl bg-surface rounded-2xl border border-border p-5 short:p-3 z-10 shadow-2xl flex flex-col gap-3 short:gap-2 max-h-[calc(100dvh-32px)] short:max-h-[calc(100dvh-12px)] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >

                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <School size={17} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-text-main">Pilih Unit Sekolah</h3>
                      <p className="text-[11px] text-text-muted">Urutan jenjang SD, SMP, SMA, SMK</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUnitPicker(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 short:grid-cols-2 gap-2 overflow-y-auto py-1 pb-4 short:pb-2">
                  {sortedUnits.map((u) => {
                    const isSelected = effectiveUnitId === u.id && isUnitActive
                    const levelBadge = u.level?.toUpperCase() || u.name.match(/\b(SD|SMP|SMA|SMK|MI|MTS|MA)\b/i)?.[0]?.toUpperCase() || 'UNIT'
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleMobileUnitSelect(u.id)}
                        className={`flex items-center justify-between p-3.5 short:p-2.5 rounded-2xl border text-xs font-bold transition-all min-h-[52px] short:min-h-[44px] text-left cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-2xs ring-1 ring-primary/30'
                            : 'bg-surface border-border text-text-main hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {levelBadge}
                          </div>
                          <div>
                            <span className="block text-xs font-bold">{u.name}</span>
                            <span className="text-[10px] text-text-muted font-normal">Jenjang Institusi {levelBadge}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={18} className="text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DESKTOP TABS (>=md dan bukan ponsel landscape)        */}
      {/* ======================================================== */}
      <div className="hidden md:block short:hidden hide-on-mobile-landscape overflow-x-auto hide-scrollbar py-1">
        <div className="bg-surface p-1.5 rounded-2xl border border-border shadow-xs inline-flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab)

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] shrink-0 cursor-pointer ${
                  active
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-text-muted hover:text-text-main hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
