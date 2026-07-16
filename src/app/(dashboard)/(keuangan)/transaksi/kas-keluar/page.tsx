import { getTransaksiKas } from "@/actions/transaksi-kas"
import KasKeluarClient from "./KasKeluarClient"
import prisma from "@/lib/prisma"

export default async function KasKeluarPage() {
  const schoolUnits = await prisma.unitSekolah.findMany()
  const initialUnitId = schoolUnits[0]?.id
  
  const transactions = initialUnitId ? await getTransaksiKas(initialUnitId, "OUT") : []

  // Ambil akun untuk dropdown (biasanya biaya/beban/harta)
  const accounts = await prisma.akunDetail.findMany({
    where: { isActive: true },
    include: { subKlasifikasiAkun: true },
    orderBy: { code: "asc" }
  })

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", color: "var(--text-error)" }}>Kas Keluar</h2>
      </div>

      <KasKeluarClient 
        initialData={transactions} 
        schoolUnits={schoolUnits}
        initialUnitId={initialUnitId}
        accounts={accounts}
      />
    </div>
  )
}
