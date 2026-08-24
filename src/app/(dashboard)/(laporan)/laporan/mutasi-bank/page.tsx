import LaporanMutasiBankClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import { getAkunDetail } from "@/actions/akun-keuangan"
import { getTenantContext } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

export default async function LaporanMutasiBankPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolah()
  const allAkun = await getAkunDetail()
  const tenant = await getTenantContext()
  
  // Filter only Bank Accounts
  const akunKasBank = allAkun.filter(a => a.isKasBank)
  
  return <LaporanMutasiBankClient 
    pengaturan={pengaturan} 
    schoolUnits={schoolUnits}
    akunKasBank={akunKasBank}
    userRole={tenant.role}
    userUnitId={tenant.unitId === "all" ? undefined : (tenant.unitId || undefined)}
    userName={(user.name || undefined) as string | undefined}
    isGlobal={tenant.isGlobal}
  />
}
