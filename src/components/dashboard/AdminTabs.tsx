'use client'

import Link from 'next/link'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { Building2, Layers, Activity, ChevronDown } from 'lucide-react'

export default function AdminTabs({ units }: { units: { id: string, name: string }[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'yayasan'
  const activeUnitId = searchParams.get('unitId') || (units[0]?.id || '')

  const tabs = [
    { id: 'yayasan', label: 'Yayasan', icon: Building2 },
    { id: 'unit', label: 'Unit Sekolah', icon: Layers },
    { id: 'operasional', label: 'Operasional', icon: Activity },
  ]

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm inline-flex">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === 'unit' ? `/?tab=${tab.id}&unitId=${activeUnitId}` : `/?tab=${tab.id}`}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        ))}
      </div>

      {activeTab === 'unit' && units.length > 0 && (
        <div className="relative">
          <select
            value={activeUnitId}
            onChange={(e) => router.push(`/?tab=unit&unitId=${e.target.value}`)}
            className="appearance-none bg-white border border-gray-200 text-gray-800 font-bold text-sm rounded-xl px-4 py-2.5 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}
    </div>
  )
}
