import { getKlasifikasiAkun, getSubKlasifikasiAkun, getAkunDetail } from "@/actions/akun-keuangan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import AkunKeuanganClient from "./AkunKeuanganClient"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

export default async function AkunKeuanganPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  
  // Fetch context and units first
  const [tenant, unitSekolah] = await Promise.all([
    getTenantContext(),
    getUnitSekolah()
  ])

  // Determine active unit ID for the page
  let activeUnitId = tenant.unitId
  if (tenant.isGlobal) {
    const queryUnitId = typeof resolvedSearchParams.unitId === 'string' ? resolvedSearchParams.unitId : undefined
    activeUnitId = queryUnitId || (unitSekolah[0]?.id)
  }

  // Fetch financial data based on active unit
  const [klasifikasi, subKlasifikasi, akunDetail] = await Promise.all([
    getKlasifikasiAkun(activeUnitId || undefined),
    getSubKlasifikasiAkun(activeUnitId || undefined),
    getAkunDetail(activeUnitId || undefined),
  ])

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">Bagan Akun Keuangan</h1>
        <p className="text-text-muted">Kelola struktur klasifikasi dan daftar akun transaksi Yayasan</p>
      </div>
      <AkunKeuanganClient 
        initialKlasifikasi={klasifikasi} 
        initialSubKlasifikasi={subKlasifikasi} 
        initialAkunDetail={akunDetail}
        unitSekolahList={unitSekolah}
        userRole={tenant.role}
        userUnitId={tenant.unitId}
        isGlobal={tenant.isGlobal}
        activeUnitId={activeUnitId}
      />
    </div>
  )
}
