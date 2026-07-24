'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Building2, School } from 'lucide-react'

export default function TuTabs() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'yayasan' // Default fallback to yayasan but TU usually wants unit first? No, yayasan is default in page.tsx

  const tabs = [
    { id: 'yayasan', label: 'Yayasan', icon: Building2 },
    { id: 'unit', label: 'Unit Aktif', icon: School },
  ]

  return (
    <div className="mb-6 flex justify-start">
      <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm inline-flex">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/?tab=${tab.id}`}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
    </div>
  )
}
