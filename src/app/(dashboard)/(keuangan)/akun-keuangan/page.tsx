import { getKlasifikasiAkun, getSubKlasifikasiAkun, getAkunDetail } from "@/actions/akun-keuangan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import AkunKeuanganClient from "./AkunKeuanganClient"
import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant"

export default async function AkunKeuanganPage() {
  const session = await auth()
  
  // Fetch data in parallel
  const [klasifikasi, subKlasifikasi, akunDetail, unitSekolah, tenant] = await Promise.all([
    getKlasifikasiAkun(),
    getSubKlasifikasiAkun(),
    getAkunDetail(),
    getUnitSekolah(),
    getTenantContext()
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
      />
    </div>
  )
}
