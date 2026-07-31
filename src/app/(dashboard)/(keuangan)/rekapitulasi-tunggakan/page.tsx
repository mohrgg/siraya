import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
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
  
  let activeTahunAkademikId = tahunAkademikAktif ? tahunAkademikAktif.id : ""
  let activeTahunAkademikName = "Tidak Ada Tahun Aktif"
  
  if (tahunAkademikAktif) {
    activeTahunAkademikName = tahunAkademikAktif.name
  }

  return (
    <RekapitulasiTunggakanClient 
      activeUnitId={activeUnitId}
      activeTahunAkademikId={activeTahunAkademikId}
      activeTahunAkademikName={activeTahunAkademikName}
    />
  )
}
