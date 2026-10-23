import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { getPendaftarPSBList, getGelombangPSBList } from "@/actions/psb"
import { getUnitSekolah, getTahunAkademikList, getTahunAkademikAktif } from "@/actions/pembuatan-tagihan"
import { getAkunKasBankList } from "@/actions/pembayaran-tagihan"
import DaftarUlangClient from "./DaftarUlangClient"

export const metadata = {
  title: "Daftar Ulang & Tagihan PSB - Siraya",
  description: "Verifikasi berkas, perhitungan diskon gelombang, dan aktivasi murid ke database akademik"
}

export default async function DaftarUlangPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const tenant = await getTenantContext()
  const allowedRoles = ["ADMIN", "TATA_USAHA", "KEPALA_SEKOLAH"]
  if (!allowedRoles.includes(tenant.role)) {
    redirect("/")
  }

  const [pendaftarData, gelombangList, units, tahunList, tahunAktif, akunKasList] = await Promise.all([
    getPendaftarPSBList({ limit: 50 }),
    getGelombangPSBList(),
    getUnitSekolah(),
    getTahunAkademikList(),
    getTahunAkademikAktif(),
    getAkunKasBankList(tenant.isGlobal ? undefined : (tenant.unitId || undefined))
  ])

  return (
    <DaftarUlangClient 
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
