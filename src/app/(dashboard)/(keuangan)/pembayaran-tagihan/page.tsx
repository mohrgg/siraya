import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PembayaranTagihanClient from "./PembayaranTagihanClient"
import { cookies } from "next/headers"
import { getAkunKasBankList } from "@/actions/pembayaran-tagihan"
import { getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"

export const metadata = {
  title: "Pembayaran Tagihan | Sistem Informasi Sekolah",
}

export default async function PembayaranTagihanPage() {
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

  // Get available kas/bank accounts for payment modal
  const akunKasBankList = await getAkunKasBankList(activeUnitId)
  
  // Get pengaturan and unitInfo for Receipt/PDF
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolah()
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
