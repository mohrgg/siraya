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
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h1 className="page-title">Transaksi Kas</h1>
          <p className="page-subtitle">Kelola penerimaan dan pengeluaran kas yayasan</p>
        </div>
      </div>

      <TransaksiNav />

      <div className="transaksi-content" style={{ marginTop: "1.5rem" }}>
        {children}
      </div>
    </div>
  )
}
