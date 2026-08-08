'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Layers, Activity, School, LayoutDashboard, ChevronDown } from 'lucide-react'

interface DashboardNavTabsProps {
  role: string
  units?: { id: string; name: string }[]
  activeUnitId?: string
}

export default function DashboardNavTabs({ role, units = [], activeUnitId = "" }: DashboardNavTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Menentukan default tab berdasarkan role
  const defaultTab = role === 'KEPALA_SEKOLAH' ? 'kepsek' : 'yayasan'
  const activeTab = searchParams.get('tab') || defaultTab

  // Pemetaan daftar tab sesuai role sistem
  const getTabsForRole = (currentRole: string) => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { id: 'yayasan', label: 'Yayasan', icon: Building2 },
          ...(activeUnitId !== 'all' ? [{ id: 'unit', label: 'Unit Sekolah', icon: Layers }] : []),
          { id: 'operasional', label: 'Operasional', icon: Activity },
        ]
      case 'TATA_USAHA':
        return [
          { id: 'yayasan', label: 'Yayasan', icon: Building2 },
          { id: 'unit', label: 'Unit Aktif', icon: School },
        ]
      case 'KEPALA_SEKOLAH':
        return [
          { id: 'kepsek', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
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
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm inline-flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id || (role === 'KEPALA_SEKOLAH' && !searchParams.get('tab') && tab.id === 'kepsek')
          const href = tab.id === 'unit' && role === 'ADMIN' ? `/?tab=${tab.id}&unitId=${activeUnitId}` : `/?tab=${tab.id}`

          return (
            <Link
              key={tab.id}
              href={href}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
