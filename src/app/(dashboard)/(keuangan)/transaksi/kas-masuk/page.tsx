import { getTransaksiKas } from "@/actions/transaksi-kas"
import KasMasukClient from "./KasMasukClient"
import prisma from "@/lib/prisma"

export default async function KasMasukPage() {
  const schoolUnits = await prisma.unitSekolah.findMany()
  const initialUnitId = schoolUnits[0]?.id
  
  const transactions = initialUnitId ? await getTransaksiKas(initialUnitId, "IN") : []

  // Ambil akun untuk dropdown (hanya tipe PENDAPATAN atau HARTA yang relevan, atau semuanya dulu)
  const accounts = await prisma.akunDetail.findMany({
    where: { isActive: true },
    include: { subKlasifikasiAkun: true },
    orderBy: { code: "asc" }
  })

  const students = await prisma.murid.findMany({ where: { isActive: true } })

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", color: "var(--albas-green)" }}>Kas Masuk</h2>
      </div>

      <KasMasukClient 
        initialData={transactions} 
        schoolUnits={schoolUnits}
        initialUnitId={initialUnitId}
        accounts={accounts}
        students={students}
      />
    </div>
  )
}
