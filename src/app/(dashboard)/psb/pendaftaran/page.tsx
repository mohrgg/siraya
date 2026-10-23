import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { getPendaftarPSBList, getGelombangPSBList } from "@/actions/psb"
import { getUnitSekolah, getTahunAkademikList, getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
import { getAkunKasBankList } from "@/actions/pembayaran-tagihan"
import PendaftaranClient from "./PendaftaranClient"

export const metadata = {
  title: "Loket & Pendaftaran Formulir PSB - Siraya",
  description: "Loket penjualan formulir fisik, pencatatan kas masuk, dan pendaftaran calon siswa"
}

export default async function PendaftaranPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const tenant = await getTenantContext()
  const allowedRoles = ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"]
  if (!allowedRoles.includes(tenant.role)) {
    redirect("/")
  }

  const [pendaftarData, gelombangList, units, tahunList, tahunAktif, akunKasList] = await Promise.all([
    getPendaftarPSBList(),
    getGelombangPSBList(),
    getUnitSekolah(),
    getTahunAkademikList(),
    getTahunAkademikAktif(),
    getAkunKasBankList(tenant.isGlobal ? undefined : (tenant.unitId || undefined))
  ])

  return (
    <PendaftaranClient 
      initialPendaftarData={pendaftarData}
      gelombangList={gelombangList}
      units={units}
      tahunList={tahunList}
      tahunAktif={tahunAktif}
      initialAkunKasList={akunKasList}
      userRole={tenant.role}
      userUnitId={tenant.unitId}
      isGlobal={tenant.isGlobal}
    />
  )
}
