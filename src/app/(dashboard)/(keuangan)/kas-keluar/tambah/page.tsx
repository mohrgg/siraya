import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasBankAccounts, getPengeluaranAccounts, getDivisiList, getPenggunaList } from "@/actions/kas-keluar"
import { getUnitSekolahList } from "@/actions/pengaturan"
import TambahKasKeluarClient from "./TambahKasKeluarClient"
import { getTenantContext } from "@/lib/tenant"

export default async function TambahKasKeluarPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  const tenant = await getTenantContext()
  
  if (tenant.user?.role === "KEPALA_SEKOLAH") {
    redirect("/kas-keluar")
  }

  const kasBankAccounts = await getKasBankAccounts()
  const pengeluaranAccounts = await getPengeluaranAccounts()
  const divisiList = await getDivisiList()
  const penggunaList = await getPenggunaList()
  const schoolUnits = await getUnitSekolahList()

  return (
    <TambahKasKeluarClient 
      kasBankAccounts={kasBankAccounts} 
      pengeluaranAccounts={pengeluaranAccounts} 
      divisiList={divisiList}
      penggunaList={penggunaList}
      schoolUnits={schoolUnits}
      userUnitId={tenant.unitId === "all" || tenant.unitId === null ? undefined : tenant.unitId}
    />
  )
}
