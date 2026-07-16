"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

export default function TransaksiNav() {
  const pathname = usePathname()

  const tabs = [
    { name: "Kas Masuk (Penerimaan)", href: "/transaksi/kas-masuk", icon: ArrowDownLeft, color: "var(--albas-green)" },
    { name: "Kas Keluar (Pengeluaran)", href: "/transaksi/kas-keluar", icon: ArrowUpRight, color: "var(--text-error)" },
  ]

  return (
    <div className="flex gap-8 border-b border-border">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link 
            key={tab.href} 
            href={tab.href}
            className={`flex items-center gap-2 py-4 font-semibold transition-all border-b-2 decoration-transparent
              ${isActive ? "text-text-main" : "text-text-muted hover:text-text-main border-transparent"}`}
            style={{ borderBottomColor: isActive ? tab.color : 'transparent' }}
          >
            <div 
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{ 
                backgroundColor: isActive ? `${tab.color}20` : "transparent",
                color: isActive ? tab.color : "inherit"
              }}
            >
              <Icon size={16} />
            </div>
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
