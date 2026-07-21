import { getTransaksiKas } from "@/actions/transaksi-kas"
import KasKeluarClient from "./KasKeluarClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

export default async function KasKeluarPage() {
  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const cookieStore = await cookies()
  const initialUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id
  
  const transactions = initialUnitId ? await getTransaksiKas(initialUnitId, "OUT") : []

  // Ambil akun untuk dropdown
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
