import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PembayaranTagihanClient from "./PembayaranTagihanClient"
import { cookies } from "next/headers"
import { getAkunKasBankList } from "@/actions/pembayaran-tagihan"
import { getTahunAkademikAktif, getTahunAkademikList } from "@/actions/pembuatan-tagihan"
import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"

import { getTenantContext } from "@/lib/tenant"

export const metadata = {
  title: "Pembayaran Tagihan | Sistem Informasi Sekolah",
}

export default async function PembayaranTagihanPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams
  const tenant = await getTenantContext()
  const user = tenant.user

  if (user?.role === "KEPALA_SEKOLAH" || user?.role === "YAYASAN") {
    redirect("/rekapitulasi-tunggakan")
  }

  const activeUnitId = tenant.unitId || "all"
  
  const cookieStore = await cookies()
  const activeYearIdCookie = cookieStore.get("activeYearId")?.value

  const [
    tahunAkademikAktif,
    tahunAkademikList,
    akunKasBankList,
    pengaturan,
    schoolUnits
  ] = await Promise.all([
    getTahunAkademikAktif(),
    getTahunAkademikList(),
    getAkunKasBankList(activeUnitId),
    getPengaturan(),
    getUnitSekolah()
  ])
  
  const activeTahunAkademikId = searchParams?.tahunAkademikId || activeYearIdCookie || (tahunAkademikAktif ? tahunAkademikAktif.id : "")
  
  let activeTahunAkademikName = "Tidak Ada Tahun Aktif"
  const foundYear = tahunAkademikList.find(y => y.id === activeTahunAkademikId)
  if (foundYear) {
    activeTahunAkademikName = foundYear.name
  } else if (tahunAkademikAktif) {
    activeTahunAkademikName = tahunAkademikAktif.name
  }
  const unitInfo = schoolUnits.find((u: any) => u.id === activeUnitId) || null

  return (
    <PembayaranTagihanClient 
      activeUnitId={activeUnitId}
      activeTahunAkademikId={activeTahunAkademikId}
      activeTahunAkademikName={activeTahunAkademikName}
      akunKasBankList={akunKasBankList}
      user={user}
      pengaturan={pengaturan}
      unitInfo={unitInfo}
    />
  )
}
