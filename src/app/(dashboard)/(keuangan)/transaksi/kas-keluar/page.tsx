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
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-red-600">Kas Keluar</h2>
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
