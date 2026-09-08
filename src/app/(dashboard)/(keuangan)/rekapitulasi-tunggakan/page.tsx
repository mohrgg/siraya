import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import RekapitulasiTunggakanClient from "./RekapitulasiTunggakanClient"

import { getTenantContext } from "@/lib/tenant"

export const metadata = {
  title: "Rekapitulasi Tagihan & Tunggakan | Sistem Informasi Sekolah",
}

export default async function RekapitulasiTunggakanPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams
  const tenant = await getTenantContext()
  const user = tenant.user
  const units = await getUnitSekolah()

  let activeUnitId = tenant.unitId || "all"
  if ((tenant.role === "ADMIN" || tenant.role === "YAYASAN") && searchParams?.unitId) {
    const matched = units.find(u => u.id === searchParams.unitId)
    if (matched) {
      activeUnitId = matched.id
    }
  }
  
  const tahunAkademikAktif = await getTahunAkademikAktif()
  const pengaturan = await getPengaturan()
  
  let activeTahunAkademikId = tahunAkademikAktif ? tahunAkademikAktif.id : ""
  let activeTahunAkademikName = "Tidak Ada Tahun Aktif"
  
  if (tahunAkademikAktif) {
    activeTahunAkademikName = tahunAkademikAktif.name
  }

  const activeUnit = units.find(u => u.id === activeUnitId)
  const activeUnitName = activeUnit ? activeUnit.name : "SEMUA UNIT (KONSOLIDASI)"

  return (
    <RekapitulasiTunggakanClient 
      activeUnitId={activeUnitId}
      activeUnitName={activeUnitName}
      activeTahunAkademikId={activeTahunAkademikId}
      activeTahunAkademikName={activeTahunAkademikName}
      pengaturan={pengaturan}
      unitInfo={activeUnit}
      userName={user.name || undefined}
      userRole={tenant.role}
    />
  )
}
