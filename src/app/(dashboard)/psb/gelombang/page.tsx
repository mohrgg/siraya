import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { getGelombangPSBList } from "@/actions/psb"
import { getUnitSekolah, getTahunAkademikList, getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
import GelombangClient from "./GelombangClient"

export const metadata = {
  title: "Pengaturan Gelombang PSB - Siraya",
  description: "Manajemen gelombang pendaftaran, kuota, biaya formulir, dan diskon per unit"
}

export default async function GelombangPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const tenant = await getTenantContext()
  const allowedRoles = ["ADMIN", "TATA_USAHA"]
  if (!allowedRoles.includes(tenant.role)) {
    redirect("/")
  }

  const [gelombangList, units, tahunList, tahunAktif] = await Promise.all([
    getGelombangPSBList(),
    getUnitSekolah(),
    getTahunAkademikList(),
    getTahunAkademikAktif()
  ])

  return (
    <GelombangClient 
      initialGelombangList={gelombangList}
      units={units}
      tahunList={tahunList}
      tahunAktif={tahunAktif}
      userRole={tenant.role}
      userUnitId={tenant.unitId}
      isGlobal={tenant.isGlobal}
    />
  )
}
