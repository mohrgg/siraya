import LaporanTunggakanClient from "./Client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { getPengaturan } from "@/actions/pengaturan"
import { getUnitSekolah } from "@/actions/unit-sekolah"
import { getTingkatan, getKelas } from "@/actions/kelas"
import { getTenantContext } from "@/lib/tenant"

export const dynamic = 'force-dynamic'

export default async function LaporanTunggakanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const user = session.user as any
  const pengaturan = await getPengaturan()
  const schoolUnits = await getUnitSekolah()
  const grades = await getTingkatan()
  const classrooms = await getKelas()
  const tenant = await getTenantContext()
  
  return <LaporanTunggakanClient 
    pengaturan={pengaturan} 
    schoolUnits={schoolUnits}
    grades={grades}
    classrooms={classrooms}
    userRole={tenant.role}
    userUnitId={tenant.unitId === "all" ? undefined : (tenant.unitId || undefined)}
    userName={(user.name || undefined) as string | undefined}
  />
}
