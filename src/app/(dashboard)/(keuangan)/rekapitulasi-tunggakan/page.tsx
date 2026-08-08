import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import RekapitulasiTunggakanClient from "./RekapitulasiTunggakanClient"

export const metadata = {
  title: "Rekapitulasi Tagihan & Tunggakan | Sistem Informasi Sekolah",
}

export default async function RekapitulasiTunggakanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as any
  
  const cookieStore = await cookies()
  const activeUnitId = cookieStore.get("activeUnitId")?.value || (user.unitSekolahId ? user.unitSekolahId : "")
  
  const tahunAkademikAktif = await getTahunAkademikAktif()
  const pengaturan = await getPengaturan()
  const units = await getUnitSekolah()
  
  let activeTahunAkademikId = tahunAkademikAktif ? tahunAkademikAktif.id : ""
  let activeTahunAkademikName = "Tidak Ada Tahun Aktif"
  
  if (tahunAkademikAktif) {
    activeTahunAkademikName = tahunAkademikAktif.name
  }

  const activeUnit = units.find(u => u.id === activeUnitId)
  const activeUnitName = activeUnit ? activeUnit.name : "SEMUA UNIT"

  return (
    <RekapitulasiTunggakanClient 
      activeUnitId={activeUnitId}
      activeUnitName={activeUnitName}
      activeTahunAkademikId={activeTahunAkademikId}
      activeTahunAkademikName={activeTahunAkademikName}
      pengaturan={pengaturan}
      unitInfo={activeUnit}
      userName={user.name || undefined}
    />
  )
}
