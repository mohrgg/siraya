import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PembuatanTagihanClient from "./PembuatanTagihanClient"
import { 
  getTahunAkademikAktif, 
  getTahunAkademikList, 
  getUnitSekolah, 
  getAkunPendapatan 
} from "@/actions/pembuatan-tagihan"

import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'

import { getTenantContext } from "@/lib/tenant"

export default async function PembuatanTagihanPage() {
  const tenant = await getTenantContext()
  const user = tenant.user

  if (user?.role === "KEPALA_SEKOLAH") {
    redirect("/rekapitulasi-tunggakan")
  }

  const cookieStore = await cookies()
  const activeYearIdCookie = cookieStore.get("activeYearId")?.value
  
  // Resolve active unit first
  const activeUnitId = tenant.unitId || "all"
  
  const [
    tahunAkademikAktif,
    unitSekolahList,
    akunPendapatanList
  ] = await Promise.all([
    getTahunAkademikAktif(),
    getUnitSekolah(),
    getAkunPendapatan(activeUnitId)
  ])

  // Resolve active year
  const activeTahunAkademikId = activeYearIdCookie || (tahunAkademikAktif ? tahunAkademikAktif.id : "")
  
  // Find name for the title
  let activeTahunAkademikName = "Tidak Ada Tahun Aktif"
  if (tahunAkademikAktif && tahunAkademikAktif.id === activeTahunAkademikId) {
    activeTahunAkademikName = tahunAkademikAktif.name
  } else if (activeYearIdCookie) {
    // If we had a full list we could look it up, but since we don't fetch the full list here anymore unless needed,
    // let's fetch the specific year if it differs. Actually, we can just fetch getTahunAkademikList to find the name.
  }
  // Let's just fetch the list to get the name reliably
  const tahunAkademikList = await getTahunAkademikList()
  const foundYear = tahunAkademikList.find(y => y.id === activeTahunAkademikId)
  if (foundYear) activeTahunAkademikName = foundYear.name

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
