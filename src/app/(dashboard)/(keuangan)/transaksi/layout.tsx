import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import TransaksiNav from "./TransaksiNav"

export default function TransaksiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tabs = [
    { name: "Kas Masuk (Penerimaan)", href: "/transaksi/kas-masuk", icon: ArrowDownLeft, color: "var(--albas-green)" },
    { name: "Kas Keluar (Pengeluaran)", href: "/transaksi/kas-keluar", icon: ArrowUpRight, color: "var(--text-error)" },
  ]

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Transaksi Kas</h1>
          <p className="text-text-muted">Kelola penerimaan dan pengeluaran kas yayasan</p>
        </div>
      </div>

      <TransaksiNav />

      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}
