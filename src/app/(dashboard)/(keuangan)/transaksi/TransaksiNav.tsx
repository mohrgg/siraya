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
    <div className="tabs-container" style={{ borderBottom: "1px solid var(--border-color)", display: "flex", gap: "2rem" }}>
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link 
            key={tab.href} 
            href={tab.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "1rem 0",
              color: isActive ? "var(--text-color)" : "var(--text-muted)",
              fontWeight: isActive ? 700 : 600,
              borderBottom: isActive ? `3px solid ${tab.color}` : "3px solid transparent",
              textDecoration: "none",
              transition: "all 0.2s"
            }}
          >
            <div style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", 
              width: "28px", height: "28px", borderRadius: "50%", 
              backgroundColor: isActive ? `${tab.color}20` : "transparent",
              color: isActive ? tab.color : "inherit"
            }}>
              <Icon size={16} />
            </div>
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
