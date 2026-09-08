import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getKasBankAccounts, getPendapatanAccounts } from "@/actions/kas-masuk"
import { getUnitSekolahList } from "@/actions/pengaturan"
import TambahKasMasukClient from "./TambahKasMasukClient"
import { getTenantContext } from "@/lib/tenant"

export default async function TambahKasMasukPage() {
  const session = await auth()
  if (!session || !session.user) redirect("/login")
  const tenant = await getTenantContext()
  
  if (tenant.user?.role === "KEPALA_SEKOLAH" || tenant.user?.role === "YAYASAN") {
    redirect("/kas-masuk")
  }

  const kasBankAccounts = await getKasBankAccounts()
  const pendapatanAccounts = await getPendapatanAccounts()
  const schoolUnits = await getUnitSekolahList()

  return <TambahKasMasukClient 
    kasBankAccounts={kasBankAccounts} 
    pendapatanAccounts={pendapatanAccounts}
    schoolUnits={schoolUnits}
    userUnitId={tenant.unitId === "all" || tenant.unitId === null ? undefined : tenant.unitId}
  />
}
