'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Layers, Activity, School, LayoutDashboard } from 'lucide-react'

interface DashboardNavTabsProps {
  role: string
  units?: { id: string; name: string }[]
  activeUnitId?: string
}

export default function DashboardNavTabs({ role, units = [], activeUnitId = "" }: DashboardNavTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Menentukan default tab berdasarkan role
  let defaultTab = 'yayasan'
  if (role === 'KEPALA_SEKOLAH') defaultTab = 'kepsek'
  if (role === 'TATA_USAHA') defaultTab = 'unit'
  const activeTab = searchParams.get('tab') || defaultTab

  // Pemetaan daftar tab sesuai role sistem
  const getTabsForRole = (currentRole: string) => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { id: 'yayasan', label: 'Konsolidasi Yayasan', icon: Building2 },
          ...(activeUnitId !== 'all' ? [{ id: 'unit', label: `Detail: ${units.find(u => u.id === activeUnitId)?.name || 'Unit Sekolah'}`, icon: Layers }] : []),
          { id: 'operasional', label: 'Sistem & Operasional', icon: Activity },
        ]
      case 'TATA_USAHA':
        return [
          { id: 'unit', label: 'Unit Aktif', icon: School },
        ]
      case 'KEPALA_SEKOLAH':
        return [
          { id: 'kepsek', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
        ]
      case 'YAYASAN':
        return [
          { id: 'yayasan', label: 'Konsolidasi 360° Yayasan', icon: Building2 },
          ...(activeUnitId && activeUnitId !== 'all' ? [{ id: 'unit', label: `Detail: ${units.find(u => u.id === activeUnitId)?.name || 'Unit'}`, icon: Layers }] : []),
        ]
      default:
        return [
          { id: 'yayasan', label: 'Yayasan', icon: Building2 },
        ]
    }
  }

  const tabs = getTabsForRole(role)

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="bg-surface p-1.5 rounded-2xl border border-border shadow-xs inline-flex flex-wrap gap-1.5 w-full sm:w-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isYayasanDefault = role === 'YAYASAN' && !searchParams.get('tab') && (activeUnitId && activeUnitId !== 'all' ? tab.id === 'unit' : tab.id === 'yayasan')
          const isActive = activeTab === tab.id || (role === 'KEPALA_SEKOLAH' && !searchParams.get('tab') && tab.id === 'kepsek') || isYayasanDefault
          const href = tab.id === 'unit' && (role === 'ADMIN' || role === 'YAYASAN') ? `/?tab=${tab.id}&unitId=${activeUnitId}` : `/?tab=${tab.id}`

          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                isActive
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
  )
}
