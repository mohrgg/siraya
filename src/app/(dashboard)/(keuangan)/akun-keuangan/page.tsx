import { getKlasifikasiAkun } from "@/actions/akun-keuangan"
import AkunKeuanganClient from "./AkunKeuanganClient"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

export default async function AkunKeuanganPage() {
  const schoolUnits = await prisma.unitSekolah.findMany({ orderBy: { name: 'asc' } })
  const cookieStore = await cookies()
  const initialUnitId = cookieStore.get("activeUnitId")?.value || schoolUnits[0]?.id
  const data = initialUnitId ? await getKlasifikasiAkun(initialUnitId) : []

  return (
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
  )
}
