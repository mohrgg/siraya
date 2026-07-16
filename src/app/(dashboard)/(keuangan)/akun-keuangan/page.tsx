import { getKlasifikasiAkun } from "@/actions/akun-keuangan"
import AkunKeuanganClient from "./AkunKeuanganClient"
import prisma from "@/lib/prisma"

export default async function AkunKeuanganPage() {
  const schoolUnits = await prisma.unitSekolah.findMany()
  // Untuk awal kita ambil dari unit pertama
  const initialUnitId = schoolUnits[0]?.id
  const data = initialUnitId ? await getKlasifikasiAkun(initialUnitId) : []

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Bagan Akun Keuangan</h1>
        <p className="page-subtitle">Kelola klasifikasi dan rincian akun keuangan (Chart of Accounts)</p>
      </div>

      <AkunKeuanganClient 
        initialData={data} 
        schoolUnits={schoolUnits}
        initialUnitId={initialUnitId}
      />
    </div>
  )
}
