import { getTransaksiKas } from "@/actions/transaksi-kas"
import KasMasukClient from "./KasMasukClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

export default async function KasMasukPage() {
  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const cookieStore = await cookies()
  const initialUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id
  
  const transactions = initialUnitId ? await getTransaksiKas(initialUnitId, "IN") : []

  // Ambil akun untuk dropdown (filter per unit jika ada relasi, untuk saat ini ambil semua aktif)
  const accounts = await prisma.akunDetail.findMany({
    where: { isActive: true },
    include: { subKlasifikasiAkun: true },
    orderBy: { code: "asc" }
  })

  const students = await prisma.murid.findMany({ where: { isActive: true } })

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-albas-green">Kas Masuk</h2>
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
