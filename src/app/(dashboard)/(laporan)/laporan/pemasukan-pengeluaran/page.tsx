import LaporanPemasukanClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import { getTenantContext } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

export default async function LaporanPemasukanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolah()
  const tenant = await getTenantContext()
  
  return <LaporanPemasukanClient 
    pengaturan={pengaturan} 
    schoolUnits={schoolUnits}
    userRole={tenant.role}
    userUnitId={tenant.unitId === "all" ? undefined : (tenant.unitId || undefined)}
    userName={(user.name || undefined) as string | undefined}
  />
}
