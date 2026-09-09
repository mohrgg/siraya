'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Layers, Activity, School, LayoutDashboard } from 'lucide-react'
import { setGlobalContext } from '@/actions/app-context'

interface DashboardNavTabsProps {
  role: string
  units?: { id: string; name: string }[]
  activeUnitId?: string
}

export default function DashboardNavTabs({ role, units = [], activeUnitId = "" }: DashboardNavTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentTab = searchParams.get('tab')
  const currentUnitId = searchParams.get('unitId')

  // Pemetaan daftar tab sesuai role sistem
  const getTabsForRole = (currentRole: string) => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { id: 'yayasan', tabType: 'yayasan', label: 'Konsolidasi Yayasan', icon: Building2, href: '/?tab=yayasan' },
          ...units.map(u => ({
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
          ...units.map(u => ({
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

  return (
    <div className="mb-6 w-full" data-testid="dashboard-nav-tabs">
      <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
        <div className="bg-surface p-1.5 rounded-2xl border border-border shadow-xs inline-flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab)

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] shrink-0 ${
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
