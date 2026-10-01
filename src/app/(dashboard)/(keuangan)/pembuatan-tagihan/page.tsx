import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PembuatanTagihanClient from "./PembuatanTagihanClient"
import { 
  getTahunAkademikList, 
  getAkunPendapatan 
} from "@/actions/pembuatan-tagihan"

import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

import { getTenantContext } from "@/lib/tenant"

export default async function PembuatanTagihanPage() {
  const tenant = await getTenantContext()
  const user = tenant.user

  if (user?.role === "KEPALA_SEKOLAH" || user?.role === "YAYASAN") {
    redirect("/rekapitulasi-tunggakan")
  }

  const cookieStore = await cookies()
  const activeYearIdCookie = cookieStore.get("activeYearId")?.value
  
  // Resolve active unit first
  const activeUnitId = tenant.unitId || "all"
  
  const [
    tahunAkademikList,
    akunPendapatanList
  ] = await Promise.all([
    getTahunAkademikList(),
    getAkunPendapatan(activeUnitId)
  ])

  // Resolve active year from list
  const activeTahunAkademik = tahunAkademikList.find(y => y.isActive)
  const activeTahunAkademikId = activeYearIdCookie || (activeTahunAkademik ? activeTahunAkademik.id : "")
  
  const foundYear = tahunAkademikList.find(y => y.id === activeTahunAkademikId)
  const activeTahunAkademikName = foundYear ? foundYear.name : (activeTahunAkademik ? activeTahunAkademik.name : "Tidak Ada Tahun Aktif")

  return (
    <PembuatanTagihanClient 
      activeUnitId={activeUnitId}
      activeTahunAkademikId={activeTahunAkademikId}
      activeTahunAkademikName={activeTahunAkademikName}
      akunPendapatanList={akunPendapatanList}
      user={user}
    />
  )
}
