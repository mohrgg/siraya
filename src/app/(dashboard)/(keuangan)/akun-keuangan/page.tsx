import { getKlasifikasiAkun } from "@/actions/akun-keuangan"
import AkunKeuanganClient from "./AkunKeuanganClient"
import prisma from "@/lib/prisma"

export default async function AkunKeuanganPage() {
  const schoolUnits = await prisma.unitSekolah.findMany()
  // Untuk awal kita ambil dari unit pertama
  const initialUnitId = schoolUnits[0]?.id
  const data = initialUnitId ? await getKlasifikasiAkun(initialUnitId) : []

    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Bagan Akun Keuangan</h1>
        <p className="text-text-muted">Kelola klasifikasi dan rincian akun keuangan (Chart of Accounts)</p>
      </div>

      <AkunKeuanganClient 
        initialData={data} 
        schoolUnits={schoolUnits}
        initialUnitId={initialUnitId}
      />
    </div>
}
